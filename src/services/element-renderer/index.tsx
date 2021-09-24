import { render } from 'react-dom';
import React, { FC, useEffect, useMemo, useState } from 'react';
import io from 'socket.io-client';
import 'tailwindcss/dist/base.min.css';
import { CustomItem, CustomItemTemplate } from '../broadcaster/types';
import TransformUtils, {
  PREVIEW_SCREEN_HEIGHT,
  PREVIEW_SCREEN_WIDTH,
} from '../broadcaster/utils/TransformUtils';
import CustomElementComponent from './CustomElementComponent';

const elem = window.document.createElement('div');
window.document.body.appendChild(elem);

const socket = io();

const App: FC<{ layer: number }> = ({ layer }) => {
  const [itemsGroups, setItemsGroups] = useState<CustomItem[][]>([[]]);

  useEffect(() => {
    socket.on('items-updated', (newState: typeof itemsGroups) => {
      setItemsGroups(newState);
    });
  }, []);

  if (layer === undefined || Number.isNaN(layer) || !itemsGroups[layer]) {
    return null;
  }

  return (
    <>
      <style
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&display=swap');
    `,
        }}
      />
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

const DevPreview = () => {
  const [templates, setTemplates] = useState<CustomItemTemplate[]>([]);
  const [elementPreview, setElementPreview] = useState<CustomItem>();

  useEffect(() => {
    socket.on('templates-updated', (newState: CustomItemTemplate[]) => {
      setTemplates(newState);
    });
  }, []);

  return (
    <div>
      <style
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&display=swap');
    `,
        }}
      />
      <select
        value={elementPreview?.templateId || ''}
        onChange={(e) => {
          const templateId = e.target.value;
          console.log(e);
          const template = templates.find((t) => t.templateId === templateId);
          if (!template) return;
          setElementPreview({
            id: 'preview',
            scale: { x: 1, y: 1 },
            position: { x: 0, y: 0 },
            rotation: 0,
            crop: { top: 0, right: 0, bottom: 0, left: 0 },
            ...template,
            ...TransformUtils.alignToCanvas(
              template.container,
              template.defaultAlignment
            ),
          });
        }}
      >
        <option value="">-</option>
        {templates.map((template) => (
          <option key={template.templateId} value={template.templateId}>
            {template.name}
          </option>
        ))}
      </select>
      {elementPreview && (
        <>
          <div
            style={{
              width: PREVIEW_SCREEN_WIDTH * 0.5,
              height: PREVIEW_SCREEN_HEIGHT * 0.5,
              background: 'black',
            }}
          >
            <div
              style={{
                transform: 'scale(0.5)',
                transformOrigin: 'top left',
                position: 'relative',
                width: PREVIEW_SCREEN_WIDTH,
                height: PREVIEW_SCREEN_HEIGHT,
              }}
            >
              <CustomElementComponent item={elementPreview} />
            </div>
          </div>
          <div>
            {elementPreview.variables &&
              Object.entries(elementPreview.variables).map(([name, def]) => {
                if (def.type === 'string' || def.type === 'color')
                  return (
                    <label>
                      {def.label}
                      <input
                        value={def.value}
                        onChange={(e) => {
                          if (!elementPreview?.variables?.[name]) return;
                          elementPreview.variables[name].value = e.target.value;
                          setElementPreview({ ...elementPreview });
                        }}
                      />
                    </label>
                  );
                if (def.type === 'boolean')
                  return (
                    <label>
                      {def.label}
                      <input
                        type="checkbox"
                        checked={def.value}
                        onChange={(e) => {
                          if (!elementPreview?.variables?.[name]) return;
                          elementPreview.variables[name].value =
                            e.target.checked;
                          setElementPreview({ ...elementPreview });
                        }}
                      />
                    </label>
                  );
                return null;
              })}
          </div>
        </>
      )}
    </div>
  );
};

(() => {
  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.get('dev')) {
    render(<DevPreview />, elem);
    return;
  }

  const layerParam = searchParams.get('layer');
  const layerInt = layerParam && parseInt(layerParam, 10);
  if (typeof layerInt === 'number') render(<App layer={layerInt} />, elem);
})();
