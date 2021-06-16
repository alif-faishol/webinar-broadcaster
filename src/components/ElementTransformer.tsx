import React, { FC, useCallback, useState } from 'react';
import { Rnd, RndDragCallback, RndResizeCallback } from 'react-rnd';
import {
  PREVIEW_SCREEN_HEIGHT,
  PREVIEW_SCREEN_WIDTH,
} from '../services/app/TransformUtils';
import { SceneItemTransformValues } from '../services/app/types';

type ElementTransformerProps = {
  containerSize: { width: number; height: number };
  item: SceneItemTransformValues & { width: number; height: number };
  onChange: (transformValues: SceneItemTransformValues) => void;
  onClose: () => void;
};

const ElementTransformer: FC<ElementTransformerProps> = ({
  item,
  containerSize,
  onChange,
  onClose,
}) => {
  const [cropMode, setCropMode] = useState(false);

  const previewWidthScale = containerSize.width / PREVIEW_SCREEN_WIDTH;
  const previewHeightScale = containerSize.height / PREVIEW_SCREEN_HEIGHT;

  const handleMoveItem: RndDragCallback = useCallback(
    (_e, data) => {
      item.position = {
        x: item.crop.left * item.scale.x + data.x / previewWidthScale,
        y: item.crop.top * item.scale.y + data.y / previewHeightScale,
      };

      onChange(item);
    },
    [onChange, item, previewWidthScale, previewHeightScale]
  );

  const handleResizeItem: RndResizeCallback = useCallback(
    (_e, _direction, elem, _delta, position) => {
      item.scale = {
        x: elem.offsetWidth / previewWidthScale / item.width,
        y: elem.offsetHeight / previewHeightScale / item.height,
      };
      item.position = {
        x: item.crop.left * item.scale.x + position.x / previewWidthScale,
        y: item.crop.top * item.scale.y + position.y / previewHeightScale,
      };

      onChange(item);
    },
    [onChange, item, previewWidthScale, previewHeightScale]
  );

  const handleCropItem: RndResizeCallback = useCallback(
    (_e, direction, elem) => {
      if (direction.includes('top')) {
        item.position.y -=
          elem.offsetHeight / previewHeightScale -
          (item.height - item.crop.top - item.crop.bottom) * item.scale.y;
        item.crop.top =
          item.height -
          item.crop.bottom -
          elem.offsetHeight / item.scale.y / previewHeightScale;
      }
      if (direction.includes('bottom')) {
        item.crop.bottom =
          item.height -
          item.crop.top -
          elem.offsetHeight / item.scale.y / previewHeightScale;
      }
      if (direction.toLowerCase().includes('left')) {
        item.position.x -=
          elem.offsetWidth / previewWidthScale -
          (item.width - item.crop.left - item.crop.right) * item.scale.x;
        item.crop.left =
          item.width -
          item.crop.right -
          elem.offsetWidth / item.scale.x / previewWidthScale;
      }
      if (direction.toLowerCase().includes('right')) {
        item.crop.right =
          item.width -
          item.crop.left -
          elem.offsetWidth / item.scale.x / previewWidthScale;
      }
      onChange(item);
    },
    [item, previewWidthScale, previewHeightScale, onChange]
  );

  const itemBounds = {
    x: (item.position.x - item.crop.left * item.scale.x) * previewWidthScale,
    y: (item.position.y - item.crop.top * item.scale.y) * previewHeightScale,
    width: item.scale.x * item.width * previewWidthScale,
    height: item.scale.y * item.height * previewHeightScale,
  };

  const itemCropBounds = {
    x: item.crop.left * item.scale.x * previewWidthScale,
    y: item.crop.top * item.scale.y * previewHeightScale,
    width:
      item.scale.x *
      (item.width - item.crop.left - item.crop.right) *
      previewWidthScale,
    height:
      item.scale.y *
      (item.height - item.crop.top - item.crop.bottom) *
      previewHeightScale,
  };

  return (
    <>
      {/* eslint-disable-next-line */}
      <div
        className="fixed inset-0"
        onClick={() => onClose()}
      />
      <Rnd
        default={itemBounds}
        onDragStop={handleMoveItem}
        enableResizing={!cropMode}
        onResizeStop={handleResizeItem}
        className={[
          'border bg-opacity-20 border-green-500',
          cropMode ? '' : 'bg-green-500',
        ].join(' ')}
      >
        <Rnd
          key={`${item.scale.x}-${item.scale.y}-${cropMode}`}
          default={itemCropBounds}
          onResizeStop={handleCropItem}
          bounds="parent"
          className={[
            'border bg-opacity-20 border-red-500',
            cropMode ? 'bg-red-500' : '',
          ].join(' ')}
        />
        <div className="absolute -right-16 flex flex-col">
          <button
            type="button"
            className="bg-white w-12 h-12 text-center text-xs font-bold border border-cool-gray-900 shadow-lg"
            onClick={() => setCropMode((ps) => !ps)}
          >
            {cropMode ? 'SCALE' : 'CROP'}
          </button>
        </div>
      </Rnd>
    </>
  );
};

export default ElementTransformer;
