import React, { FC, useRef, useEffect } from 'react';
import electron from 'electron';
import { message } from 'antd';
import { Mutex } from 'async-mutex';
import BroadcasterService from '../../services/broadcaster';
import { SerializableSource } from '../../services/broadcaster/types';

type VolmeterCircleProps = { size?: number; sourceId: string };

const broadcaster = BroadcasterService.getIpcRendererClient();

const muteIcon = (() => {
  const path = new Path2D();
  const m = document
    .createElementNS('http://www.w3.org/2000/svg', 'svg')
    .createSVGMatrix();
  const p1 = new Path2D(
    'M682 455V311l-76 76v68c-.1 50.7-42 92.1-94 92a95.8 95.8 0 01-52-15l-54 55c29.1 22.4 65.9 36 106 36 93.8 0 170-75.1 170-168z'
  );
  const p2 = new Path2D(
    'M833 446h-60c-4.4 0-8 3.6-8 8 0 140.3-113.7 254-254 254-63 0-120.7-23-165-61l-54 54a334.01 334.01 0 00179 81v102H326c-13.9 0-24.9 14.3-25 32v36c.1 4.4 2.9 8 6 8h408c3.2 0 6-3.6 6-8v-36c0-17.7-11-32-25-32H547V782c165.3-17.9 294-157.9 294-328 0-4.4-3.6-8-8-8zm13.1-377.7l-43.5-41.9a8 8 0 00-11.2.1l-129 129C634.3 101.2 577 64 511 64c-93.9 0-170 75.3-170 168v224c0 6.7.4 13.3 1.2 19.8l-68 68A252.33 252.33 0 01258 454c-.2-4.4-3.8-8-8-8h-60c-4.4 0-8 3.6-8 8 0 53 12.5 103 34.6 147.4l-137 137a8.03 8.03 0 000 11.3l42.7 42.7c3.1 3.1 8.2 3.1 11.3 0L846.2 79.8l.1-.1c3.1-3.2 3-8.3-.2-11.4zM417 401V232c0-50.6 41.9-92 94-92 46 0 84.1 32.3 92.3 74.7L417 401z'
  );
  const transform = m.scale(0.012).translate(150, 150);
  path.addPath(p1, transform);
  path.addPath(p2, transform);
  return path;
})();

const VolmeterCircle: FC<VolmeterCircleProps> = ({ sourceId, size = 16 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mutexRef = useRef(new Mutex());

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return undefined;

    let rafId: number | undefined;
    let channelId: string | undefined;
    let lastPeaked = 0;
    let noUpdateTimeout: number | undefined;
    let source: SerializableSource | undefined;

    const clearCanvas = (color = 'rgb(229, 231, 235)') => {
      ctx.canvas.style.width = `${size}px`;
      ctx.canvas.style.height = `${size}px`;
      const scale = window.devicePixelRatio;
      ctx.canvas.width = Math.floor(size * scale);
      ctx.canvas.height = Math.floor(size * scale);
      ctx.scale(scale, scale);
      ctx.clearRect(0, 0, size, size);
      if (source?.muted) return;
      ctx.beginPath();
      const halfSize = size / 2;
      ctx.arc(halfSize, halfSize, halfSize - 2, 0, 360);
      ctx.strokeStyle = color;
      if (source?.monitoringType === 2) {
        ctx.strokeStyle = '#1890ff';
      }
      ctx.stroke();
    };

    const onVolmeterUpdate = (
      _event: electron.IpcRendererEvent,
      args: { magnitude: number[]; peak: number[]; inputPeak: number[] }
    ) => {
      rafId = window.requestAnimationFrame((time) => {
        window.clearTimeout(noUpdateTimeout);
        clearCanvas(lastPeaked > time - 1000 ? '#ff4d4f' : undefined);
        const halfSize = size / 2;
        ctx.beginPath();
        const peakPercentage = 1 - (args.peak[0] ?? -60) / -60;
        const inputPeakPercentage = 1 - (args.inputPeak[0] ?? -60) / -60;
        ctx.arc(
          halfSize,
          halfSize,
          Math.max(0, (halfSize - 2) * peakPercentage),
          0,
          360
        );
        ctx.fillStyle = '#1890ff';
        if (inputPeakPercentage > 0.9) lastPeaked = time;
        if (lastPeaked > time - 1000) {
          ctx.fillStyle = '#ff4d4f';
        }
        ctx.fill();

        // clear when there's no update in 100ms
        noUpdateTimeout = window.setTimeout(clearCanvas, 100);
      });
    };

    const mutex = mutexRef.current;

    mutex
      .runExclusive(async () => {
        channelId = await broadcaster.audio.getVolmeterIpcChannel(sourceId);
        electron.ipcRenderer.on(channelId, onVolmeterUpdate);
        source = await broadcaster.source.get(sourceId);
        clearCanvas();
        if (source.muted) {
          ctx.fillStyle = '#ff4d4f';
          ctx.fill(muteIcon);
        }
      })
      .catch((err) => message.error(err.message));

    return () => {
      mutex.runExclusive(() => {
        if (rafId) window.cancelAnimationFrame(rafId);
        if (noUpdateTimeout) window.clearTimeout(noUpdateTimeout);
        if (channelId)
          electron.ipcRenderer.removeListener(channelId, onVolmeterUpdate);
        broadcaster.audio.unsubscribeVolmeter(sourceId);
      });
    };
  }, [sourceId, size]);

  return (
    <canvas ref={canvasRef} width={size} height={size} className="block" />
  );
};

export default VolmeterCircle;
