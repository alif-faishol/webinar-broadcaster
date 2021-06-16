import React, {
  FC,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Rnd, RndDragCallback, RndResizeCallback } from 'react-rnd';
import useAppState from '../../hooks/useAppState';
import AppService from '../../services/app/AppService';
import {
  PREVIEW_SCREEN_HEIGHT,
  PREVIEW_SCREEN_WIDTH,
} from '../../services/app/TransformUtils';
import { SceneItem, SerializableSource } from '../../services/app/types';

type TransformItemModalProps = {
  item: SceneItem;
  onClose: () => void;
};

const appService = AppService.getInstance();

const TransformItemModal: FC<TransformItemModalProps> = ({ item, onClose }) => {
  const appState = useAppState();
  const [devicePixelRatio, setDevicePixelRatio] = useState(
    window.devicePixelRatio
  );
  const [obsSource, setObsSource] = useState<SerializableSource>();
  const [cropMode, setCropMode] = useState(false);

  useEffect(() => {
    const onDevicePixelRatioChanged = () => {
      setDevicePixelRatio(window.devicePixelRatio);
    };

    const mediaQueryList = matchMedia(
      `(resolution: ${window.devicePixelRatio}dppx)`
    );
    mediaQueryList.addEventListener('change', onDevicePixelRatioChanged);

    return () => {
      mediaQueryList.removeEventListener('change', onDevicePixelRatioChanged);
    };
  });

  const previewBounds = useMemo(
    () =>
      appState.previewBounds || {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      },
    [appState.previewBounds]
  );

  const containerBounds = useMemo(
    () => ({
      x: previewBounds.x / devicePixelRatio,
      y: previewBounds.y / devicePixelRatio,
      width: previewBounds.width / devicePixelRatio,
      height: previewBounds.height / devicePixelRatio,
    }),
    [previewBounds, devicePixelRatio]
  );

  let itemWidth = 0;
  let itemHeight = 0;
  if (item.type === 'obs-source' && obsSource) {
    itemWidth = obsSource.width;
    itemHeight = obsSource.height;
  }
  if (item.type === 'browser-rendered') {
    itemWidth = item.container.width;
    itemHeight = item.container.height;
  }
  const previewWidthScale = containerBounds.width / PREVIEW_SCREEN_WIDTH;
  const previewHeightScale = containerBounds.height / PREVIEW_SCREEN_HEIGHT;

  const handleMoveItem: RndDragCallback = useCallback(
    (_e, data) => {
      if (!appState.activeScene) return;
      item.position = {
        x: item.crop.left * item.scale.x + data.x / previewWidthScale,
        y: item.crop.top * item.scale.y + data.y / previewHeightScale,
      };

      appService.scene.transformItem(appState.activeScene.id, item.id, item);
    },
    [appState.activeScene, item, previewWidthScale, previewHeightScale]
  );

  const handleResizeItem: RndResizeCallback = useCallback(
    (_e, _direction, elem, _delta, position) => {
      if (!appState.activeScene) return;
      item.scale = {
        x: elem.offsetWidth / previewWidthScale / itemWidth,
        y: elem.offsetHeight / previewHeightScale / itemHeight,
      };
      item.position = {
        x: item.crop.left * item.scale.x + position.x / previewWidthScale,
        y: item.crop.top * item.scale.y + position.y / previewHeightScale,
      };

      appService.scene.transformItem(appState.activeScene.id, item.id, item);
    },
    [
      appState.activeScene,
      item,
      previewWidthScale,
      previewHeightScale,
      itemHeight,
      itemWidth,
    ]
  );

  const handleCropItem: RndResizeCallback = useCallback(
    (_e, direction, elem, delta, position) => {
      if (!appState.activeScene) return;

      if (direction.includes('top')) {
        item.crop.top =
          itemHeight -
          item.crop.bottom -
          elem.offsetHeight / item.scale.y / previewHeightScale;
        item.position.y -= delta.height / previewHeightScale;
      }
      if (direction.includes('bottom')) {
        item.crop.bottom =
          itemHeight -
          item.crop.top -
          elem.offsetHeight / item.scale.y / previewHeightScale;
      }
      if (direction.toLowerCase().includes('left')) {
        item.crop.left =
          itemWidth -
          item.crop.right -
          elem.offsetWidth / item.scale.x / previewWidthScale;
        item.position.x -= delta.width / previewWidthScale;
      }
      if (direction.toLowerCase().includes('right')) {
        item.crop.right =
          itemWidth -
          item.crop.left -
          elem.offsetWidth / item.scale.x / previewWidthScale;
      }

      appService.scene.transformItem(appState.activeScene.id, item.id, item);
    },
    [
      appState.activeScene,
      item,
      previewWidthScale,
      previewHeightScale,
      itemHeight,
      itemWidth,
    ]
  );

  useEffect(() => {
    if (item.type !== 'obs-source') return;
    appService.source
      .get(item.sourceId)
      .then(setObsSource)
      .catch((err) => {
        throw err;
      });
  }, [item]);
  if (!appState.previewBounds || (item.type === 'obs-source' && !obsSource))
    return null;

  const itemBounds = {
    x: (item.position.x - item.crop.left * item.scale.x) * previewWidthScale,
    y: (item.position.y - item.crop.top * item.scale.y) * previewHeightScale,
    width: item.scale.x * itemWidth * previewWidthScale,
    height: item.scale.y * itemHeight * previewHeightScale,
  };

  return (
    <>
      <div
        className="fixed"
        style={{
          left: containerBounds.x,
          top: containerBounds.y,
          width: containerBounds.width,
          height: containerBounds.height,
        }}
      >
        <Rnd
          position={{
            x: itemBounds.x,
            y: itemBounds.y,
          }}
          size={{
            height: itemBounds.height,
            width: itemBounds.width,
          }}
          onDragStop={handleMoveItem}
          enableResizing={!cropMode}
          onResizeStop={handleResizeItem}
          className={[
            'border bg-opacity-50 border-green-500',
            cropMode ? '' : 'bg-green-500',
          ].join(' ')}
        >
          {cropMode && (
            <Rnd
              onResizeStop={handleCropItem}
              default={{
                x: item.crop.left * item.scale.x * previewWidthScale,
                y: item.crop.top * item.scale.y * previewHeightScale,
                height:
                  item.scale.y *
                  (itemHeight - item.crop.top - item.crop.bottom) *
                  previewHeightScale,

                width:
                  item.scale.x *
                  (itemWidth - item.crop.left - item.crop.right) *
                  previewWidthScale,
              }}
              bounds="parent"
              className={[
                'border  bg-opacity-50',
                'bg-red-500 border-red-500',
              ].join(' ')}
            />
          )}
        </Rnd>
        <button
          type="button"
          className="bg-cool-gray-900 -right-16 w-8 h-8 absolute"
          onClick={() => setCropMode((ps) => !ps)}
        >
          Crop
        </button>
      </div>
    </>
  );
};

export default TransformItemModal;
