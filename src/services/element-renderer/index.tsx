import { render } from 'react-dom';
import React, { useEffect, useMemo, useState } from 'react';
import io from 'socket.io-client';
import 'tailwindcss/dist/base.min.css';
import { CustomItem } from '../broadcaster/types';
import {
  PREVIEW_SCREEN_HEIGHT,
  PREVIEW_SCREEN_WIDTH,
} from '../broadcaster/utils/TransformUtils';
import CustomElementComponent from './CustomElementComponent';

const elem = window.document.createElement('div');
window.document.body.appendChild(elem);

const socket = io();

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
          <CustomElementComponent key={item.id} item={item} />
        ))}
      </div>
    </>
  );
};

render(<App />, elem);
