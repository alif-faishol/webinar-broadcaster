import { EAlignment, SceneItemTransformValues } from '../types';

export const PREVIEW_SCREEN_WIDTH = 1920;
export const PREVIEW_SCREEN_HEIGHT = 1080;

type Dimension = { width: number; height: number };

const alignToCanvas = (
  dimension: Dimension,
  align?: EAlignment
): Partial<SceneItemTransformValues> => {
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
};

const fitInCanvas = (
  dimension: Dimension
): Partial<SceneItemTransformValues> => {
  const minScale = Math.min(
    PREVIEW_SCREEN_HEIGHT / dimension.height,
    PREVIEW_SCREEN_WIDTH / dimension.width
  );
  return {
    scale: {
      x: minScale,
      y: minScale,
    },
    ...alignToCanvas({
      width: dimension.width * minScale,
      height: dimension.height * minScale,
    }),
  };
};

const fillCanvas = (
  dimension: Dimension
): Partial<SceneItemTransformValues> => {
  const maxScale = Math.max(
    PREVIEW_SCREEN_HEIGHT / dimension.height,
    PREVIEW_SCREEN_WIDTH / dimension.width
  );
  return {
    scale: {
      x: maxScale,
      y: maxScale,
    },
    ...alignToCanvas({
      width: dimension.width * maxScale,
      height: dimension.height * maxScale,
    }),
  };
};

export default {
  alignToCanvas,
  fitInCanvas,
  fillCanvas,
};
