import React, { useState, useRef } from 'react';
import OSN from '../service/osn';

const Test = () => {
  const [cameraSources, setCameraSources] = useState<unknown[]>();
  const previewRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      <div
        id="preview"
        ref={previewRef}
        style={{
          marginTop: 24,
          backgroundColor: 'blue',
          width: 1920 * 0.35,
          height: 1080 * 0.35,
        }}
      />
      <button
        type="button"
        className="bg-gray-600"
        onClick={() =>
          console.log(
            'hehe',
            OSN.general
              .setCanvasResolution({ width: 1920, height: 1080 })
              .then((res) => console.log(res))
          )
        }
      >
        set canvas resolution
      </button>
      <button
        type="button"
        onClick={() =>
          console.log(
            'hehe',
            OSN.general.init().then((res) => console.log(res))
          )
        }
      >
        init OBS
      </button>
      <button
        type="button"
        onClick={() => {
          OSN.source
            .getCameraList()
            .then((result) => {
              setCameraSources(result);
              console.log(result);
              return true;
            })
            .catch((err) => console.log(err));
          OSN.source
            .getDisplayList()
            .then((result) => {
              console.log(result);
              return true;
            })
            .catch((err) => console.log(err));
        }}
      >
        get sources
      </button>
      <textarea>{JSON.stringify(cameraSources, null, 2)}</textarea>
      <button
        type="button"
        onClick={async () => {
          if (!previewRef.current) return;
          const {
            width,
            height,
            x,
            y,
          } = previewRef.current.getBoundingClientRect();
          const sourceId = await OSN.source.createDisplaySource({});
          const sceneId = await OSN.scene.create();
          const itemId = await OSN.scene.addItem({ sceneId, sourceId });
          await OSN.general.setActiveScene({ sceneId });
          await OSN.general.attachPreview({
            previewId: 'output-preview',
            bounds: { width, height, x, y: y + 20 },
          });
          const sceneItem = await OSN.scene.getItem({ sceneId, itemId });
          console.log(sceneItem);
          OSN.scene.transformItem({
            itemId,
            sceneId,
            transformValues: {
              scale: { x: 1920 / sceneItem.width, y: 1080 / sceneItem.height },
            },
          });
        }}
      >
        attach preview
      </button>
    </div>
  );
};

export default Test;
