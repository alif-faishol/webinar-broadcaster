import React, { useCallback, useEffect, useState } from 'react';
import { XIcon, SwitchVerticalIcon } from '@heroicons/react/solid';
import { DraggableProvided } from 'react-beautiful-dnd';
import {
  SceneItem,
  SceneItemTransformValues,
  SerializableSource,
} from '../services/app/types';
import AppService from '../services/app/AppService';

type SceneItemConfiguratorProps = {
  sceneItem: SceneItem;
  onRemove: () => void;
  onTransform: (
    transformValues: SceneItemTransformValues & {
      id: string | number;
      width: number;
      height: number;
    }
  ) => void;
  draggableProvided: DraggableProvided;
};

const appService = AppService.getInstance();

const SceneItemConfigurator = ({
  sceneItem,
  onRemove,
  onTransform,
  draggableProvided,
}: SceneItemConfiguratorProps) => {
  const [obsSource, setObsSource] = useState<SerializableSource>();

  const loadObsSource = useCallback(async () => {
    if (sceneItem.type !== 'obs-source') return;
    const newObsSource = await appService.source.get(sceneItem.sourceId);
    setObsSource(newObsSource);
  }, [sceneItem]);

  useEffect(() => {
    loadObsSource();
  }, [loadObsSource]);

  return (
    <>
      <div
        ref={draggableProvided.innerRef}
        {...draggableProvided.draggableProps}
        className="border border-cool-gray-900 mb-2 bg-white"
      >
        <div className="flex" {...draggableProvided.dragHandleProps}>
          <div className="bg-cool-gray-900 text-white px-2 text-center flex items-center">
            <SwitchVerticalIcon className="align-middle w-6 h-6" />
          </div>
          <h4
            className="flex-1 px-2 py-1 bg-cool-gray-900 text-white font-semibold truncate"
            title={sceneItem.name}
          >
            {sceneItem.name}
          </h4>
          <button
            type="button"
            className="bg-red-800 text-white w-10 px-3"
            onClick={() => onRemove()}
          >
            <XIcon />
          </button>
        </div>
        <div className="px-2 py-1">
          {sceneItem.type === 'browser-rendered' &&
            sceneItem.variables &&
            Object.entries(sceneItem.variables).map(([name, def]) => (
              <>
                {def.type === 'string' && (
                  <label>
                    {name}
                    <input
                      type="text"
                      defaultValue={def.value}
                      onChange={({ target: { value } }) => {
                        if (!sceneItem.variables) return;
                        sceneItem.variables[name].value = value;
                        appService.scene.setCustomItemVariables(
                          sceneItem.id,
                          sceneItem.variables
                        );
                      }}
                    />
                  </label>
                )}
                {def.type === 'boolean' && (
                  <label>
                    {name}
                    <input
                      type="checkbox"
                      defaultChecked={!!def.value}
                      onChange={({ target: { checked } }) => {
                        if (!sceneItem.variables) return;
                        sceneItem.variables[name].value = checked;
                        appService.scene.setCustomItemVariables(
                          sceneItem.id,
                          sceneItem.variables
                        );
                      }}
                    />
                  </label>
                )}
              </>
            ))}
          {obsSource && 'url' in obsSource.settings && (
            <label htmlFor="url">
              URL
              <input
                type="text"
                name="url"
                defaultValue={obsSource.settings.url}
                onChange={async ({ target: { value } }) => {
                  await appService.source.setSettings(obsSource.id, {
                    url: value,
                  });
                }}
              />
            </label>
          )}
          {obsSource?.properties.map((item) => {
            if (item.type === 6)
              return (
                <label key={item.name}>
                  {item.description}
                  <select
                    onChange={async ({ target: { value } }) => {
                      if (item.details.format === 1) {
                        await appService.source.setSettings(obsSource.id, {
                          [item.name]: parseInt(value, 10),
                        });
                      }
                    }}
                  >
                    {Array.isArray(item.details?.items) &&
                      item.details.items.map((opt) => (
                        <option value={opt.value} key={opt.value}>
                          {opt.name}
                        </option>
                      ))}
                  </select>
                </label>
              );
            return undefined;
          })}
          <div>
            <button
              type="button"
              onClick={async () => {
                let itemWidth = 0;
                let itemHeight = 0;
                if (sceneItem.type === 'obs-source') {
                  const newObsSource = await appService.source.get(
                    sceneItem.sourceId
                  );
                  itemWidth = newObsSource.width;
                  itemHeight = newObsSource.height;
                }
                if (sceneItem.type === 'browser-rendered') {
                  itemWidth = sceneItem.container.width;
                  itemHeight = sceneItem.container.height;
                }
                const itemToTransform = {
                  id: sceneItem.id,
                  crop: sceneItem.crop,
                  position: sceneItem.position,
                  rotation: sceneItem.rotation,
                  scale: sceneItem.scale,
                  width: itemWidth,
                  height: itemHeight,
                };
                onTransform(itemToTransform);
              }}
            >
              transform
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SceneItemConfigurator;
