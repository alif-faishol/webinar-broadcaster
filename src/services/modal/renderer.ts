import { ipcRenderer, IpcRendererEvent } from 'electron';
import { SceneItem } from '../app/types';

type OpenModal = {
  (type: 'add-item', args?: undefined): Promise<undefined>;
  (type: 'add-scene', args?: undefined): Promise<string | undefined>;
  (type: 'element-advanced-settings', args: SceneItem): Promise<undefined>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const openModal: OpenModal = (type: string, args): Promise<any> =>
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
