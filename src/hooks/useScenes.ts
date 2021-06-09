import { atom, SetStateAction, useAtom } from 'jotai';
import { useEffect, useMemo } from 'react';
import osn from '../service/osn';
import { Scene } from '../utils/ScenesUtils';

export const scenesAtom = atom<Map<string, Scene>>(new Map());
export const activeSceneIdAtom = atom<string | undefined>(undefined);

type UseScenesReturn = {
  scenes: Map<string, Scene>;
  activeScene?: Scene;
  setActiveScene: (
    update?: SetStateAction<string | undefined>
  ) => void | Promise<void>;
};

const useScenes = (): UseScenesReturn => {
  const [scenes] = useAtom(scenesAtom);
  const [activeSceneId, setActiveSceneId] = useAtom(activeSceneIdAtom);

  const activeScene = useMemo<UseScenesReturn['activeScene']>(() => {
    if (!activeSceneId) {
      /*
       * Activate if there is only one scene
       */
      if (scenes.size === 1) {
        setActiveSceneId(scenes.keys().next().value);
      }
      return undefined;
    }
    const scene = scenes.get(activeSceneId);
    if (!scene) {
      setActiveSceneId(undefined);
      return undefined;
    }
    return scene;
  }, [activeSceneId, scenes, setActiveSceneId]);

  useEffect(() => {
    if (!activeSceneId) return;
    osn.general.setActiveScene({ sceneId: activeSceneId });
  }, [activeSceneId]);

  return {
    scenes,
    activeScene,
    setActiveScene: setActiveSceneId,
  };
};

export default useScenes;
