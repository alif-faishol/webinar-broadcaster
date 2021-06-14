import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
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

      appService.scene.transformItem(appState.activeScene.id, item.id, {
        position: {
          x: data.x / previewWidthScale,
          y: data.y / previewHeightScale,
        },
      });
    },
    [appState.activeScene, item, previewWidthScale, previewHeightScale]
  );

  const handleResizeItem: RndResizeCallback = useCallback(
    (_e, _direction, elem, _delta, position) => {
      if (!appState.activeScene) return;

      appService.scene.transformItem(appState.activeScene.id, item.id, {
        position: {
          x: position.x / previewWidthScale,
          y: position.y / previewHeightScale,
        },
        scale: {
          x: elem.offsetWidth / itemWidth / previewWidthScale,
          y: elem.offsetHeight / itemHeight / previewHeightScale,
        },
      });
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
    x: item.position.x * previewWidthScale,
    y: item.position.y * previewHeightScale,
    width: item.scale.x * itemWidth * previewWidthScale,
    height: item.scale.y * itemHeight * previewHeightScale,
  };

  return (
    <>
      <div
        className="fixed"
        style={{
          left: containerBounds.x,
          top: containerBounds.y - 20,
          width: containerBounds.width,
          height: containerBounds.height,
        }}
      >
        <Rnd
          default={itemBounds}
          onDragStop={handleMoveItem}
          onResizeStop={handleResizeItem}
          className="border border-green-500 bg-green-500 bg-opacity-50"
        />
        <div className="bg-cool-gray-900 -right-16 w-8 h-8 absolute" />
      </div>
    </>
  );
};

export default TransformItemModal;
