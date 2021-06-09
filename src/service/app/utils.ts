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
 *
 * WARNING: currently decorated method cannot use "this"
 */
export function callableFromRenderer<
  TReturn,
  TArgs extends any[],
  TFn extends (...args: TArgs) => Promise<TReturn>
>(
  // eslint-disable-next-line @typescript-eslint/ban-types
  target: Object,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<TFn>
) {
  const fn = descriptor.value;
  if (!fn) throw Error('no method for callableFromRenderer');

  const channelId = `${target.constructor.name}-${propertyKey.toString()}`;
  if (process.type === 'browser' && electron.ipcMain) {
    electron.ipcMain.handle(channelId, (event: IpcMainInvokeEvent, ...args) => {
      return fn.apply(event, args as TArgs);
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

export default {
  setSetting,
};
