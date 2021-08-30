import React, { FC, useRef, useEffect } from 'react';
import electron from 'electron';
import { message } from 'antd';
import { Mutex } from 'async-mutex';
import BroadcasterService from '../../services/broadcaster';

type VolmeterBarProps = { width?: number; sourceId: string };

const broadcaster = BroadcasterService.getIpcRendererClient();

const VolmeterBar: FC<VolmeterBarProps> = ({ sourceId, width = 244 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mutexRef = useRef(new Mutex());

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return undefined;

    let rafId: number | undefined;
    let channelId: string | undefined;
    let lastPeaked = 0;
    let noUpdateTimeout: number | undefined;

    const clearCanvas = () => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.beginPath();
      ctx.rect(0, 0, ctx.canvas.width, 2);
      ctx.fillStyle = 'rgb(229, 231, 235)';
      ctx.fill();
    };

    const onVolmeterUpdate = (
      _event: electron.IpcRendererEvent,
      args: { magnitude: number[]; peak: number[]; inputPeak: number[] }
    ) => {
      rafId = window.requestAnimationFrame((time) => {
        window.clearTimeout(noUpdateTimeout);
        clearCanvas();
        ctx.beginPath();
        const peakPercentage = 1 - (args.peak[0] ?? -60) / -60;
        const inputPeakPercentage = 1 - (args.inputPeak[0] ?? -60) / -60;
        ctx.rect(0, 0, ctx.canvas.width * peakPercentage, 2);
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
        clearCanvas();
        channelId = await broadcaster.audio.getVolmeterIpcChannel(sourceId);

        electron.ipcRenderer.on(channelId, onVolmeterUpdate);
      })
      .catch((err) => message.error(err.message));

    return () => {
      mutex.runExclusive(() => {
        if (rafId) window.cancelAnimationFrame(rafId);
        if (channelId)
          electron.ipcRenderer.removeListener(channelId, onVolmeterUpdate);
        broadcaster.audio.unsubscribeVolmeter(sourceId);
      });
    };
  }, [sourceId]);

  return <canvas ref={canvasRef} width={width} height={2} className="block" />;
};

export default VolmeterBar;
