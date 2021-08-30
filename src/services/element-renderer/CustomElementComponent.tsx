import React, { FC } from 'react';
import root from 'react-shadow';
import JsxParser from 'react-jsx-parser';
import { Variables } from 'electron-log';
import { CustomItem } from '../broadcaster/types';

const CustomElementComponent: FC<{
  item: CustomItem;
}> = ({ item }) => {
  return (
    <root.div
      style={{
        position: 'absolute',
        left: item.position.x,
        top: item.position.y,
        transform: `scale(${item.scale.x}, ${item.scale.y}) rotate(${
          item.rotation ?? 0
        }deg)`,
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
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              obj[name] = def.value;
              return obj;
            }, {})
          }
        />
      </div>
    </root.div>
  );
};

export default CustomElementComponent;
