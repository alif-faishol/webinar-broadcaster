import { DownOutlined } from '@ant-design/icons';
import { message, Button, Menu, Dropdown } from 'antd';
import { Mutex } from 'async-mutex';
import React, { FC, useCallback, useEffect, useRef } from 'react';
import SAT from 'sat';
import BroadcasterService from '../../services/broadcaster';
import {
  SceneItem,
  SceneItemTransformValues,
} from '../../services/broadcaster/types';
import TransformUtils, {
  PREVIEW_SCREEN_HEIGHT,
  PREVIEW_SCREEN_WIDTH,
} from '../../services/broadcaster/utils/TransformUtils';
import useBroadcasterState from '../hooks/useBroadcasterState';
import useKeyPress from '../hooks/useKeyPress';

type ElementsTransformerProps = {
  containerBounds: { width: number; height: number; x: number; y: number };
};

const EDGE_HIT_AREA = 25;
const ELEMENT_MIN_SIZE = 25;

enum EEdge {
  Top = 1 << 0,
  Right = 1 << 1,
  Bottom = 1 << 2,
  Left = 1 << 3,
}

const broadcaster = BroadcasterService.getIpcRendererClient();

const ElementsTransformer: FC<ElementsTransformerProps> = ({
  containerBounds,
}) => {
  const broadcasterState = useBroadcasterState();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const ctx = canvasRef.current?.getContext('2d');
  const mutex = useRef(new Mutex());
  const rafIdRef = useRef<number>();
  const canvasStateRef = useRef<{
    selectedElement?: SceneItem & {
      width: number;
      height: number;
      init: SceneItemTransformValues & {
        cursorPos: { x: number; y: number };
        width: number;
        height: number;
      };
      selectedEdge?: number;
      resizing?: {
        lockAspectRatio: boolean;
      };
      moving?: true;
      cropping?: true;
    };
    elements: Array<SceneItem & { width: number; height: number }>;
  }>({
    elements: [],
  });

  const altKeyPressed = useKeyPress('Alt');
  const shiftKeyPressed = useKeyPress('Shift');

  const renderCanvas = useCallback(() => {
    rafIdRef.current = window.requestAnimationFrame(() => {
      if (!ctx) return;
      const scale = window.devicePixelRatio;
      ctx.canvas.width = PREVIEW_SCREEN_WIDTH * scale;
      ctx.canvas.height = PREVIEW_SCREEN_HEIGHT * scale;
      ctx.scale(scale, scale);
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      const { selectedElement } = canvasStateRef.current;

      if (toolbarRef.current)
        toolbarRef.current.style.display = selectedElement ? 'block' : 'none';
      if (selectedElement) {
        const rectPath = [
          [0, 0],
          [
            (selectedElement.width -
              selectedElement.crop.left -
              selectedElement.crop.right) *
              selectedElement.scale.x,
            0,
          ],
          [
            (selectedElement.width -
              selectedElement.crop.left -
              selectedElement.crop.right) *
              selectedElement.scale.x,
            (selectedElement.height -
              selectedElement.crop.top -
              selectedElement.crop.bottom) *
              selectedElement.scale.y,
          ],
          [
            0,
            (selectedElement.height -
              selectedElement.crop.top -
              selectedElement.crop.bottom) *
              selectedElement.scale.y,
          ],
        ];
        ctx.translate(selectedElement.position.x, selectedElement.position.y);
        ctx.rotate((selectedElement.rotation * Math.PI) / 180);

        // top
        ctx.beginPath();
        ctx.lineWidth = 5;
        if (selectedElement.crop.top) ctx.strokeStyle = '#ff4d4f';
        else ctx.strokeStyle = '#1890ff';
        ctx.moveTo(rectPath[0][0], rectPath[0][1]);
        ctx.lineTo(rectPath[1][0], rectPath[1][1]);
        ctx.stroke();

        // right
        ctx.beginPath();
        if (selectedElement.crop.right) ctx.strokeStyle = '#ff4d4f';
        else ctx.strokeStyle = '#1890ff';
        ctx.moveTo(rectPath[1][0], rectPath[1][1]);
        ctx.lineTo(rectPath[2][0], rectPath[2][1]);
        ctx.stroke();

        // bottom
        ctx.beginPath();
        if (selectedElement.crop.bottom) ctx.strokeStyle = '#ff4d4f';
        else ctx.strokeStyle = '#1890ff';
        ctx.moveTo(rectPath[2][0], rectPath[2][1]);
        ctx.lineTo(rectPath[3][0], rectPath[3][1]);
        ctx.stroke();

        // left
        ctx.beginPath();
        if (selectedElement.crop.left) ctx.strokeStyle = '#ff4d4f';
        else ctx.strokeStyle = '#1890ff';
        ctx.moveTo(rectPath[3][0], rectPath[3][1]);
        ctx.lineTo(rectPath[0][0], rectPath[0][1]);
        ctx.stroke();

        // fill
        ctx.beginPath();
        ctx.moveTo(rectPath[0][0], rectPath[0][1]);
        ctx.lineTo(rectPath[1][0], rectPath[1][1]);
        ctx.lineTo(rectPath[2][0], rectPath[2][1]);
        ctx.lineTo(rectPath[3][0], rectPath[3][1]);
        ctx.fillStyle = 'rgba(24, 144, 255, .2)';
        ctx.fill();
      }
    });
  }, [ctx]);

  const getCanvasCursorPos = useCallback(
    (x, y) => {
      if (!ctx) return { x: 0, y: 0 };
      const canvasBounds = ctx.canvas.getBoundingClientRect();
      return {
        x: Math.round(
          (x - canvasBounds.left) * (PREVIEW_SCREEN_WIDTH / canvasBounds.width)
        ),
        y: Math.round(
          (y - canvasBounds.top) * (PREVIEW_SCREEN_HEIGHT / canvasBounds.height)
        ),
      };
    },
    [ctx]
  );

  const handleMouseDown: React.MouseEventHandler<HTMLCanvasElement> =
    useCallback(
      (e) => {
        if (!ctx) return;
        const cursorPos = getCanvasCursorPos(e.clientX, e.clientY);
        const { selectedElement } = canvasStateRef.current;
        let overlapPol: SAT.Polygon = new SAT.Polygon();
        const overlap = canvasStateRef.current.elements.find((elem) => {
          const rectPath = [
            new SAT.Vector(-EDGE_HIT_AREA, -EDGE_HIT_AREA),
            new SAT.Vector(
              (elem.width - elem.crop.left - elem.crop.right) * elem.scale.x +
                EDGE_HIT_AREA * 2,
              -EDGE_HIT_AREA
            ),
            new SAT.Vector(
              (elem.width - elem.crop.left - elem.crop.right) * elem.scale.x +
                EDGE_HIT_AREA * 2,
              (elem.height - elem.crop.top - elem.crop.bottom) * elem.scale.y +
                EDGE_HIT_AREA * 2
            ),
            new SAT.Vector(
              -EDGE_HIT_AREA,
              (elem.height - elem.crop.top - elem.crop.bottom) * elem.scale.y +
                EDGE_HIT_AREA * 2
            ),
          ];
          overlapPol = new SAT.Polygon(
            new SAT.Vector(elem.position.x, elem.position.y),
            rectPath
          ).rotate((elem.rotation * Math.PI) / 180);

          return SAT.pointInPolygon(
            new SAT.Vector(cursorPos.x, cursorPos.y),
            overlapPol
          );
        });
        if (selectedElement && overlap?.id === selectedElement.id) {
          let selectedEdge = 0;
          if (
            Math.abs(cursorPos.x - selectedElement.position.x) < EDGE_HIT_AREA
          ) {
            selectedEdge += EEdge.Left;
          }
          if (
            Math.abs(cursorPos.y - selectedElement.position.y) < EDGE_HIT_AREA
          ) {
            selectedEdge += EEdge.Top;
          }
          if (
            Math.abs(
              cursorPos.x -
                (selectedElement.position.x +
                  (selectedElement.width -
                    selectedElement.crop.left -
                    selectedElement.crop.right) *
                    selectedElement.scale.x)
            ) < EDGE_HIT_AREA
          ) {
            selectedEdge += EEdge.Right;
          }
          if (
            Math.abs(
              cursorPos.y -
                (selectedElement.position.y +
                  (selectedElement.height -
                    selectedElement.crop.top -
                    selectedElement.crop.bottom) *
                    selectedElement.scale.y)
            ) < EDGE_HIT_AREA
          ) {
            selectedEdge += EEdge.Bottom;
          }
          if (selectedEdge) {
            selectedElement.selectedEdge = selectedEdge;
            if (altKeyPressed) {
              selectedElement.cropping = true;
              selectedElement.resizing = undefined;
            } else {
              selectedElement.cropping = undefined;
              selectedElement.resizing = {
                lockAspectRatio: false,
              };
            }
            selectedElement.init = {
              cursorPos,
              crop: selectedElement.crop,
              rotation: selectedElement.rotation,
              position: selectedElement.position,
              scale: selectedElement.scale,
              width: selectedElement.width,
              height: selectedElement.height,
            };
            return;
          }
          selectedElement.resizing = undefined;
          selectedElement.cropping = undefined;
        }
        if (overlap) {
          if (selectedElement?.id === overlap.id) {
            selectedElement.moving = true;
            selectedElement.init = {
              cursorPos,
              crop: overlap.crop,
              rotation: overlap.rotation,
              position: overlap.position,
              scale: overlap.scale,
              width: overlap.width,
              height: overlap.height,
            };
          } else {
            canvasStateRef.current.selectedElement = Object.assign(overlap, {
              init: {
                cursorPos,
                crop: overlap.crop,
                rotation: overlap.rotation,
                position: overlap.position,
                scale: overlap.scale,
                width: overlap.width,
                height: overlap.height,
              },
            });
            canvasStateRef.current.selectedElement.moving = true;
          }
        } else {
          canvasStateRef.current.selectedElement = undefined;
        }
        renderCanvas();
      },
      [ctx, renderCanvas, getCanvasCursorPos, altKeyPressed]
    );

  const handleMouseMove: React.MouseEventHandler<HTMLCanvasElement> =
    useCallback(
      (e) => {
        if (!ctx) return;
        const { selectedElement } = canvasStateRef.current;
        if (!selectedElement) return;
        const cursorPos = getCanvasCursorPos(e.clientX, e.clientY);
        const { init } = selectedElement;
        const transformValues: Partial<SceneItemTransformValues> = {};
        const delta = { x: 0, y: 0 };
        if (selectedElement.selectedEdge) {
          if (selectedElement.selectedEdge & EEdge.Left) {
            delta.x = cursorPos.x - init.cursorPos.x;
          }
          if (selectedElement.selectedEdge & EEdge.Top) {
            delta.y = cursorPos.y - init.cursorPos.y;
          }
          if (selectedElement.selectedEdge & EEdge.Right) {
            delta.x = init.cursorPos.x - cursorPos.x;
          }
          if (selectedElement.selectedEdge & EEdge.Bottom) {
            delta.y = init.cursorPos.y - cursorPos.y;
          }
        }
        if (selectedElement.moving) {
          transformValues.position = {
            x: init.position.x + cursorPos.x - init.cursorPos.x,
            y: init.position.y + cursorPos.y - init.cursorPos.y,
          };
        } else if (selectedElement.cropping && selectedElement.selectedEdge) {
          transformValues.crop = { ...init.crop };
          transformValues.position = { ...init.position };
          if (selectedElement.selectedEdge & EEdge.Left) {
            transformValues.crop.left =
              init.crop.left + Math.round(delta.x / init.scale.x);
          }
          if (selectedElement.selectedEdge & EEdge.Right)
            transformValues.crop.right = Math.max(
              0,
              init.crop.right + Math.round(delta.x / init.scale.x)
            );
          if (selectedElement.selectedEdge & EEdge.Top)
            transformValues.crop.top = Math.max(
              0,
              init.crop.top + Math.round(delta.y / init.scale.y)
            );
          if (selectedElement.selectedEdge & EEdge.Bottom)
            transformValues.crop.bottom = Math.max(
              0,
              init.crop.bottom + Math.round(delta.y / init.scale.y)
            );
          const maxCropX = init.width - ELEMENT_MIN_SIZE / init.scale.x;
          const maxCropY = init.height - ELEMENT_MIN_SIZE / init.scale.y;
          transformValues.crop.bottom = Math.max(
            0,
            Math.min(maxCropY - init.crop.top, transformValues.crop.bottom)
          );
          transformValues.crop.top = Math.max(
            0,
            Math.min(maxCropY - init.crop.bottom, transformValues.crop.top)
          );
          transformValues.crop.left = Math.max(
            0,
            Math.min(maxCropX - init.crop.right, transformValues.crop.left)
          );
          transformValues.crop.right = Math.max(
            0,
            Math.min(maxCropX - init.crop.left, transformValues.crop.right)
          );
          transformValues.position.x =
            init.position.x -
            init.crop.left * init.scale.x +
            transformValues.crop.left * init.scale.x;
          transformValues.position.y =
            init.position.y -
            init.crop.top * init.scale.y +
            transformValues.crop.top * init.scale.y;
        } else if (selectedElement.resizing && selectedElement.selectedEdge) {
          selectedElement.resizing.lockAspectRatio = !shiftKeyPressed;
          transformValues.position = { ...init.position };
          const scaleDelta = {
            x: delta.x / (init.width - init.crop.left - init.crop.right),
            y: delta.y / (init.height - init.crop.top - init.crop.bottom),
          };
          if (selectedElement.resizing.lockAspectRatio) {
            if ((EEdge.Top | EEdge.Bottom) & selectedElement.selectedEdge) {
              scaleDelta.x = scaleDelta.y;
            } else scaleDelta.y = scaleDelta.x;
          }
          if (selectedElement.selectedEdge & EEdge.Left) {
            transformValues.position.x =
              init.position.x +
              Math.round(
                scaleDelta.x * (init.width - init.crop.left - init.crop.right)
              );
          }
          if (selectedElement.selectedEdge & EEdge.Top) {
            transformValues.position.y =
              init.position.y +
              Math.round(
                scaleDelta.y * (init.height - init.crop.top - init.crop.bottom)
              );
          }
          transformValues.scale = {
            x: init.scale.x - scaleDelta.x,
            y: init.scale.y - scaleDelta.y,
          };
          if (selectedElement.resizing.lockAspectRatio) {
            transformValues.scale.x = transformValues.scale.y;
          }
          const minScaleX =
            ELEMENT_MIN_SIZE /
            (selectedElement.width - init.crop.left - init.crop.right);
          const minScaleY =
            ELEMENT_MIN_SIZE /
            (selectedElement.height - init.crop.top - init.crop.bottom);
          if (transformValues.scale.x < minScaleX) {
            transformValues.scale.x = minScaleX;
            transformValues.position.x = selectedElement.position.x;
          }
          if (transformValues.scale.y < minScaleY) {
            transformValues.scale.y = minScaleY;
            transformValues.position.y = selectedElement.position.y;
          }
        }
        if (transformValues.crop) selectedElement.crop = transformValues.crop;
        if (transformValues.scale)
          selectedElement.scale = transformValues.scale;
        if (transformValues.position)
          selectedElement.position = transformValues.position;
        if (typeof transformValues.rotation === 'number')
          selectedElement.rotation = transformValues.rotation;
        renderCanvas();
        mutex.current.runExclusive(() =>
          broadcaster.scene.transformItem(
            undefined,
            selectedElement.id,
            transformValues,
            false
          )
        );
      },
      [ctx, renderCanvas, getCanvasCursorPos, shiftKeyPressed]
    );

  const handleMouseUp: React.MouseEventHandler<HTMLCanvasElement> =
    useCallback(() => {
      if (!ctx) return;
      const { selectedElement } = canvasStateRef.current;
      if (!selectedElement) return;
      selectedElement.moving = undefined;
      selectedElement.resizing = undefined;
      selectedElement.cropping = undefined;
      renderCanvas();
      if (selectedElement.id !== broadcasterState.activeScene?.selectedItem?.id)
        broadcaster.scene.selectItem(selectedElement.id);
      broadcaster.scene.transformItem(undefined, selectedElement.id, {
        ...selectedElement,
      });
    }, [ctx, renderCanvas, broadcasterState]);

  useEffect(() => {
    if (!broadcasterState.activeScene?.items) return;
    const { selectedItem } = broadcasterState.activeScene;
    Promise.all(
      broadcasterState.activeScene.items.map((item) =>
        broadcaster.scene.getItemWithDimensions(item.id)
      )
    )
      .then((itemsWithDimension) => {
        canvasStateRef.current.elements = itemsWithDimension;
        if (selectedItem) {
          const found = itemsWithDimension.find(
            (item) => item.id === selectedItem.id
          );
          if (found)
            canvasStateRef.current.selectedElement = Object.assign(found, {
              init: {
                cursorPos: { x: 0, y: 0 },
                crop: found.crop,
                rotation: found.rotation,
                position: found.position,
                scale: found.scale,
                width: found.width,
                height: found.height,
              },
            });
        } else canvasStateRef.current.selectedElement = undefined;
        renderCanvas();
        return undefined;
      })
      .catch((err) => message.error(err.message));
  }, [broadcasterState, renderCanvas]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current) window.cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  return (
    <div
      className="absolute block"
      style={{
        left: containerBounds.x,
        top: containerBounds.y,
        width: containerBounds.width,
        height: containerBounds.height,
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute block inset-0"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          width: containerBounds.width,
          height: containerBounds.height,
        }}
      />
      <div
        ref={toolbarRef}
        className="absolute right-2 top-2"
        style={{ display: 'none' }}
      >
        <Dropdown
          trigger={['click']}
          className="mr-1"
          overlay={
            <Menu>
              <Menu.Item
                onClick={() => {
                  const { selectedElement } = canvasStateRef.current;
                  if (!selectedElement) return;
                  broadcaster.scene.transformItem(
                    undefined,
                    selectedElement.id,
                    TransformUtils.fitInCanvas({
                      width:
                        selectedElement.width -
                        selectedElement.crop.left -
                        selectedElement.crop.right,
                      height:
                        selectedElement.height -
                        selectedElement.crop.top -
                        selectedElement.crop.bottom,
                    })
                  );
                }}
              >
                Fit in canvas
              </Menu.Item>
              <Menu.Item
                onClick={() => {
                  const { selectedElement } = canvasStateRef.current;
                  if (!selectedElement) return;
                  broadcaster.scene.transformItem(
                    undefined,
                    selectedElement.id,
                    TransformUtils.fillCanvas({
                      width:
                        selectedElement.width -
                        selectedElement.crop.left -
                        selectedElement.crop.right,
                      height:
                        selectedElement.height -
                        selectedElement.crop.top -
                        selectedElement.crop.bottom,
                    })
                  );
                }}
              >
                Fill canvas
              </Menu.Item>
              <Menu.Item
                onClick={() => {
                  const { selectedElement } = canvasStateRef.current;
                  if (!selectedElement) return;
                  broadcaster.scene.transformItem(
                    undefined,
                    selectedElement.id,
                    {
                      position: { x: 0, y: 0 },
                      scale: { x: 1, y: 1 },
                      crop: { left: 0, top: 0, right: 0, bottom: 0 },
                      rotation: 0,
                    }
                  );
                }}
              >
                Original size
              </Menu.Item>
            </Menu>
          }
        >
          <Button>
            Resize
            <DownOutlined />
          </Button>
        </Dropdown>
        <Dropdown
          trigger={['click']}
          className="mr-1"
          overlay={
            <Menu>
              <Menu.Item
                onClick={() => {
                  const { selectedElement } = canvasStateRef.current;
                  if (!selectedElement) return;
                  broadcaster.scene.transformItem(
                    undefined,
                    selectedElement.id,
                    {
                      position: { x: selectedElement.position.x, y: 0 },
                    }
                  );
                }}
              >
                Top
              </Menu.Item>
              <Menu.Item
                onClick={() => {
                  const { selectedElement } = canvasStateRef.current;
                  if (!selectedElement) return;
                  broadcaster.scene.transformItem(
                    undefined,
                    selectedElement.id,
                    {
                      position: {
                        x:
                          PREVIEW_SCREEN_WIDTH -
                          (selectedElement.width -
                            selectedElement.crop.left -
                            selectedElement.crop.right) *
                            selectedElement.scale.x,
                        y: selectedElement.position.y,
                      },
                    }
                  );
                }}
              >
                Right
              </Menu.Item>
              <Menu.Item
                onClick={() => {
                  const { selectedElement } = canvasStateRef.current;
                  if (!selectedElement) return;
                  broadcaster.scene.transformItem(
                    undefined,
                    selectedElement.id,
                    {
                      position: {
                        x: selectedElement.position.x,
                        y:
                          PREVIEW_SCREEN_HEIGHT -
                          (selectedElement.height -
                            selectedElement.crop.top -
                            selectedElement.crop.bottom) *
                            selectedElement.scale.y,
                      },
                    }
                  );
                }}
              >
                Bottom
              </Menu.Item>
              <Menu.Item
                onClick={() => {
                  const { selectedElement } = canvasStateRef.current;
                  if (!selectedElement) return;
                  broadcaster.scene.transformItem(
                    undefined,
                    selectedElement.id,
                    {
                      position: { x: 0, y: selectedElement.position.y },
                    }
                  );
                }}
              >
                Left
              </Menu.Item>
            </Menu>
          }
        >
          <Button>
            Align
            <DownOutlined />
          </Button>
        </Dropdown>
        <Dropdown
          trigger={['click']}
          overlay={
            <Menu>
              <Menu.Item
                onClick={() => {
                  const { selectedElement } = canvasStateRef.current;
                  if (!selectedElement) return;
                  const newRotation = selectedElement.rotation + 90;
                  broadcaster.scene.transformItem(
                    undefined,
                    selectedElement.id,
                    {
                      rotation: newRotation > 360 ? 90 : newRotation,
                    }
                  );
                }}
              >
                Rotate 90deg right
              </Menu.Item>
              <Menu.Item
                onClick={() => {
                  const { selectedElement } = canvasStateRef.current;
                  if (!selectedElement) return;
                  const newRotation = selectedElement.rotation - 90;
                  broadcaster.scene.transformItem(
                    undefined,
                    selectedElement.id,
                    {
                      rotation: newRotation < 0 ? 270 : newRotation,
                    }
                  );
                }}
              >
                Rotate 90deg left
              </Menu.Item>
            </Menu>
          }
        >
          <Button>
            Rotate
            <DownOutlined />
          </Button>
        </Dropdown>
      </div>
    </div>
  );
};

export default ElementsTransformer;
