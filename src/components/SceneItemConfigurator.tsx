import React, { useEffect, useState } from 'react';
import { XIcon, SwitchVerticalIcon } from '@heroicons/react/solid';
import { DraggableProvided } from 'react-beautiful-dnd';
import { SceneItem, SerializableSource } from '../services/app/types';
import AppService from '../services/app/AppService';

type SceneItemConfiguratorProps = {
  sceneItem: SceneItem;
  onRemove: () => void;
  draggableProvided: DraggableProvided;
};

const appService = AppService.getInstance();

const SceneItemConfigurator = ({
  sceneItem,
  onRemove,
  draggableProvided,
}: SceneItemConfiguratorProps) => {
  const [obsSource, setObsSource] = useState<SerializableSource>();

  useEffect(() => {
    if (sceneItem.type !== 'obs-source') return;
    appService.source
      .get(sceneItem.sourceId)
      .then(setObsSource)
      .catch((err) => {
        throw err;
      });
  }, [sceneItem]);

  return (
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
              onChange={({ target: { value } }) => {
                appService.source.setSettings(obsSource.id, {
                  url: value,
                });
              }}
            />
          </label>
        )}
        {obsSource?.properties.map((item) => {
          if (item.type === 6)
            return (
              <label>
                {item.description}
                <select
                  onChange={({ target: { value } }) => {
                    if (item.details.format === 1) {
                      appService.source.setSettings(obsSource.id, {
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
      </div>
    </div>
  );
};

export default SceneItemConfigurator;
