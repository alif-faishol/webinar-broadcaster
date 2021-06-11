import React, {
  forwardRef,
  HTMLAttributes,
  Ref,
  useEffect,
  useState,
} from 'react';
import { XIcon, SwitchVerticalIcon } from '@heroicons/react/solid';
import { EPropertyType } from 'obs-studio-node';
import { SceneItem, SerializableSource } from '../service/app/types';
import AppService from '../service/app/AppService';

type SceneItemConfiguratorProps<
  P = {
    sceneItem: SceneItem;
    onRemove: () => void;
  }
> = Omit<HTMLAttributes<HTMLDivElement>, keyof P> & P;

const appService = AppService.getInstance();

const SceneItemConfigurator = (
  { sceneItem, onRemove, className }: SceneItemConfiguratorProps,
  ref: Ref<HTMLDivElement>
) => {
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
      ref={ref}
      className={['border border-cool-gray-900', className].join(' ')}
    >
      <div className="flex">
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
          if (item.type === EPropertyType.List)
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

export default forwardRef(SceneItemConfigurator);
