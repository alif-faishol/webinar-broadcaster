import { useAtom } from 'jotai';
import { useMemo } from 'react';
import ScenesUtils from '../utils/ScenesUtils';
import { scenesAtom } from './useScenes';

const useScenesUtils = (): ScenesUtils => {
  const [scenes, setScenes] = useAtom(scenesAtom);

  const scenesUtils = useMemo(
    () => new ScenesUtils(scenes, () => setScenes(new Map(scenes))),
    [scenes, setScenes]
  );

  return scenesUtils;
};

export default useScenesUtils;
