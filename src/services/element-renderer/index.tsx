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
      }}
    >
      <JsxParser
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
      setItemsGroups(newState);
    });
  });

  const layer = useMemo(() => {
    const layerParam = new URLSearchParams(window.location.search).get('layer');
    if (!layerParam) return undefined;
    const layerInt = parseInt(layerParam, 10);
    return layerInt;
  }, []);

  if (layer === undefined || Number.isNaN(layer) || !itemsGroups[layer]) {
    return (
      <div
        style={{
          background: 'red',
          width: 1920,
          height: 1080,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <h1
          style={{
            color: 'white',
            padding: 48,
            fontSize: 64,
            textAlign: 'center',
          }}
        >
          Layer not found!
        </h1>
      </div>
    );
  }

  return (
    <div style={{ width: 1920, height: 1080, position: 'relative' }}>
      {itemsGroups[layer].reverse().map((item) => (
        <Item key={item.id} item={item} />
      ))}
    </div>
  );
};

render(<App />, elem);
