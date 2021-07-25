import electron from 'electron';
import { processTypeIs } from '../utils/decorator';

abstract class BroadcasterServiceModule {
  abstract registerIpcMethods(): {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: (...args: any[]) => Promise<any>;
  };

  constructor() {
    if (process.type !== 'browser') return;
    Object.entries(this.registerIpcMethods()).forEach(([fnName, fn]) => {
      electron.ipcMain.handle(
        `BROADCASTER_MODULE_IPC_${this.constructor.name}-${fnName}`,
        (_event, ...args) => fn(...args)
      );
    });
  }

  @processTypeIs('renderer')
  getIpcRendererMethods(): ReturnType<this['registerIpcMethods']> {
    return Object.keys(this.registerIpcMethods())
      .map<[string, (...args: unknown[]) => Promise<unknown>]>((fnName) => [
        fnName,
        (...args) => {
          return electron.ipcRenderer.invoke(
            `BROADCASTER_MODULE_IPC_${this.constructor.name}-${fnName}`,
            ...args
          );
        },
      ])
      .reduce((obj, cur) => {
        return {
          ...obj,
          [cur[0]]: cur[1],
        };
      }, {} as ReturnType<this['registerIpcMethods']>);
  }
}

export default BroadcasterServiceModule;
