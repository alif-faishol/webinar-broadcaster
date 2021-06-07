import React, { useEffect, useRef } from 'react';
import { PlusIcon } from '@heroicons/react/solid';
import SceneElement from '../components/SceneElement';
import osn from '../service/osn';
import { useOSNContext } from '../context/OSNContext';
import useScene from '../hooks/useScene';

const sceneClassName = 'h-8 max-w-[8rem] px-4 truncate font-semibold mr-2 mb-2';
const activeSceneClassName = `${sceneClassName} bg-cool-gray-900 text-white`;
const inactiveSceneClassName = `${sceneClassName} border border-cool-gray-900`;

const Main = () => {
  const { scenes, activeScene, addScene, removeScene } = useScene();

  const previewRef = useRef<HTMLDivElement>(null);
  const previewInitializedRef = useRef<boolean>(false);
  const { initState } = useOSNContext();

  useEffect(() => {
    if (
      !previewRef.current ||
      initState !== 'initialized' ||
      previewInitializedRef.current
    )
      return;
    const previewId = 'output-preview';
    const { width, height, x, y } = previewRef.current.getBoundingClientRect();
    osn.general
      .attachPreview({
        previewId,
        bounds: {
          width,
          height,
          x,
          y: y + 20,
        },
      })
      .then(() => {
        previewInitializedRef.current = true;
        return undefined;
      })
      .catch(() => {
        previewInitializedRef.current = false;
      });
  }, [initState]);

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
          <h2 className="text-lg font-bold mr-2">SCENE</h2>
          <div className="flex-1 overflow-x-hidden">
            <div className="mr-2">
              {Array.from(scenes.values()).map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    item.activate();
                  }}
                  className={
                    activeScene?.id === item.id
                      ? activeSceneClassName
                      : inactiveSceneClassName
                  }
                  type="button"
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
          <button
            className="h-8 px-2 bg-cool-gray-900 text-white"
            type="button"
            onClick={() => {
              addScene('hhe');
            }}
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden self-stretch flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold">ELEMENTS</h2>
          <button
            className="h-8 px-2 bg-cool-gray-900 text-white"
            type="button"
            onClick={async () => {
              if (!activeScene) return;
              const sourceId = await osn.source.createDisplaySource({});
              activeScene.addItem({
                displayId: '1',
                type: 'monitor_capture',
                id: sourceId,
              });
            }}
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1">
          {activeScene &&
            activeScene.items.map((item) => (
              <SceneElement
                key={item.id}
                name="Desktop Capture"
                className="mb-2"
              />
            ))}
        </div>
      </div>
    </div>
  );
};

export default Main;
