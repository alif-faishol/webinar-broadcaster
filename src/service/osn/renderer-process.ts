import { ipcRenderer } from 'electron';

const init = async () => {
  const result = await ipcRenderer.invoke('osn-init');

  return result;
};

const getCameraInput = async () => {
  const result = await ipcRenderer.invoke('osn-get-camera-input');

  return result;
};

const getDisplayInput = async () => {
  const result = await ipcRenderer.invoke('osn-get-display-input');

  return result;
};

const OSN = { init, getCameraInput, getDisplayInput };

export default OSN;
