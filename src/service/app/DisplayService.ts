import { BrowserWindow, IpcMainInvokeEvent, screen } from 'electron';
import * as osn from 'obs-studio-node';
import { callableFromRenderer } from './utils';

type Bounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

class DisplayService {
  @callableFromRenderer
  async resizePreview(previewId: string, bounds: Bounds) {
    const event = (this as unknown) as IpcMainInvokeEvent;
    try {
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
        displayWidth,
        displayHeight
      );
      osn.NodeObs.OBS_content_moveDisplay(previewId, displayX, displayY);
    } catch (err) {
      throw Error(err.message);
    }
  }

  @callableFromRenderer
  async attachPreview(previewId: string, bounds: Bounds, sourceId?: string) {
    const event = (this as unknown) as IpcMainInvokeEvent;
    try {
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
      new DisplayService().resizePreview.bind(this)(previewId, bounds);
    } catch (err) {
      throw Error(err.message);
    }
  }

  @callableFromRenderer
  async detachPreview(previewId: string) {
    try {
      osn.NodeObs.OBS_content_destroyDisplay(previewId);
    } catch (err) {
      throw Error(err.message);
    }
  }
}

export default DisplayService;
