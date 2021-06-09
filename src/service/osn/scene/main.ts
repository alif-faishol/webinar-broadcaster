import { ipcMain, IpcMainInvokeEvent } from 'electron';
import * as osn from 'obs-studio-node';
import { v4 as uuid } from 'uuid';
import { initialized } from '../general/main';
import { SerializableSource, serializeSource } from '../source/main';

export type SceneItemTransformValues = {
  scale: { x: number; y: number };
  position: { x: number; y: number };
  rotation: number;
  crop: { top: number; right: number; bottom: number; left: number };
};

export type SerializableSceneItem = SceneItemTransformValues & {
  id: number;
  source: SerializableSource;
};

const serializeSceneItem = (
  sceneItem: osn.ISceneItem
): SerializableSceneItem => {
  return {
    id: sceneItem.id,
    source: serializeSource(sceneItem.source),
    scale: sceneItem.scale,
    position: sceneItem.position,
    rotation: sceneItem.rotation,
    crop: sceneItem.crop,
  };
};

const create = () => {
  try {
    if (!initialized.getValue()) throw Error('Not initialized!');

    const scene = osn.SceneFactory.create(uuid());
    return scene.name;
  } catch (err) {
    throw Error(err.message);
  }
};

export type RemoveArgs = {
  sceneId: string;
};

const remove = (_event: IpcMainInvokeEvent, { sceneId }: RemoveArgs) => {
  try {
    const scene = osn.SceneFactory.fromName(sceneId);
    scene.remove();
  } catch (err) {
    throw Error(err.message);
  }
};

export type AddItemArgs = {
  sceneId: string;
  sourceId: string;
};

const addItem = (
  _event: IpcMainInvokeEvent,
  { sceneId, sourceId }: AddItemArgs
): SerializableSceneItem => {
  try {
    if (!initialized.getValue()) throw Error('Not initialized!');

    const scene = osn.SceneFactory.fromName(sceneId);
    if (!scene) throw Error('Scene not found!');
    const source = osn.InputFactory.fromName(sourceId);
    const sceneItem = scene.add(source);

    return serializeSceneItem(sceneItem);
  } catch (err) {
    throw Error(err.message);
  }
};

export type GetItemArgs = {
  sceneId: string;
  itemId: number;
};

const getItem = (
  _event: IpcMainInvokeEvent,
  { sceneId, itemId }: GetItemArgs
): SerializableSceneItem => {
  try {
    if (!initialized.getValue()) throw Error('Not initialized!');

    const scene = osn.SceneFactory.fromName(sceneId);
    if (!scene) throw Error('Scene not found!');
    const sceneItem = scene.getItems().find((item) => item.id === itemId);
    if (!sceneItem) throw Error('Item not found!');
    return serializeSceneItem(sceneItem);
  } catch (err) {
    throw Error(err.message);
  }
};

export type RemoveItemArgs = {
  sceneId: string;
  itemId: number;
};

const removeItem = (
  _event: IpcMainInvokeEvent,
  { sceneId, itemId }: GetItemArgs
) => {
  try {
    const scene = osn.SceneFactory.fromName(sceneId);
    if (!scene) throw Error('Scene not found!');
    const sceneItem = scene.getItems().find((item) => item.id === itemId);
    if (!sceneItem) throw Error('Item not found!');
    sceneItem.source.release();
    sceneItem.remove();
  } catch (err) {
    throw Error(err.message);
  }
};

export type TransformItemArgs = {
  sceneId: string;
  itemId: number;
  transformValues: Partial<SceneItemTransformValues>;
};

const transformItem = (
  _event: IpcMainInvokeEvent,
  { sceneId, itemId, transformValues }: TransformItemArgs
): SerializableSceneItem => {
  try {
    if (!initialized.getValue()) throw Error('Not initialized!');

    const scene = osn.SceneFactory.fromName(sceneId);
    const sceneItem = scene.getItems().find((item) => item.id === itemId);
    if (!sceneItem) throw Error('Item not found!');
    if (transformValues.crop) sceneItem.crop = transformValues.crop;
    if (transformValues.position) sceneItem.position = transformValues.position;
    if (transformValues.rotation) sceneItem.rotation = transformValues.rotation;
    if (transformValues.scale) sceneItem.scale = transformValues.scale;
    return serializeSceneItem(sceneItem);
  } catch (err) {
    throw Error(err.message);
  }
};

ipcMain.handle('osn-scene-create', create);
ipcMain.handle('osn-scene-remove', remove);
ipcMain.handle('osn-scene-add-item', addItem);
ipcMain.handle('osn-scene-get-item', getItem);
ipcMain.handle('osn-scene-remove-item', removeItem);
ipcMain.handle('osn-scene-transform-item', transformItem);
