import { ipcRenderer } from 'electron';
import {
  AttachPreviewArgs,
  DetachPreviewArgs,
  ResizePreviewArgs,
  SetActiveSceneArgs,
} from './main';

const init = async (): Promise<number> => {
  return ipcRenderer.invoke('osn-general-init');
};

const shutdown = async (): Promise<void> => {
  return ipcRenderer.invoke('osn-general-shutdown');
};

const setCanvasResolution = ({
  width,
  height,
}: {
  width: number;
  height: number;
}): Promise<unknown> => {
  return ipcRenderer.invoke('osn-general-set-canvas-resolution', {
    width,
    height,
  });
};

const setOutputResolution = ({
  width,
  height,
}: {
  width: number;
  height: number;
}): Promise<unknown> => {
  return ipcRenderer.invoke('osn-general-set-output-resolution', {
    width,
    height,
  });
};

const resizePreview = (args: ResizePreviewArgs): Promise<void> => {
  return ipcRenderer.invoke('osn-general-resize-preview', args);
};

const attachPreview = (args: AttachPreviewArgs): Promise<void> => {
  return ipcRenderer.invoke('osn-general-attach-preview', args);
};

const detachPreview = (args: DetachPreviewArgs): Promise<void> => {
  return ipcRenderer.invoke('osn-general-detach-preview', args);
};

const setActiveScene = (args: SetActiveSceneArgs): Promise<void> => {
  return ipcRenderer.invoke('osn-general-set-active-scene', args);
};

export default {
  init,
  shutdown,
  setCanvasResolution,
  setOutputResolution,
  resizePreview,
  attachPreview,
  detachPreview,
  setActiveScene,
};
