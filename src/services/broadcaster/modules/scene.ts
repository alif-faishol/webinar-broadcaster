import { v4 as uuid } from 'uuid';
import * as osn from 'obs-studio-node';
import { backOff } from 'exponential-backoff';
import { BehaviorSubject } from 'rxjs';
import {
  CustomItem,
  CustomItemTemplate,
  OBSItemTemplate,
  SceneItem,
  SceneItemTransformValues,
  SerializableSceneItem,
} from '../types';
import TransformUtils from '../utils/TransformUtils';
import SourceModule from './source';
import type { BroadcasterServiceState } from '..';
import BroadcasterServiceModule from './BroadcasterServiceModule';

export const DEFAULT_TRANSFORM_VALUES = {
  scale: { x: 1, y: 1 },
  position: { x: 0, y: 0 },
  rotation: 0,
  crop: { top: 0, right: 0, bottom: 0, left: 0 },
} as const;

class SceneModule extends BroadcasterServiceModule {
  private observableState: BehaviorSubject<BroadcasterServiceState>;

  private source: SourceModule;

  constructor(
    observableState?: BehaviorSubject<BroadcasterServiceState>,
    source?: SourceModule
  ) {
    super();
    if (process.type === 'browser') {
      if (!observableState) throw Error('observableState required');
      if (!source) throw Error('source required');
    }
    this.observableState =
      observableState as BehaviorSubject<BroadcasterServiceState>;
    this.source = source as SourceModule;
  }

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

  async add(name: string) {
    try {
      const osnScene = osn.SceneFactory.create(uuid());
      const newScene = {
        id: osnScene.name,
        items: [],
        name,
      };

      const state = this.observableState.getValue();

      const activeScene =
        state.scenes.length === 0 ? newScene : state.activeScene;
      if (state.scenes.length === 0) {
        osn.Global.setOutputSource(1, osnScene);
      }

      this.observableState.next({
        ...state,
        scenes: [...state.scenes, newScene],
        activeScene,
      });

      return newScene;
    } catch (err) {
      throw Error(err.message);
    }
  }

  async remove(sceneId: string) {
    try {
      const osnScene = osn.SceneFactory.fromName(sceneId);
      osnScene.remove();
      const state = this.observableState.getValue();
      const filteredScenes = state.scenes.filter(
        (scene) => scene.id !== sceneId
      );
      this.observableState.next({
        ...state,
        scenes: filteredScenes,
        activeScene:
          state.activeScene?.id === sceneId
            ? filteredScenes[0]
            : state.activeScene,
      });
    } catch (err) {
      throw Error(err.message);
    }
  }

  async activate(sceneId: string) {
    try {
      const state = this.observableState.getValue();
      const scene = state.scenes.find(({ id }) => id === sceneId);
      const osnScene = osn.SceneFactory.fromName(sceneId);
      osn.Global.setOutputSource(1, osnScene);
      this.observableState.next({ ...state, activeScene: scene });
    } catch (err) {
      throw Error(err.message);
    }
  }

  async addItem(
    template: CustomItemTemplate | OBSItemTemplate,
    sceneId?: string
  ) {
    const scene = this.getSceneWithFallback(sceneId);

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
        const osnSource = template.obsSourceId
          ? osn.InputFactory.fromName(template.obsSourceId)
          : osn.InputFactory.create(template.obsSourceType, uuid());
        const osnScene = osn.SceneFactory.fromName(scene.id);
        if (!osnScene) throw Error('scene not found in OBS');
        const osnSceneItem = osnScene.add(osnSource);
        try {
          // await backOff(async () => {
          //   if (osnSource.width === 0) throw Error('Invalid Source: width = 0');
          //   return SourceModule.serializeSource(osnSource);
          // });
          const sceneItem = SceneModule.serializeSceneItem(osnSceneItem);
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
    this.observableState.next(this.observableState.value);
  }

  async setCustomItemVariables(
    itemId: string,
    variables: CustomItemTemplate['variables'],
    sceneId?: string
  ) {
    const scene = this.getSceneWithFallback(sceneId);
    const sceneItem = scene.items.find(
      (item) => item.type === 'browser-rendered' && item.id === itemId
    ) as CustomItem;
    if (!sceneItem) throw Error('Scene item not found!');
    sceneItem.variables = variables;
    this.observableState.next(this.observableState.value);
  }

  async removeItem(itemId: number | string, sceneId?: string) {
    const scene = this.getSceneWithFallback(sceneId);
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
    this.observableState.next(this.observableState.value);
    return itemId;
  }

  async transformItem(
    sceneId: string,
    itemId: number | string,
    transformFnOrValues:
      | ((item: SceneItem) => Partial<SceneItemTransformValues>)
      | Partial<SceneItemTransformValues>
  ) {
    const scene = this.getSceneWithFallback(sceneId);
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
    this.observableState.next(this.observableState.value);
    return updatedSceneItem;
  }

  async reorderItems(items: SceneItem[], sceneId?: string) {
    const scene = this.getSceneWithFallback(sceneId);
    scene.items = items;
    this.observableState.next(this.observableState.value);
    return items;
  }

  async selectItem(itemId?: number | string, sceneId?: string) {
    const scene = this.getSceneWithFallback(sceneId);
    const selectedItem = scene.items.find((item) => item.id === itemId);
    if (scene.selectedItem?.id === selectedItem?.id) {
      scene.selectedItem = undefined;
    } else scene.selectedItem = selectedItem;
    this.observableState.next(this.observableState.value);
  }

  async getItemWithDimensions(itemId?: number | string, sceneId?: string) {
    const scene = this.getSceneWithFallback(sceneId);
    let sceneItem = scene.items.find((item) => item.id === itemId);
    if (!itemId && scene.selectedItem) {
      sceneItem = scene.selectedItem;
    }
    if (!sceneItem) throw Error('scene item not found');
    let width = 0;
    let height = 0;
    if (sceneItem.type === 'obs-source') {
      const newObsSource = await this.source.get(sceneItem.sourceId);
      width = newObsSource.width;
      height = newObsSource.height;
    }
    if (sceneItem.type === 'browser-rendered') {
      width = sceneItem.container.width;
      height = sceneItem.container.height;
    }

    return {
      ...sceneItem,
      width,
      height,
    };
  }

  private getSceneWithFallback(sceneId?: string) {
    const state = this.observableState.getValue();
    const scene = state.scenes.find(
      ({ id }) => id === (sceneId || state.activeScene?.id)
    );
    if (!scene) throw Error('scene or activeScene not found');
    return scene;
  }

  registerIpcMethods() {
    return {
      add: this.add.bind(this),
      remove: this.remove.bind(this),
      activate: this.activate.bind(this),
      addItem: this.addItem.bind(this),
      setCustomItemVariables: this.setCustomItemVariables.bind(this),
      removeItem: this.removeItem.bind(this),
      transformItem: this.transformItem.bind(this),
      reorderItems: this.reorderItems.bind(this),
      selectItem: this.selectItem.bind(this),
      getItemWithDimensions: this.getItemWithDimensions.bind(this),
    };
  }
}

export default SceneModule;
