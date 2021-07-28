import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Typography, Layout, Tabs, Modal, Form, Input, Button } from 'antd';
import ElementsSidebar from '../components/ElementsSidebar';
import ElementTransformer from '../components/ElementTransformer';
import {
  SceneItem,
  SceneItemTransformValues,
} from '../../services/broadcaster/types';
import BroadcasterService from '../../services/broadcaster';
import useBroadcasterState from '../hooks/useBroadcasterState';

const broadcaster = BroadcasterService.getIpcRendererClient();

const MainScreen = () => {
  const previewRef = useRef<HTMLDivElement>(null);
  const previewInitializedRef = useRef<boolean>(false);

  const broadcasterState = useBroadcasterState();

  const [elementToTransform, setElementToTransform] = useState<
    SceneItem & {
      width: number;
      height: number;
    }
  >();
  const [addSceneModalOpen, setAddSceneModalOpen] = useState(false);

  const handleTransformElement = useCallback(
    (item: SceneItemTransformValues & { id: string | number }) => {
      if (!broadcasterState.activeScene) return;
      broadcaster.scene.transformItem(
        broadcasterState.activeScene.id,
        item.id,
        item
      );
    },
    [broadcasterState.activeScene]
  );

  const getPreviewBounds = useCallback((scale = 1) => {
    if (!previewRef.current)
      return {
        width: 0,
        height: 0,
        x: 0,
        y: 0,
      };
    let { width, height, x, y } = previewRef.current.getBoundingClientRect();
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
  }, []);

  useEffect(() => {
    if (!previewRef.current) return undefined;
    const previewId = 'output-preview';

    const resizePreview = () => {
      if (!previewInitializedRef.current) return;
      broadcaster.display.resizePreview(
        previewId,
        getPreviewBounds(window.devicePixelRatio)
      );
    };

    const mediaQueryList = matchMedia(
      `(resolution: ${window.devicePixelRatio}dppx)`
    );
    mediaQueryList.addEventListener('change', resizePreview);
    window.addEventListener('resize', resizePreview);

    if (previewInitializedRef.current) return undefined;
    broadcaster.display
      .attachPreview(previewId, getPreviewBounds(window.devicePixelRatio))
      .then(() => {
        previewInitializedRef.current = true;
        return undefined;
      })
      .catch(() => {
        previewInitializedRef.current = false;
      });

    return () => {
      mediaQueryList.removeEventListener('change', resizePreview);
      window.removeEventListener('resize', resizePreview);
    };
  }, [getPreviewBounds]);

  useEffect(() => {
    if (!broadcasterState.activeScene?.selectedItem) {
      setElementToTransform(undefined);
      return;
    }
    broadcaster.scene
      .getItemWithDimensions()
      .then(setElementToTransform)
      .catch(console.error);
  }, [broadcasterState.activeScene?.selectedItem]);

  return (
    <Layout className="p-4 bg-transparent h-full">
      <Layout.Content className="flex-grow-0 flex-shrink-0">
        <Tabs
          type="editable-card"
          tabBarExtraContent={{
            left: (
              <div className="h-10 flex items-center">
                <Typography.Title level={5} className="mr-4">
                  SCENES
                </Typography.Title>
              </div>
            ),
          }}
          activeKey={broadcasterState.activeScene?.id}
          onChange={broadcaster.scene.activate}
          onEdit={async (targetKey, action) => {
            if (action === 'add') {
              setAddSceneModalOpen(true);
              // const sceneName = await openModal('add-scene');
              // if (!sceneName) return;
              // broadcaster.scene.add(sceneName);
            }
            if (action === 'remove' && typeof targetKey === 'string') {
              broadcaster.scene.remove(targetKey);
            }
          }}
        >
          {broadcasterState.scenes.map((scene) => (
            <Tabs.TabPane key={scene.id} tab={scene.name} closable />
          ))}
        </Tabs>
      </Layout.Content>
      <Layout className="bg-transparent">
        <Layout.Content>
          <div ref={previewRef} className="border mx-auto w-full h-full">
            {elementToTransform && (
              <ElementTransformer
                onClose={() => broadcaster.scene.selectItem()}
                onChange={handleTransformElement}
                item={elementToTransform}
                containerBounds={getPreviewBounds()}
              />
            )}
          </div>
        </Layout.Content>
        <Layout.Sider theme="light" width={384} className="pl-4">
          <ElementsSidebar activeScene={broadcasterState.activeScene} />
        </Layout.Sider>
      </Layout>
      <Modal
        forceRender
        visible={addSceneModalOpen}
        footer={null}
        onCancel={() => setAddSceneModalOpen(false)}
        title="Add Scene"
      >
        <Form
          preserve={false}
          layout="vertical"
          onFinish={({ name }: { name: string }) => {
            broadcaster.scene.add(name);
            setAddSceneModalOpen(false);
          }}
        >
          <Form.Item
            label="Scene Name"
            name="name"
            rules={[{ required: true }]}
          >
            <Input type="text" />
          </Form.Item>
          <Form.Item className="text-right mb-0">
            <Button
              htmlType="button"
              className="mr-2"
              onClick={() => setAddSceneModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default MainScreen;
