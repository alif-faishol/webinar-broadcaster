/* eslint-disable import/prefer-default-export */
import electron, { IpcMainInvokeEvent } from 'electron';

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
