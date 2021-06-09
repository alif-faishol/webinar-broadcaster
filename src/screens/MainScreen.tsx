import React, { useEffect, useRef } from 'react';
import { PlusIcon } from '@heroicons/react/solid';
import SceneItemConfigurator from '../components/SceneItemConfigurator';
import openModal from '../service/modal/renderer';
import useAppState from '../hooks/useAppService';
import AppService from '../service/app/AppService';

const sceneClassName = 'h-8 max-w-[8rem] px-4 truncate font-semibold mr-2 mb-2';
const activeSceneClassName = `${sceneClassName} bg-cool-gray-900 text-white`;
const inactiveSceneClassName = `${sceneClassName} border border-cool-gray-900`;

const MainScreen = () => {
  const previewRef = useRef<HTMLDivElement>(null);
  const previewInitializedRef = useRef<boolean>(false);
  const appState = useAppState();
  const appService = AppService.getInstance();

  useEffect(() => {
    if (!previewRef.current || previewInitializedRef.current) return;
    const previewId = 'output-preview';
    const { width, height, x, y } = previewRef.current.getBoundingClientRect();
    appService.display
      .attachPreview(previewId, {
        width,
        height,
        x,
        y: y + 20,
      })
      .then(() => {
        previewInitializedRef.current = true;
        return undefined;
      })
      .catch(() => {
        previewInitializedRef.current = false;
      });
  }, [appService]);

  return (
    <div className="p-4 min-h-screen flex h-full">
      <div className="mr-4 flex-shrink-0 flex-grow-0">
        <div
          ref={previewRef}
          className="bg-cool-gray-400 border border-cool-gray-900 flex items-center justify-center"
          style={{
            width: 1920 * 0.35,
            height: 1080 * 0.35,
          }}
        >
          <p className="font-bold">Nothing to preview</p>
        </div>
        <div className="py-1 flex mt-2">
          <h2 className="text-lg font-bold mr-2">SCENES</h2>
          <div className="flex-1 overflow-x-hidden">
            <div className="mr-2">
              {appState.scenes.map((scene) => (
                <button
                  key={scene.id}
                  onClick={() => {
                    appService.scene.activate(scene.id);
                  }}
                  className={
                    appState.activeScene?.id === scene.id
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
              await appService.scene.add(sceneName);
            }}
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden self-stretch flex flex-col">
        <div className="flex justify-between items-center mb-2">
          {appState.activeScene && (
            <>
              <h2 className="text-lg font-bold">ELEMENTS</h2>
              <button
                className="h-8 px-2 bg-cool-gray-900 text-white"
                type="button"
                onClick={() => {
                  if (!appState.activeScene) return;
                  openModal('add-source');
                }}
              >
                <PlusIcon className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
        <div className="flex-1">
          {appState.activeScene &&
            appState.activeScene.items.map((item) => (
              <SceneItemConfigurator
                key={item.id}
                sceneItem={item}
                className="mb-2"
                onRemove={() => {
                  if (!appState.activeScene) return;
                  appService.scene.removeItem(appState.activeScene.id, item.id);
                }}
              />
            ))}
        </div>
      </div>
    </div>
  );
};

export default MainScreen;
