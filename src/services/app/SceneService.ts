import { v4 as uuid } from 'uuid';
import * as osn from 'obs-studio-node';
import { backOff } from 'exponential-backoff';
import { IpcMainInvokeEvent } from 'electron/main';
import { Variables } from 'electron-log';
import {
  CustomItem,
  CustomItemTemplate,
  OBSItemTemplate,
  SceneItem,
  SceneItemTransformValues,
  SerializableSceneItem,
} from './types';
import { callableFromRenderer } from './utils';
import TransformUtils from './TransformUtils';
import SourceService from './SourceService';
import { setState, stateSubject } from './AppState';

export const DEFAULT_TRANSFORM_VALUES = {
  scale: { x: 1, y: 1 },
  position: { x: 0, y: 0 },
  rotation: 0,
  crop: { top: 0, right: 0, bottom: 0, left: 0 },
} as const;

class SceneService {
  event?: IpcMainInvokeEvent;

  static serializeSceneItem(sceneItem: osn.ISceneItem): SerializableSceneItem {
    return {
      id: sceneItem.id,
      sourceId: sceneItem.source.name,
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
      const newScene = {
        id: osnScene.name,
        items: [],
        name,
      };
      setState((ps) => {
        const activeScene = ps.scenes.length === 0 ? newScene : ps.activeScene;
        if (ps.scenes.length === 0) {
          osn.Global.setOutputSource(1, osnScene);
        }
        return {
          ...ps,
          scenes: [...ps.scenes, newScene],
          activeScene,
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
  async addItem(
    template: CustomItemTemplate | OBSItemTemplate,
    sceneId?: string
  ) {
    const state = stateSubject.getValue();
    const scene = state.scenes.find(
      ({ id }) => id === (sceneId || state.activeScene?.id)
    );
    if (!scene) throw Error('scene or activeScene not found');

    if (template.type === 'browser-rendered') {
      const newItem = {
        id: uuid(),
        scale: { x: 1, y: 1 },
        position: { x: 0, y: 0 },
        rotation: 0,
        crop: { top: 0, right: 0, bottom: 0, left: 0 },
        ...template,
        ...TransformUtils.alignToCanvas(
          template.container,
          template.defaultAlignment
        ),
      };
      scene.items = [newItem, ...scene.items];
    }
    if (template.type === 'obs-source') {
      try {
        const osnSource = osn.InputFactory.create(
          template.obsSourceType,
          uuid()
        );
        const osnScene = osn.SceneFactory.fromName(scene.id);
        if (!osnScene) throw Error('scene not found in OBS');
        const osnSceneItem = osnScene.add(osnSource);
        try {
          const source = await backOff(async () => {
            if (osnSource.width === 0) throw Error('Invalid Source: width = 0');
            return SourceService.serializeSource(osnSource);
          });
          const sceneItem = SceneService.serializeSceneItem(osnSceneItem);
          scene.items = [{ ...sceneItem, ...template }, ...scene.items];
        } catch (err) {
          osnSource.release();
          osnSource.remove();
          osnSceneItem.remove();
          throw err;
        }
      } catch (err) {
        throw Error(err.message);
      }
    }
    setState(state);
  }

  @callableFromRenderer
  async setCustomItemVariables(
    itemId: string,
    variables: Variables,
    sceneId?: string
  ) {
    const state = stateSubject.getValue();
    const scene = state.scenes.find(
      ({ id }) => id === (sceneId || state.activeScene?.id)
    );
    if (!scene) throw Error('scene or activeScene not found');
    const sceneItem = scene.items.find(
      (item) => item.type === 'browser-rendered' && item.id === itemId
    ) as CustomItem;
    if (!sceneItem) throw Error('Scene item not found!');
    sceneItem.variables = variables;
    setState(state);
  }

  @callableFromRenderer
  async removeItem(itemId: number | string, sceneId?: string) {
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

    const updatedSceneItem = Object.assign(sceneItem, transformValues);
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
    setState(state);
    return updatedSceneItem;
  }

  @callableFromRenderer
  async reorderItems(items: SceneItem[], sceneId?: string) {
    const state = stateSubject.getValue();
    const scene = state.scenes.find(
      ({ id }) => id === (sceneId || state.activeScene?.id)
    );
    if (!scene) throw Error('scene or activeScene not found');
    scene.items = items;
    setState(state);
    return items;
  }
}

export default SceneService;
