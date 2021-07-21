import * as osn from 'obs-studio-node';
import BroadcasterServiceModule from '../BroadcasterServiceModule';
import { Bounds } from '../types';

class DisplayService extends BroadcasterServiceModule {
  private windowHandle: Buffer;

  constructor(windowHandle?: Buffer) {
    super();
    if (!windowHandle && process.type === 'browser')
      throw Error('windowHandle is required!');
    this.windowHandle = windowHandle as Buffer;
  }

  async resizePreview(previewId: string, bounds: Bounds) {
    try {
      osn.NodeObs.OBS_content_resizeDisplay(
        previewId,
        bounds.width,
        bounds.height
      );
      osn.NodeObs.OBS_content_moveDisplay(previewId, bounds.x, bounds.y);
    } catch (err) {
      throw Error(err.message);
    }
  }

  async attachPreview(previewId: string, bounds: Bounds, sourceId?: string) {
    try {
      if (sourceId) {
        osn.NodeObs.OBS_content_createSourcePreviewDisplay(
          this.windowHandle,
          sourceId,
          previewId
        );
      } else {
        osn.NodeObs.OBS_content_createDisplay(this.windowHandle, previewId, 0);
      }
      osn.NodeObs.OBS_content_setShouldDrawUI(previewId, false);
      osn.NodeObs.OBS_content_setPaddingSize(previewId, 0);
      this.resizePreview.bind(this)(previewId, bounds);
    } catch (err) {
      throw Error(err.message);
    }
  }

  async detachPreview(previewId: string) {
    try {
      osn.NodeObs.OBS_content_destroyDisplay(previewId);
    } catch (err) {
      throw Error(err.message);
    }
  }

  registerIpcMethods() {
    return {
      resizePreview: this.resizePreview.bind(this),
      attachPreview: this.attachPreview.bind(this),
      detachPreview: this.detachPreview.bind(this),
    };
  }
}

export default DisplayService;
