import { render } from 'react-dom';
import root from 'react-shadow';
import React, { useEffect, useMemo, useState } from 'react';
import io from 'socket.io-client';
import JsxParser from 'react-jsx-parser';
import { Variables } from 'electron-log';
import 'tailwindcss/dist/base.min.css';
import { CustomItem } from '../app/types';

const elem = window.document.createElement('div');
window.document.body.appendChild(elem);

const socket = io();

const Item = ({ item }: { item: CustomItem }) => {
  return (
    <root.div
      style={{
        position: 'absolute',
        left: item.position.x,
        top: item.position.y,
        transform: `scale(${item.scale.x}, ${item.scale.y})`,
        transformOrigin: 'top left',
        width: item.container.width,
        height: item.container.height,
        overflow: 'hidden',
      }}
    >
      {item.css && <link rel="stylesheet" href={item.css} />}
      <JsxParser
        className="root"
        jsx={item.template}
        disableKeyGeneration
        bindings={
          item.variables &&
          Object.entries(item.variables).reduce<{
            [key: string]: Variables['value'];
          }>((obj, [name, def]) => {
            obj[name] = def.value;
            return obj;
          }, {})
        }
      />
    </root.div>
  );
};

const App = () => {
  const [itemsGroups, setItemsGroups] = useState<CustomItem[][]>([[]]);

  useEffect(() => {
    socket.on('items-updated', (newState: typeof itemsGroups) => {
      console.log('updated', newState);
      setItemsGroups(newState);
    });
  }, []);

  const layer = useMemo(() => {
    const layerParam = new URLSearchParams(window.location.search).get('layer');
    if (!layerParam) return undefined;
    const layerInt = parseInt(layerParam, 10);
    return layerInt;
  }, []);

  if (layer === undefined || Number.isNaN(layer) || !itemsGroups[layer]) {
    return null;
  }

  return (
    <>
      <div style={{ width: 1920, height: 1080, position: 'relative' }}>
        {itemsGroups[layer].reverse().map((item) => (
          <Item key={item.id} item={item} />
        ))}
      </div>
    </>
  );
};

render(<App />, elem);
