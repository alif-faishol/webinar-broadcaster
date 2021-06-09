import { ipcRenderer } from 'electron';
import {
  CreateDisplaySourceArgs,
  CreateSourceArgs,
  GetSourceProperties,
  SerializableSource,
  SetSourceSettingsArgs,
} from './main';

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

const createSource = async (
  args: CreateSourceArgs
): Promise<SerializableSource> => {
  return ipcRenderer.invoke('osn-source-create', args);
};

const setSourceSettings = async (
  args: SetSourceSettingsArgs
): Promise<void> => {
  return ipcRenderer.invoke('osn-source-set-settings', args);
};

const getSourceProperties = async (args: GetSourceProperties): Promise<any> => {
  return ipcRenderer.invoke('osn-source-get-properties', args);
};

export default {
  getTypes,
  createSource,
  setSourceSettings,
  getDisplayList,
  getCameraList,
  createDisplaySource,
  getSourceProperties,
};
