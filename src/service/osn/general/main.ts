import {
  app,
  BrowserWindow,
  ipcMain,
  IpcMainInvokeEvent,
  screen,
} from 'electron';
import path from 'path';

import * as osn from 'obs-studio-node';
import { v4 as uuid } from 'uuid';
import { BehaviorSubject } from 'rxjs';
import { setSetting } from '../utils';

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../../../assets');

export const initialized = new BehaviorSubject<boolean>(true);

const init = () => {
  if (!initialized.getValue()) {
    osn.NodeObs.IPC.host(`webinar-broadcaster-${uuid()}`);
    osn.NodeObs.SetWorkingDirectory(
      path.join(
        app.getAppPath().replace('app.asar', 'app.asar.unpacked'),
        'node_modules',
        'obs-studio-node'
      )
    );
    const obsDataPath = path.join(RESOURCES_PATH, 'osn-data'); // OBS Studio configs and logs
    const initResult = osn.NodeObs.OBS_API_initAPI('en', obsDataPath, '1.0.0');

    if (initResult === 0) {
      initialized.next(true);
    }

    return initResult;
  }

  return 0;
};

export const shutdown = () => {
  if (!initialized.getValue()) {
    return;
  }
  try {
    osn.NodeObs.OBS_service_removeCallback();
    osn.NodeObs.IPC.disconnect();
    initialized.next(false);
  } catch (err) {
    throw Error(err.message);
  }
};

const setCanvasResolution = (
  _event: IpcMainInvokeEvent,
  { width, height }: { width: number; height: number }
) => {
  try {
    if (!initialized.getValue()) throw Error('Not initialized!');

    setSetting('Video', 'Untitled', 'Base', `${width}x${height}`);
  } catch (err) {
    throw Error(err.message);
  }
};

const setOutputResolution = (
  _event: IpcMainInvokeEvent,
  { width, height }: { width: number; height: number }
) => {
  try {
    if (!initialized.getValue()) throw Error('Not initialized!');

    setSetting('Video', 'Untitled', 'Output', `${width}x${height}`);
  } catch (err) {
    throw Error(err.message);
  }
};

export type ResizePreviewArgs = {
  previewId: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  scaleFactor?: number;
};

const resizePreview = (
  event: IpcMainInvokeEvent,
  { previewId, bounds, scaleFactor = 1 }: ResizePreviewArgs
) => {
  try {
    if (!initialized.getValue()) throw Error('Not initialized!');

    const dpiAwareBounds = screen.dipToScreenRect(
      BrowserWindow.fromWebContents(event.sender),
      bounds
    );

    const displayWidth = Math.floor(dpiAwareBounds.width);
    const displayHeight = Math.floor(dpiAwareBounds.height);
    const displayX = Math.floor(dpiAwareBounds.x);
    const displayY = Math.floor(dpiAwareBounds.y);
    osn.NodeObs.OBS_content_resizeDisplay(
      previewId,
      displayWidth * scaleFactor,
      displayHeight * scaleFactor
    );
    osn.NodeObs.OBS_content_moveDisplay(
      previewId,
      displayX * scaleFactor,
      displayY * scaleFactor
    );
  } catch (err) {
    throw Error(err.message);
  }
};

export type AttachPreviewArgs = ResizePreviewArgs & {
  sourceId?: string;
};

const attachPreview = (
  event: IpcMainInvokeEvent,
  { previewId, sourceId, bounds }: AttachPreviewArgs
) => {
  try {
    if (!initialized.getValue()) throw Error('Not initialized!');

    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) throw Error('Window not found!');
    if (sourceId) {
      osn.NodeObs.OBS_content_createSourcePreviewDisplay(
        window.getNativeWindowHandle(),
        sourceId,
        previewId
      );
    } else {
      osn.NodeObs.OBS_content_createDisplay(
        window.getNativeWindowHandle(),
        previewId,
        0
      );
    }
    osn.NodeObs.OBS_content_setShouldDrawUI(previewId, false);
    osn.NodeObs.OBS_content_setPaddingSize(previewId, 0);
    resizePreview(event, { previewId, bounds });
  } catch (err) {
    throw Error(err.message);
  }
};

export type DetachPreviewArgs = { previewId: string };

const detachPreview = (
  _event: IpcMainInvokeEvent,
  { previewId }: DetachPreviewArgs
) => {
  try {
    osn.NodeObs.OBS_content_destroyDisplay(previewId);
  } catch (err) {
    throw Error(err.message);
  }
};

export type SetActiveSceneArgs = {
  sceneId: string;
};

const setActiveScene = (
  _event: IpcMainInvokeEvent,
  { sceneId }: SetActiveSceneArgs
) => {
  try {
    if (!initialized.getValue()) throw Error('Not initialized');

    const scene = osn.SceneFactory.fromName(sceneId);
    osn.Global.setOutputSource(1, scene);
  } catch (err) {
    throw Error(err.message);
  }
};

// TODO
const getPerformanceStatistics = () => {
  try {
    if (!initialized.getValue()) throw Error('Not initialized');
    osn.AudioFactory.getGlobal();

    return osn.NodeObs.OBS_API_getPerformanceStatistics();
  } catch (err) {
    throw Error(err.message);
  }
};

ipcMain.handle('osn-general-init', init);
ipcMain.handle('osn-general-shutdown', shutdown);
ipcMain.handle('osn-general-set-canvas-resolution', setCanvasResolution);
ipcMain.handle('osn-general-set-output-resolution', setOutputResolution);
ipcMain.handle('osn-general-resize-preview', resizePreview);
ipcMain.handle('osn-general-attach-preview', attachPreview);
ipcMain.handle('osn-general-detach-preview', detachPreview);
ipcMain.handle('osn-general-set-active-scene', setActiveScene);
ipcMain.handle(
  'osn-general-get-performance-statistics',
  getPerformanceStatistics
);

export default undefined;
