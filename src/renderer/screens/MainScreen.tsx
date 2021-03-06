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
import { QuestionOutlined } from '@ant-design/icons';
import ElementsSidebar from '../components/ElementsSidebar';
import BroadcasterService from '../../services/broadcaster';
import useBroadcasterState from '../hooks/useBroadcasterState';
import BroadcasterDisplay, {
  getDisplayBounds,
} from '../components/BroadcasterDisplay';
import SceneToolbar from '../components/SceneToolbar';
import ElementsTransformer from '../components/ElementsTransformer';
import SetupWizardModal from '../components/SetupWizardModal';

const broadcaster = BroadcasterService.getIpcRendererClient();

const MainScreen = () => {
  const previewRef = useRef<HTMLDivElement>(null);
  const broadcasterState = useBroadcasterState();

  const [addSceneModalOpen, setAddSceneModalOpen] = useState(false);
  const [setupWizardModalOpen, setSetupWizardModalOpen] = useState(false);

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
            right: broadcasterState.activeScene ? (
              <Button
                icon={<QuestionOutlined />}
                size="small"
                onClick={() => setSetupWizardModalOpen(true)}
              >
                Open Guide
              </Button>
            ) : undefined,
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
        {broadcasterState.activeScene ? (
          <>
            <Layout.Content>
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
            </Layout.Content>
            <Layout.Sider theme="light" width={384} className="pl-4">
              <ElementsSidebar activeScene={broadcasterState.activeScene} />
            </Layout.Sider>
          </>
        ) : (
          <Layout.Content className="flex justify-center items-center">
            <Empty description="No Scene">
              <Button
                className="mr-2"
                type="primary"
                onClick={() => setSetupWizardModalOpen(true)}
              >
                Guided Setup
              </Button>
              <Button onClick={() => setAddSceneModalOpen(true)}>
                Create New Scene
              </Button>
            </Empty>
          </Layout.Content>
        )}
      </Layout>
      <SetupWizardModal
        visible={setupWizardModalOpen}
        onCancel={() => setSetupWizardModalOpen(false)}
      />
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
