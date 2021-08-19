import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Typography,
  Layout,
  Tabs,
  Modal,
  Form,
  Input,
  Button,
  Empty,
} from 'antd';
import ElementsSidebar from '../components/ElementsSidebar';
import BroadcasterService from '../../services/broadcaster';
import useBroadcasterState from '../hooks/useBroadcasterState';
import BroadcasterDisplay, {
  getDisplayBounds,
} from '../components/BroadcasterDisplay';
import SceneToolbar from '../components/SceneToolbar';
import ElementsTransformer from '../components/ElementsTransformer';

const broadcaster = BroadcasterService.getIpcRendererClient();

const MainScreen = () => {
  const previewRef = useRef<HTMLDivElement>(null);
  const broadcasterState = useBroadcasterState();

  const [addSceneModalOpen, setAddSceneModalOpen] = useState(false);

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
          {broadcasterState.activeScene ? (
            <div className="flex flex-col h-full">
              <BroadcasterDisplay
                className="flex-1"
                windowHandle="background"
                ref={previewRef}
              />
              <ElementsTransformer
                containerBounds={getDisplayBounds(previewRef.current)}
              />
              <SceneToolbar activeScene={broadcasterState.activeScene} />
            </div>
          ) : (
            <Empty />
          )}
        </Layout.Content>
        <Layout.Sider theme="light" width={384} className="pl-4">
          <ElementsSidebar activeScene={broadcasterState.activeScene} />
        </Layout.Sider>
      </Layout>
      <Modal
        destroyOnClose
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
