import { EAlignment, SceneItemTransformValues } from './types';

export const PREVIEW_SCREEN_WIDTH = 1920;
export const PREVIEW_SCREEN_HEIGHT = 1080;

class TransfomUtils {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  static alignToScreen(
    dimension: { width: number; height: number },
    align?: EAlignment
  ): Partial<SceneItemTransformValues> {
    const result = {
      position: {
        x: PREVIEW_SCREEN_WIDTH / 2 - dimension.width / 2,
        y: PREVIEW_SCREEN_HEIGHT / 2 - dimension.height / 2,
      },
    };
    if (!align) return result;
    if (align.includes(EAlignment.bottom)) {
      result.position.y = PREVIEW_SCREEN_HEIGHT - dimension.height;
    }
    if (align.includes(EAlignment.top)) {
      result.position.y = 0;
    }
    if (align.includes(EAlignment.left)) {
      result.position.x = 0;
    }
    if (align.includes(EAlignment.right)) {
      result.position.x = PREVIEW_SCREEN_WIDTH - dimension.width;
    }
    return result;
  }
}

export default TransfomUtils;
