import { v4 as uuid } from 'uuid';
import * as osn from 'obs-studio-node';
import { backOff } from 'exponential-backoff';
import {
  CustomItem,
  SceneItem,
  SceneItemTransformValues,
  SerializableSceneItem,
} from './types';
import { callableFromRenderer } from './utils';
import SourceService from './SourceService';
import stateSubject, { setState } from './AppState';

class SceneService {
  static serializeSceneItem(sceneItem: osn.ISceneItem): SerializableSceneItem {
    return {
      id: sceneItem.id,
      source: SourceService.serializeSource(sceneItem.source),
      scale: sceneItem.scale,
      position: sceneItem.position,
      rotation: sceneItem.rotation,
      crop: sceneItem.crop,
    };
  }

  @callableFromRenderer
  async add(name: string) {
    try {
      const osnScene = osn.SceneFactory.create(uuid());
      const newScene = { id: osnScene.name, items: [], name };
      setState((ps) => {
        return {
          ...ps,
          scenes: [...ps.scenes, newScene],
        };
      });
      return newScene;
    } catch (err) {
      throw Error(err.message);
    }
  }

  @callableFromRenderer
  async remove(sceneId: string) {
    try {
      const osnScene = osn.SceneFactory.fromName(sceneId);
      osnScene.remove();
      setState((ps) => {
        return {
          ...ps,
          scenes: ps.scenes.filter((scene) => scene.id === sceneId),
        };
      });
    } catch (err) {
      throw Error(err.message);
    }
  }

  @callableFromRenderer
  async activate(sceneId: string) {
    try {
      const state = stateSubject.getValue();
      const scene = state.scenes.find(({ id }) => id === sceneId);
      const osnScene = osn.SceneFactory.fromName(sceneId);
      osn.Global.setOutputSource(1, osnScene);
      setState((ps) => ({ ...ps, activeScene: scene }));
    } catch (err) {
      throw Error(err.message);
    }
  }

  @callableFromRenderer
  async addItem(name: string, item: CustomItem | string, sceneId?: string) {
    const state = stateSubject.getValue();
    const scene = state.scenes.find(
      ({ id }) => id === (sceneId || state.activeScene?.id)
    );
    if (!scene) throw Error('scene or activeScene not found');

    if (typeof item !== 'string') {
      // item is CustomItem
      scene.items = [item, ...scene.items];
    } else {
      // item is an OBS SourceType
      try {
        const osnSource = osn.InputFactory.create(item, uuid());
        const osnScene = osn.SceneFactory.fromName(scene.id);
        if (!osnScene) throw Error('scene not found in OBS');
        const sceneItem = await backOff(async () => {
          const si = osnScene.add(osnSource);
          if (si.source.width === 0) throw Error('Invalid Source: width = 0');
          return SceneService.serializeSceneItem(si);
        });
        scene.items = [{ ...sceneItem, name }, ...scene.items];
        await new SceneService().transformItem(scene.id, sceneItem.id, {
          scale: {
            x: 1920 / sceneItem.source.width,
            y: 1080 / sceneItem.source.height,
          },
        });
      } catch (err) {
        throw Error(err.message);
      }
    }
    setState(state);
  }

  @callableFromRenderer
  async removeItem(sceneId: string, itemId: number | string) {
    const state = stateSubject.getValue();
    const scene = state.scenes.find(({ id }) => id === sceneId);
    if (!scene) throw Error('Scene not found!');
    if (typeof itemId === 'number') {
      const osnScene = osn.SceneFactory.fromName(scene.id);
      if (!osnScene) throw Error('scene not found in OBS');
      const osnSceneItem = osnScene.getItems().find(({ id }) => id === itemId);
      if (!osnSceneItem) throw Error('scene item not found in OBS');
      osnSceneItem.source.release();
      osnSceneItem.source.remove();
      osnSceneItem.remove();
    }
    scene.items = scene.items.filter((item) => item.id !== itemId);
    setState(state);
    return itemId;
  }

  @callableFromRenderer
  async transformItem(
    sceneId: string,
    itemId: number | string,
    transformFnOrValues:
      | ((item: SceneItem) => Partial<SceneItemTransformValues>)
      | Partial<SceneItemTransformValues>
  ) {
    const state = stateSubject.getValue();
    const scene = state.scenes.find(({ id }) => id === sceneId);
    if (!scene) throw Error('Scene not found!');
    const sceneItemIndex = scene.items.findIndex((item) => item.id === itemId);
    if (sceneItemIndex === -1) throw Error('Scene item not found!');
    const sceneItem = scene.items[sceneItemIndex];

    const transformValues =
      typeof transformFnOrValues === 'function'
        ? transformFnOrValues(sceneItem)
        : transformFnOrValues;

    const updatedSceneItem = { ...sceneItem, ...transformValues };
    if (typeof itemId === 'number') {
      try {
        const osnScene = osn.SceneFactory.fromName(scene.id);
        if (!osnScene) throw Error('scene not found in OBS');
        const osnSceneItem = osnScene
          .getItems()
          .find(({ id }) => id === itemId);
        if (!osnSceneItem) throw Error('scene item not found in OBS');
        if (transformValues.crop) osnSceneItem.crop = transformValues.crop;
        if (transformValues.position)
          osnSceneItem.position = transformValues.position;
        if (transformValues.rotation)
          osnSceneItem.rotation = transformValues.rotation;
        if (transformValues.scale) osnSceneItem.scale = transformValues.scale;
      } catch (err) {
        throw Error(err.message);
      }
    }
    return updatedSceneItem;
  }
}

export default SceneService;
