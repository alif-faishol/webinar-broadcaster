import React, {
  forwardRef,
  HTMLAttributes,
  Ref,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import BroadcasterService from '../../services/broadcaster';

type BroadcasterDisplayProps<
  T = {
    sourceId?: string;
    windowHandle?: 'background' | 'foreground';
  }
> = Omit<HTMLAttributes<HTMLDivElement>, keyof T> & T;

const broadcaster = BroadcasterService.getIpcRendererClient();

export const getDisplayBounds = (elem?: HTMLElement | null, scale = 1) => {
  if (!elem)
    return {
      width: 0,
      height: 0,
      x: 0,
      y: 0,
    };
  let { width, height, x, y } = elem.getBoundingClientRect();
  if ((width / 16) * 9 > height) {
    x += (width - (height / 9) * 16) / 2;
    width = (height / 9) * 16;
  } else {
    y += (height - (width / 16) * 9) / 2;
    height = (width / 16) * 9;
  }
  return {
    width: width * scale,
    height: height * scale,
    x: x * scale,
    y: y * scale,
  };
};

const BroadcasterDisplay = (
  {
    sourceId,
    windowHandle = 'foreground',
    children,
    ...props
  }: BroadcasterDisplayProps,
  ref: Ref<HTMLDivElement | null>
) => {
  const displayRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => displayRef.current);

  useEffect(() => {
    if (!displayRef.current) return undefined;
    const previewId = Math.random().toString();

    let rafId: number;
    let lastBounds = getDisplayBounds(
      displayRef.current,
      window.devicePixelRatio
    );

    const resizePreview: FrameRequestCallback = () => {
      if (!displayRef.current) return;
      const newBounds = getDisplayBounds(
        displayRef.current,
        window.devicePixelRatio
      );
      if (
        newBounds.height + newBounds.width + newBounds.x + newBounds.y !==
        lastBounds.height + lastBounds.width + lastBounds.x + lastBounds.y
      ) {
        broadcaster.display.resizePreview(previewId, newBounds);
        lastBounds = newBounds;
      }
      rafId = window.requestAnimationFrame(resizePreview);
    };

    rafId = window.requestAnimationFrame(resizePreview);

    broadcaster.display.attachPreview(
      previewId,
      getDisplayBounds(displayRef.current, window.devicePixelRatio),
      sourceId,
      windowHandle
    );

    return () => {
      window.cancelAnimationFrame(rafId);
      broadcaster.display.detachPreview(previewId);
    };
  }, [sourceId, windowHandle]);

  return (
    <div ref={displayRef} {...props}>
      {children}
    </div>
  );
};

export default forwardRef(BroadcasterDisplay);
