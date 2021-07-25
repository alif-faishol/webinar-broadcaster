import { render } from 'react-dom';
import root from 'react-shadow';
import React, { useEffect, useMemo, useState } from 'react';
import io from 'socket.io-client';
import JsxParser from 'react-jsx-parser';
import { Variables } from 'electron-log';
import 'tailwindcss/dist/base.min.css';
import { CustomItem } from '../broadcaster/types';
import {
  PREVIEW_SCREEN_HEIGHT,
  PREVIEW_SCREEN_WIDTH,
} from '../broadcaster/utils/TransformUtils';

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
        overflow: 'hidden',
        width: item.container.width - item.crop.left - item.crop.right,
        height: item.container.height - item.crop.top - item.crop.bottom,
      }}
    >
      <div
        style={{
          marginTop: -item.crop.top,
          marginLeft: -item.crop.left,
          width: item.container.width,
          height: item.container.height,
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
      </div>
    </root.div>
  );
};

const App = () => {
  const [itemsGroups, setItemsGroups] = useState<CustomItem[][]>([[]]);

  useEffect(() => {
    socket.on('items-updated', (newState: typeof itemsGroups) => {
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
      <div
        style={{
          width: PREVIEW_SCREEN_WIDTH,
          height: PREVIEW_SCREEN_HEIGHT,
          position: 'relative',
        }}
      >
        {itemsGroups[layer].reverse().map((item) => (
          <Item key={item.id} item={item} />
        ))}
      </div>
    </>
  );
};

render(<App />, elem);
