import { ipcRenderer } from 'electron';
import {
  AddItemArgs,
  GetItemArgs,
  TransformItemArgs,
  SerializableSceneItem,
  RemoveArgs,
  RemoveItemArgs,
} from './main';

const create = async (): Promise<string> => {
  return ipcRenderer.invoke('osn-scene-create');
};

const remove = async (args: RemoveArgs): Promise<string> => {
  return ipcRenderer.invoke('osn-scene-remove', args);
};

const addItem = async (args: AddItemArgs): Promise<SerializableSceneItem> => {
  return ipcRenderer.invoke('osn-scene-add-item', args);
};

const getItem = async (args: GetItemArgs): Promise<SerializableSceneItem> => {
  return ipcRenderer.invoke('osn-scene-get-item', args);
};

const removeItem = async (args: RemoveItemArgs): Promise<void> => {
  return ipcRenderer.invoke('osn-scene-remove-item', args);
};

const transformItem = async (
  args: TransformItemArgs
): Promise<SerializableSceneItem> => {
  return ipcRenderer.invoke('osn-scene-transform-item', args);
};

export default {
  create,
  remove,
  addItem,
  getItem,
  removeItem,
  transformItem,
};
