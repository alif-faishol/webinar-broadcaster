import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { Rnd, RndDragCallback, RndResizeCallback } from 'react-rnd';
import { ScissorsIcon } from '@heroicons/react/solid';
import TransformUtils, {
  PREVIEW_SCREEN_HEIGHT,
  PREVIEW_SCREEN_WIDTH,
} from '../services/app/TransformUtils';
import { SceneItemTransformValues } from '../services/app/types';
import useKeyPress from '../hooks/useKeyPress';

type ElementTransformerProps = {
  containerSize: { width: number; height: number };
  item: SceneItemTransformValues & { width: number; height: number };
  onChange: (transformValues: SceneItemTransformValues) => void;
  onClose: () => void;
};

/**
 * Ignores movement less than specified value
 */
const IGNORE_MOVE_PX = 5;

const ElementTransformer: FC<ElementTransformerProps> = ({
  item: itemProps,
  containerSize,
  onChange,
  onClose,
}) => {
  const [cropMode, setCropMode] = useState(false);
  const [item, setItem] = useState(itemProps);

  const previewWidthScale = containerSize.width / PREVIEW_SCREEN_WIDTH;
  const previewHeightScale = containerSize.height / PREVIEW_SCREEN_HEIGHT;

  const scalerRef = useRef<Rnd>(null);
  const cropperRef = useRef<Rnd>(null);

  const altKeyPressed = useKeyPress('Alt');
  const shiftKeyPressed = useKeyPress('Shift');

  const handleMoveItem: RndDragCallback = useCallback(
    (_e, data) => {
      const newPosition = {
        x: item.crop.left * item.scale.x + data.x / previewWidthScale,
        y: item.crop.top * item.scale.y + data.y / previewHeightScale,
      };

      if (
        Math.abs(item.position.x - newPosition.x) < IGNORE_MOVE_PX &&
        Math.abs(item.position.y - newPosition.y) < IGNORE_MOVE_PX
      )
        return;

      item.position = newPosition;

      setItem({ ...item });
    },
    [item, previewWidthScale, previewHeightScale]
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

      setItem({ ...item });
    },
    [item, previewWidthScale, previewHeightScale]
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
      setItem({ ...item });
    },
    [item, previewWidthScale, previewHeightScale]
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

  useEffect(() => {
    setCropMode(altKeyPressed);
  }, [altKeyPressed]);

  useEffect(() => {
    onChange(item);
    if (!scalerRef.current || !cropperRef.current) return;
    scalerRef.current.updateSize(itemBounds);
    scalerRef.current.updatePosition(itemBounds);
    cropperRef.current.updateSize(itemCropBounds);
    cropperRef.current.updatePosition(itemCropBounds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  return (
    <>
      {/* eslint-disable-next-line */}
      <div
        className="fixed inset-0"
        onClick={() => onClose()}
      />
      <Rnd
        ref={scalerRef}
        default={itemBounds}
        onDragStop={handleMoveItem}
        enableResizing={!cropMode}
        lockAspectRatio={shiftKeyPressed}
        onResizeStop={handleResizeItem}
        className={[
          'border bg-opacity-20 border-green-500',
          cropMode ? '' : 'bg-green-500',
        ].join(' ')}
      >
        <Rnd
          ref={cropperRef}
          key={`${item.scale.x}-${item.scale.y}-${cropMode}`}
          default={itemCropBounds}
          onResizeStop={handleCropItem}
          lockAspectRatio={shiftKeyPressed}
          bounds="parent"
          className={[
            scalerRef.current?.state.resizing
              ? ''
              : 'border bg-opacity-20 border-red-500 border-opacity-50',
            cropMode ? 'bg-red-500' : '',
          ].join(' ')}
        />
        <div className="absolute -right-16 flex flex-col border border-cool-gray-900 shadow-lg text-center text-xs">
          <button
            type="button"
            className={[
              'w-12 h-12 border-b border-cool-gray-900',
              cropMode
                ? 'bg-cool-gray-900 text-white'
                : 'bg-white text-cool-gray-900',
            ].join(' ')}
            onClick={() => setCropMode((ps) => !ps)}
          >
            <ScissorsIcon className="align-middle text-center w-full h-8" />
          </button>
          {cropMode && (
            <button
              type="button"
              className="bg-white w-12 h-12"
              onClick={() => {
                setItem({
                  ...item,
                  position: {
                    y: Math.max(item.position.y - item.crop.top, 0),
                    x: Math.max(item.position.x - item.crop.left, 0),
                  },
                  crop: { right: 0, bottom: 0, left: 0, top: 0 },
                });
              }}
            >
              Reset
            </button>
          )}
          {!cropMode && (
            <>
              <button
                type="button"
                className="bg-white w-12 h-12 border-b border-cool-gray-900"
                onClick={() => {
                  setItem({
                    ...item,
                    ...TransformUtils.fitInCanvas({
                      width: item.width - item.crop.left - item.crop.right,
                      height: item.height - item.crop.top - item.crop.bottom,
                    }),
                  });
                }}
              >
                Fit
              </button>
              <button
                type="button"
                className="bg-white w-12 h-12"
                onClick={() => {
                  setItem({
                    ...item,
                    ...TransformUtils.fillCanvas({
                      width: item.width - item.crop.left - item.crop.right,
                      height: item.height - item.crop.top - item.crop.bottom,
                    }),
                  });
                }}
              >
                Cover
              </button>
            </>
          )}
        </div>
      </Rnd>
    </>
  );
};

export default ElementTransformer;
