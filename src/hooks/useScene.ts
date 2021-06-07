import { atom, useAtom } from 'jotai';
import { useCallback, useMemo } from 'react';
import osn from '../service/osn';
import { SerializableSceneItem } from '../service/osn/scene/main';

type DisplaySource = {
  id: string;
  type: 'monitor_capture';
  displayId: string;
};

type Source = DisplaySource;

type Item = SerializableSceneItem & {
  source: Source;
  remove: () => void;
};

type Scene = {
  id: string;
  name: string;
  items: Item[];
  activate: () => Promise<void>;
  addItem: (source: Source) => Promise<void>;
};

const scenesAtom = atom<Map<string, Scene>>(new Map());
const activeSceneIdAtom = atom<string | undefined>(undefined);

type UseSceneReturn = {
  scenes: Map<string, Scene>;
  activeScene?: Scene;
  addScene: (name: string) => Promise<string>;
  removeScene: (id: string) => Promise<void>;
};

const useScene = (): UseSceneReturn => {
  const [scenes, setScenes] = useAtom(scenesAtom);
  const [activeSceneId, setActiveSceneId] = useAtom(activeSceneIdAtom);

  const addScene = useCallback<UseSceneReturn['addScene']>(
    async (name) => {
      const sceneId = await osn.scene.create();

      setScenes((ps) => {
        ps.set(sceneId, {
          id: sceneId,
          name,
          items: [],
          activate: async () => {
            await osn.general.setActiveScene({ sceneId });
            setActiveSceneId(sceneId);
          },
          async addItem(source) {
            const itemId = await osn.scene.addItem({
              sceneId: this.id,
              sourceId: source.id,
            });
            const sceneItem = await osn.scene.getItem({ sceneId, itemId });
            const newItem = {
              ...sceneItem,
              source,
              remove: () => {},
            };
            osn.scene.transformItem({
              itemId,
              sceneId: this.id,
              transformValues: {
                scale: {
                  x: 1920 / (1920 * 2),
                  y: 1080 / (1080 * 2),
                },
              },
            });
            this.items = [...this.items, newItem];
            setScenes((ps2) => new Map(ps2));
          },
        });
        return new Map(ps);
      });
      return sceneId;
    },
    [setScenes, setActiveSceneId]
  );

  const removeScene = useCallback<UseSceneReturn['removeScene']>(
    async (sceneId) => {
      if (!scenes.has(sceneId)) throw Error('Scene not found!');
      await osn.scene.remove({ sceneId });
      scenes.delete(sceneId);
      setScenes(new Map(scenes));
    },
    [setScenes, scenes]
  );

  const activeScene = useMemo<UseSceneReturn['activeScene']>(() => {
    if (!activeSceneId) return undefined;
    const scene = scenes.get(activeSceneId);
    if (!scene) {
      setActiveSceneId(undefined);
      return undefined;
    }
    return scene;
  }, [activeSceneId, scenes, setActiveSceneId]);

  return {
    scenes,
    activeScene,
    addScene,
    removeScene,
  };
};

export default useScene;
