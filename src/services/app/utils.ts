import electron, { IpcMainEvent, IpcMainInvokeEvent } from 'electron';
import * as osn from 'obs-studio-node';
import { BehaviorSubject } from 'rxjs';

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
  TArgs extends never[],
  TFn extends (...args: TArgs) => Promise<TReturn>
>(
  target: { event?: IpcMainInvokeEvent },
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<TFn>
) {
  const fn = descriptor.value;
  if (!fn) throw Error('no method for callableFromRenderer');

  const channelId = `${target.constructor.name}-${propertyKey.toString()}`;

  if (process.type === 'browser' && electron.ipcMain) {
    electron.ipcMain.handle(channelId, (event: IpcMainInvokeEvent, ...args) => {
      return fn.apply({ ...target, event }, args as TArgs);
    });
    return descriptor;
  }

  descriptor.value = ((...args) => {
    return electron.ipcRenderer.invoke(channelId, ...args);
  }) as TFn;
  return descriptor;
}

export type ObservableMainProcProperty<T> = {
  getValue: () => T;
  subscribe: (fn: (value: T) => void) => () => void;
};

export const ObservableMainProc = <T>(defaultValue: T) => {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return (target: Object, propertyKey: string) => {
    const channelId = `ObservableMainProc-${
      target.constructor.name
    }-${propertyKey.toString()}`;

    let subject: BehaviorSubject<T> | undefined;
    let rendererSubscribers: Array<(value: T) => void> = [];
    if (process.type === 'browser' && electron.ipcMain) {
      subject = new BehaviorSubject(defaultValue);
      const subscribers: Map<string, IpcMainEvent> = new Map();

      subject.subscribe((newValue) => {
        subscribers.forEach((event) => {
          event.reply(`newValue-${channelId}`, newValue);
        });
      });

      electron.ipcMain.on(`getValue-${channelId}`, (event) => {
        event.returnValue = subject?.getValue();
      });

      electron.ipcMain.on(`subscribe-${channelId}`, (event) => {
        subscribers.set(`${event.processId}-${event.frameId}`, event);
      });

      electron.ipcMain.on(`newValue-${channelId}`, (_event, newValue) => {
        subject?.next(newValue);
      });
    } else {
      electron.ipcRenderer.on(`newValue-${channelId}`, (_event, arg) => {
        rendererSubscribers.forEach((fn) => {
          fn(arg);
        });
      });
    }

    const value: ObservableMainProcProperty<T> = {
      getValue: () =>
        subject
          ? subject.getValue()
          : electron.ipcRenderer.sendSync(`getValue-${channelId}`),
      subscribe: (fn) => {
        if (subject) {
          const subscription = subject.subscribe(fn);
          return subscription.unsubscribe;
        }
        electron.ipcRenderer.send(`subscribe-${channelId}`);
        rendererSubscribers.push(fn);
        return () => {
          rendererSubscribers = rendererSubscribers.filter(
            (subscriber) => subscriber !== fn
          );
        };
      },
    };

    Object.defineProperty(target, propertyKey, {
      get: () => value,
      set: (newValue: T) => {
        if (subject) {
          subject.next(newValue);
        }
        electron.ipcRenderer.send(`newValue-${channelId}`, newValue);
      },
    });
  };
};

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
