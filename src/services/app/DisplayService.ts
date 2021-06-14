import { BrowserWindow, IpcMainInvokeEvent } from 'electron';
import * as osn from 'obs-studio-node';
import { setState } from './AppState';
import { Bounds } from './types';
import { callableFromRenderer } from './utils';

class DisplayService {
  event?: IpcMainInvokeEvent;

  @callableFromRenderer
  async resizePreview(previewId: string, bounds: Bounds) {
    if (!this.event) throw Error('no event');
    try {
      const window = BrowserWindow.fromWebContents(this.event.sender);
      if (!window) throw Error('no window');

      osn.NodeObs.OBS_content_resizeDisplay(
        previewId,
        bounds.width,
        bounds.height
      );
      osn.NodeObs.OBS_content_moveDisplay(previewId, bounds.x, bounds.y);
      setState((ps) => ({ ...ps, previewBounds: bounds }));
    } catch (err) {
      throw Error(err.message);
    }
  }

  @callableFromRenderer
  async attachPreview(previewId: string, bounds: Bounds, sourceId?: string) {
    if (!this.event) throw Error('no event');
    try {
      const window = BrowserWindow.fromWebContents(this.event.sender);
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
      this.resizePreview.bind(this)(previewId, bounds);
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
