import electron from 'electron';

abstract class BroadcasterServiceModule {
  abstract registerIpcMethods(): {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: (...args: any[]) => Promise<any>;
  };

  constructor() {
    Object.entries(this.registerIpcMethods()).forEach(([fnName, fn]) => {
      electron.ipcMain.handle(
        `${this.constructor.name}-${fnName}`,
        (_event, ...args) => fn(...args)
      );
    });
  }

  getIpcMethods(): ReturnType<this['registerIpcMethods']> {
    return (
      Object.keys(this.registerIpcMethods())
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map<[string, (...args: any[]) => Promise<any>]>((fnName) => [
          fnName,
          (...args) =>
            electron.ipcRenderer.invoke(
              `${this.constructor.name}-${fnName}`,
              args
            ),
        ])
        .reduce((obj, cur) => {
          return {
            ...obj,
            [cur[0]]: cur[1],
          };
        }, {} as ReturnType<this['registerIpcMethods']>)
    );
  }
}

export default BroadcasterServiceModule;
