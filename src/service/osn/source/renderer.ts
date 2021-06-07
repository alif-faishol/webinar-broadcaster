import { ipcRenderer } from 'electron';
import { CreateDisplaySourceArgs } from './main';

const getTypes = async (): Promise<string[]> => {
  return ipcRenderer.invoke('osn-source-get-types');
};

const getDisplayList = async (): Promise<Array<unknown>> => {
  return ipcRenderer.invoke('osn-source-get-display-list');
};

const getCameraList = async (): Promise<Array<unknown>> => {
  return ipcRenderer.invoke('osn-source-get-camera-list');
};

const createDisplaySource = async (
  args: CreateDisplaySourceArgs
): Promise<string> => {
  return ipcRenderer.invoke('osn-source-create-display-source', args);
};

export default {
  getTypes,
  getDisplayList,
  getCameraList,
  createDisplaySource,
};
