import { ipcRenderer, IpcRendererEvent } from 'electron';

type OpenModal = {
  (type: 'add-item', args?: undefined): Promise<void>;
  (type: 'add-scene', args?: undefined): Promise<string | undefined>;
};

const openModal: OpenModal = (type: any, args: any): Promise<any> =>
  new Promise((resolve) => {
    ipcRenderer.once(
      'modal-close',
      (_event: IpcRendererEvent, argsFromMain) => {
        resolve(argsFromMain);
      }
    );
    ipcRenderer.invoke('modal-open', { type, args });
  });

export default openModal;
