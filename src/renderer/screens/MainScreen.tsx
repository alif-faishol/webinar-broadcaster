import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PlusIcon } from '@heroicons/react/solid';
import openModal from '../../services/modal/renderer';
import ElementsSidebar from '../components/ElementsSidebar';
import ElementTransformer from '../components/ElementTransformer';
import { SceneItemTransformValues } from '../../services/broadcaster/types';
import BroadcasterService, {
  BroadcasterServiceState,
} from '../../services/broadcaster';

const sceneClassName = 'h-8 max-w-[8rem] px-4 truncate font-semibold mr-2 mb-2';
const activeSceneClassName = `${sceneClassName} bg-cool-gray-900 text-white`;
const inactiveSceneClassName = `${sceneClassName} border border-cool-gray-900`;

const broadcaster = BroadcasterService.getIpcRendererClient();

const MainScreen = () => {
  const previewRef = useRef<HTMLDivElement>(null);
  const previewInitializedRef = useRef<boolean>(false);
  const [broadcasterState, setBroadcasterState] =
    useState<BroadcasterServiceState>({ scenes: [] });

  useEffect(() => {
    const unsubscribe = broadcaster.subscribe(setBroadcasterState);
    return unsubscribe;
  }, []);

  const [elementToTransform, setElementToTransform] = useState<
    SceneItemTransformValues & {
      id: string | number;
      width: number;
      height: number;
    }
  >();

  const handleTransformElement = useCallback(
    (item: NonNullable<typeof elementToTransform>) => {
      if (!broadcasterState.activeScene) return;
      broadcaster.scene.transformItem(
        broadcasterState.activeScene.id,
        item.id,
        item
      );
    },
    [broadcasterState.activeScene]
  );

  useEffect(() => {
    if (!previewRef.current || previewInitializedRef.current) return undefined;
    const previewId = 'output-preview';
    const { width, height, x, y } = previewRef.current.getBoundingClientRect();

    const onDevicePixelRatioChanged = () => {
      if (!previewInitializedRef.current) return;
      broadcaster.display.resizePreview(previewId, {
        width: width * window.devicePixelRatio,
        height: height * window.devicePixelRatio,
        x: x * window.devicePixelRatio,
        y: y * window.devicePixelRatio,
      });
    };

    const mediaQueryList = matchMedia(
      `(resolution: ${window.devicePixelRatio}dppx)`
    );
    mediaQueryList.addEventListener('change', onDevicePixelRatioChanged);

    broadcaster.display
      .attachPreview(previewId, {
        width: width * window.devicePixelRatio,
        height: height * window.devicePixelRatio,
        x: x * window.devicePixelRatio,
        y: y * window.devicePixelRatio,
      })
      .then(() => {
        previewInitializedRef.current = true;
        return undefined;
      })
      .catch(() => {
        previewInitializedRef.current = false;
      });

    return () => {
      mediaQueryList.removeEventListener('change', onDevicePixelRatioChanged);
    };
  }, []);

  return (
    <div className="flex h-full">
      <div className="p-4 flex-shrink-0 flex-grow-0">
        <div
          ref={previewRef}
          className="relative border border-cool-gray-900 flex items-center justify-center"
          style={{
            width: 1920 * 0.35,
            height: 1080 * 0.35,
          }}
        >
          {elementToTransform && (
            <ElementTransformer
              onClose={() => setElementToTransform(undefined)}
              onChange={handleTransformElement}
              item={elementToTransform}
              containerSize={{ width: 1920 * 0.35, height: 1080 * 0.35 }}
            />
          )}
        </div>
        <div className="py-1 flex mt-2">
          <h2 className="text-lg font-bold mr-2">SCENES</h2>
          <div className="flex-1 overflow-x-hidden">
            <div className="mr-2">
              {broadcasterState.scenes.map((scene) => (
                <button
                  key={scene.id}
                  onClick={() => {
                    broadcaster.scene.activate(scene.id);
                  }}
                  className={
                    broadcasterState.activeScene?.id === scene.id
                      ? activeSceneClassName
                      : inactiveSceneClassName
                  }
                  type="button"
                >
                  {scene.name}
                </button>
              ))}
            </div>
          </div>
          <button
            className="h-8 px-2 bg-cool-gray-900 text-white"
            type="button"
            onClick={async () => {
              const sceneName = await openModal('add-scene');
              if (!sceneName) return;
              await broadcaster.scene.add(sceneName);
            }}
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>
        {process.env.NODE_ENV === 'development' && <p>PORT: </p>}
      </div>
      <ElementsSidebar
        activeScene={broadcasterState.activeScene}
        onTransform={setElementToTransform}
      />
    </div>
  );
};

export default MainScreen;
