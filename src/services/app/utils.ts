import electron, { IpcMainInvokeEvent } from 'electron';
import * as osn from 'obs-studio-node';

interface ISettingParam {
  name: string;
  currentValue: string;
}

interface ISubCategorySetting {
  nameSubCategory: string;
  parameters: ISettingParam;
}

export const setSetting = (
  category: string,
  subCategory: string,
  parameter: string,
  value: string
) => {
  const categorySettings = osn.NodeObs.OBS_settings_getSettings(category).data;

  const subCategorySettings = categorySettings.find(
    (subCategorySetting: ISubCategorySetting) =>
      subCategorySetting.nameSubCategory === subCategory
  );
  if (!subCategorySettings) throw Error('Sub Category not found!');

  const setting = subCategorySettings.parameters.find(
    (param: ISettingParam) => param.name === parameter
  );
  if (!setting) throw Error('Setting with specified param not found!');

  setting.currentValue = value;

  osn.NodeObs.OBS_settings_saveSettings(category, categorySettings);
};

/**
 * Handle calls from renderer using electron IPC
 */
export function callableFromRenderer<
  TReturn,
  TArgs extends any[],
  TFn extends (...args: TArgs) => Promise<TReturn>
>(
  // eslint-disable-next-line @typescript-eslint/ban-types
  target: { event?: IpcMainInvokeEvent },
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<TFn>
) {
  const fn = descriptor.value;
  if (!fn) throw Error('no method for callableFromRenderer');

  const channelId = `${target.constructor.name}-${propertyKey.toString()}`;

  if (process.type === 'browser' && electron.ipcMain) {
    electron.ipcMain.handle(channelId, (event: IpcMainInvokeEvent, ...args) => {
      if (target) target.event = event;
      return fn.apply(target, args as TArgs);
    });
    return descriptor;
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  descriptor.value = (...args) => {
    return electron.ipcRenderer.invoke(channelId, ...args);
  };
  return descriptor;
}

export const serializeProperties = (
  osnProperties: osn.IProperties
): Array<Omit<osn.IProperty, 'next' | 'modified'>> => {
  const properties = [];
  let iterableProperties = osnProperties.first();
  while (iterableProperties) {
    properties.push({
      name: iterableProperties.name,
      description: iterableProperties.description,
      enabled: iterableProperties.enabled,
      longDescription: iterableProperties.longDescription,
      status: iterableProperties.status,
      type: iterableProperties.type,
      value: iterableProperties.value,
      visible: iterableProperties.visible,
      details:
        'format' in iterableProperties.details
          ? iterableProperties.details
          : undefined,
    });
    iterableProperties = iterableProperties.next();
  }
  return properties;
};

export default {};
