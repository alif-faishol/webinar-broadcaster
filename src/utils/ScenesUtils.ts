import { backOff } from 'exponential-backoff';
import osn from '../service/osn';
import AppService from '../service/app/AppService';
import {
  SceneItemTransformValues,
  SerializableSceneItem,
} from '../service/osn/scene/main';
import { SerializableSource } from '../service/osn/source/main';

type StringVariable = {
  type: 'string';
  min?: number;
  max?: number;
  value: string;
};

type EnumVariable = {
  type: 'enum';
  options: string[];
  value: number;
};

type NumberVariable = {
  type: 'number';
  min?: number;
  max?: number;
  control: 'text-input' | 'slider';
  value: number;
};

type BooleanVariable = {
  type: 'boolean';
  value: boolean;
};

type Variable =
  | StringVariable
  | EnumVariable
  | NumberVariable
  | BooleanVariable;

export type CustomItem = {
  id: string;
  name: string;
  type: 'browser-rendered';
  template: '<div>hehe</div>';
  variable: { [key: string]: Variable };
};

type OBSItem = SerializableSceneItem & {
  name: string;
};

export type SceneItem = OBSItem | CustomItem;

export type Scene = {
  id: string;
  name: string;
  items: SceneItem[];
};

class ScenesUtils {
  constructor(
    private scenes: Map<string, Scene>,
    private onCommited: (scenes: Map<string, Scene>) => void
  ) {}

  commit() {
    this.onCommited(this.scenes);
  }

  async addScene(name: string) {
    const sceneId = await osn.scene.create();
    const newScene = { id: sceneId, name, items: [] };
    this.scenes.set(sceneId, newScene);
    return newScene;
  }

  async removeScene(sceneId: string) {
    if (!this.scenes.has(sceneId)) throw Error('Scene not found!');
    await osn.scene.remove({ sceneId });
    this.scenes.delete(sceneId);
    return sceneId;
  }

  async addItem(
    sceneId: string,
    source: CustomItem | (SerializableSource & { name: string })
  ) {
    const scene = this.scenes.get(sceneId);
    if (!scene) throw Error('Scene not found!');
    if (source.type === 'browser-rendered') {
      scene.items = [source, ...scene.items];
      return source;
    }
    const item = await osn.scene.addItem({
      sceneId,
      sourceId: source.id,
    });
    const newSceneItem = await backOff(
      async () => {
        const sceneItem = await osn.scene.getItem({ sceneId, itemId: item.id });
        if (sceneItem.source.width === 0)
          throw Error('Invalid Source: width = 0');
        return { ...sceneItem, name: source.name };
      },
      {
        numOfAttempts: 6,
      }
    );
    scene.items = [newSceneItem, ...scene.items];
    return newSceneItem;
  }

  async removeItem(sceneId: string, itemId: number | string) {
    const scene = this.scenes.get(sceneId);
    if (!scene) throw Error('Scene not found!');
    if (typeof itemId === 'number')
      await AppService.getInstance().removeItem(sceneId, itemId);
    scene.items = scene.items.filter((item) => item.id !== itemId);
    return itemId;
  }

  async transfromItem(
    sceneId: string,
    itemId: number,
    transformFnOrValues:
      | ((item: SceneItem) => Partial<SceneItemTransformValues>)
      | Partial<SceneItemTransformValues>
  ) {
    const scene = this.scenes.get(sceneId);
    if (!scene) throw Error('Scene not found!');
    const sceneItemIndex = scene.items.findIndex((item) => item.id === itemId);
    if (sceneItemIndex === -1) throw Error('Scene item not found!');
    const sceneItem = scene.items[sceneItemIndex];

    const transformValues =
      typeof transformFnOrValues === 'function'
        ? transformFnOrValues(sceneItem)
        : transformFnOrValues;

    const updatedSceneItem = await osn.scene.transformItem({
      sceneId,
      itemId,
      transformValues,
    });
    scene.items[sceneItemIndex] = {
      ...scene.items[sceneItemIndex],
      ...updatedSceneItem,
    };
    return updatedSceneItem;
  }
}

export default ScenesUtils;
