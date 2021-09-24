import {
  PlayCircleOutlined,
  PlusOutlined,
  QuestionOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  ModalProps,
  Modal,
  Steps,
  Divider,
  Typography,
  Button,
  notification,
} from 'antd';
import { NotificationPlacement } from 'antd/lib/notification';
import { atom, useAtom } from 'jotai';
import React, { FC, useEffect } from 'react';

const guideMessageMap: Array<
  Array<{ message: React.ReactNode; placement: NotificationPlacement }>
> = [
  [
    {
      message: (
        <Typography.Paragraph>
          Click the
          <Button className="mx-1" size="small">
            Create New Scene
          </Button>
          button or
          <Button className="mx-1" size="small">
            +
          </Button>
          button next to SCENES label
        </Typography.Paragraph>
      ),
      placement: 'topRight',
    },
    {
      message: (
        <Typography.Paragraph>
          Type the name for the scene and click
          <Button type="primary" className="mx-1" size="small">
            Submit
          </Button>
        </Typography.Paragraph>
      ),
      placement: 'topRight',
    },
  ],
  [
    {
      message: (
        <Typography.Paragraph>
          Click the
          <Button
            type="primary"
            icon={<PlusOutlined />}
            className="mx-1"
            size="small"
          >
            Add
          </Button>
          button next to ELEMENTS label
        </Typography.Paragraph>
      ),
      placement: 'topLeft',
    },
    {
      message:
        'You can search elements on the "Element" dropdown or in "OBS Source"',
      placement: 'topRight',
    },
    {
      message: (
        <Typography.Paragraph>
          Click
          <Button type="primary" className="mx-1" size="small">
            Add
          </Button>
          when you ready to add the element
        </Typography.Paragraph>
      ),
      placement: 'topRight',
    },
    {
      message:
        'You can adjust the element size and position by selecting it first',
      placement: 'topRight',
    },
  ],
  [
    {
      message: (
        <Typography.Paragraph>
          Click the
          <Button
            icon={<SettingOutlined />}
            shape="circle"
            size="small"
            className="mx-1"
          />
          button next to
          <Button
            type="primary"
            size="small"
            shape="round"
            icon={<PlayCircleOutlined />}
            className="mx-1"
          >
            Start Streaming
          </Button>
          button. And then click "<Typography.Link>get it here</Typography.Link>
          " to redirect you to your YouTube streaming console. Copy your stream
          key from YouTube and paste it in the "Stream key" field
        </Typography.Paragraph>
      ),
      placement: 'topRight',
    },
  ],
];

export const setupWizardAtom = atom({ step: 0, subStep: 0, minimized: false });

const SetupWizardModal: FC<ModalProps & { onCancel: () => void }> = ({
  onCancel,
  visible,
  ...props
}) => {
  const [state, setState] = useAtom(setupWizardAtom);

  useEffect(() => {
    if (visible) {
      setState({
        step: 0,
        subStep: 0,
        minimized: false,
      });
    }
  }, [visible, setState]);

  useEffect(() => {
    setState((ps) => ({
      ...ps,
      subStep: 0,
      minimized: false,
    }));
  }, [state.step, setState]);

  useEffect(() => {
    if (!state.minimized || !visible) return undefined;
    const message = guideMessageMap[state.step][state.subStep];
    if (!message) {
      setState((ps) => ({
        ...ps,
        step: ps.step + 1,
        minimized: false,
      }));
      return undefined;
    }
    const key = Math.random().toString();
    notification.open({
      key,
      message: message.message,
      placement: message.placement,
      btn: (
        <>
          {state.subStep === 0 ? (
            <Button
              size="small"
              className="mr-1"
              onClick={() => {
                setState((ps) => ({ ...ps, minimized: false }));
              }}
            >
              Back to guide
            </Button>
          ) : (
            <Button
              size="small"
              className="mr-1"
              onClick={() => {
                setState((ps) => ({ ...ps, subStep: ps.subStep - 1 }));
              }}
            >
              Prev
            </Button>
          )}
          <Button
            size="small"
            type="primary"
            onClick={() => {
              setState((ps) => ({ ...ps, subStep: ps.subStep + 1 }));
            }}
          >
            Next
          </Button>
        </>
      ),
      duration: 0,
      onClose: onCancel,
    });
    return () => notification.close(key);
  }, [state.subStep, state.minimized, state.step, setState, visible]);

  return (
    <>
      <Modal
        width={720}
        title="Setup Wizard"
        footer={null}
        onCancel={onCancel}
        visible={visible && !state.minimized}
        destroyOnClose
        {...props}
      >
        <Steps
          current={state.step}
          progressDot
          onChange={(step) => setState((ps) => ({ ...ps, step }))}
        >
          <Steps.Step title="Create a Scene" />
          <Steps.Step title="Add Elements" />
          <Steps.Step title="Setup YouTube" />
          <Steps.Step title="Start Broadcasting!" />
        </Steps>
        <Divider />
        {state.step === 0 && (
          <>
            <Typography.Paragraph>
              When talking about scene, you can imagine it as a Slide in
              PowerPoint. You can arrange elements inside it and switch between
              scenes. For example, we can have a scene with static image to be
              displayed before the webinar starts, a scene which contains
              speakers and their names in a lower third, and another scene which
              displays a Word document.
            </Typography.Paragraph>
            <Typography.Paragraph>
              Lets create a new scene!
            </Typography.Paragraph>
            <Button
              type="primary"
              onClick={() => {
                setState((ps) => ({ ...ps, minimized: true }));
              }}
            >
              Create Scene
            </Button>
          </>
        )}
        {state.step === 1 && (
          <>
            <Typography.Paragraph>
              Elements are things you can have in your scene. It can be a
              webcam, sharing your monitor content, images, etc.
            </Typography.Paragraph>
            <Typography.Paragraph>
              Lets see what elements we can add!
            </Typography.Paragraph>
            <Button
              type="primary"
              onClick={() => {
                setState((ps) => ({ ...ps, minimized: true }));
              }}
            >
              Add Element into Scene
            </Button>
          </>
        )}
        {state.step === 2 && (
          <>
            <Typography.Paragraph>
              Before starting your webinar, you need to setup your YouTube
              account first
            </Typography.Paragraph>
            <Typography.Paragraph>Lets do it!</Typography.Paragraph>
            <Button
              type="primary"
              onClick={() => {
                setState((ps) => ({ ...ps, minimized: true }));
              }}
            >
              Setup YouTube
            </Button>
          </>
        )}
        {state.step === 3 && (
          <>
            <Typography.Paragraph>
              If everything setup correctly, you can start your webinar stream
              by clicking Start Streaming.
            </Typography.Paragraph>
            <Typography.Paragraph>
              You can reopen this guide by clicking
              <Button className="mx-1" icon={<QuestionOutlined />} size="small">
                Open Guide
              </Button>
              button if need be.
            </Typography.Paragraph>
            <Button
              type="primary"
              danger
              onClick={() => {
                onCancel();
              }}
            >
              Close this guide
            </Button>
          </>
        )}
      </Modal>
    </>
  );
};

export default SetupWizardModal;
