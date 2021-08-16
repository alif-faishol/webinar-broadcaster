import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import {
  ModalProps,
  Modal,
  Input,
  Button,
  Dropdown,
  Menu,
  Select,
  Empty,
  message,
  Divider,
} from 'antd';
import {
  DesktopOutlined,
  DownOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import useAsync from '@alifaishol/use-async';
import { Mutex } from 'async-mutex';
import BroadcasterService from '../../services/broadcaster';
import {
  CustomItem,
  CustomItemTemplate,
  OBSItemTemplate,
} from '../../services/broadcaster/types';
import BroadcasterDisplay from './BroadcasterDisplay';
import OBSSettingsForm from './OBSSettingsForm';
import CustomElementSettingsForm from './CustomElementSettingsForm';
import CustomElementComponent from '../../services/element-renderer/CustomElementComponent';
import TransformUtils, {
  PREVIEW_SCREEN_HEIGHT,
  PREVIEW_SCREEN_WIDTH,
} from '../../services/broadcaster/utils/TransformUtils';
import useBroadcasterState from '../hooks/useBroadcasterState';

const broadcaster = BroadcasterService.getIpcRendererClient();

const ModalContent: FC<{
  onCancel?: () => void;
}> = ({ onCancel }) => {
  const broadcasterState = useBroadcasterState();
  const [name, setName] = useState('');
  const mutexRef = useRef(new Mutex());
  const [obsPreviewSourceId, setObsPreviewSourceId] = useState<string>();
  const [customElementPreview, setCustomElementPreview] =
    useState<CustomItem>();
  const obsPreviewSourceIdRef = useRef(obsPreviewSourceId);
  const { exec: loadTemplatesExec, state: loadTemplatesState } = useAsync(
    broadcaster.element.loadTemplates
  );
  const [selectedTemplate, setSelectedTemplate] = useState<
    CustomItemTemplate | OBSItemTemplate
  >();

  const onAddElement = useCallback(async () => {
    if (!selectedTemplate) return;
    if (
      selectedTemplate.type === 'obs-source' &&
      obsPreviewSourceIdRef.current
    ) {
      selectedTemplate.obsSourceId = obsPreviewSourceIdRef.current;
      obsPreviewSourceIdRef.current = undefined;
    }
    try {
      await broadcaster.scene.addItem({
        ...selectedTemplate,
        name,
      });
      onCancel?.();
    } catch (err) {
      message.error(err.message);
    }
  }, [name, selectedTemplate, onCancel]);

  useEffect(() => {
    loadTemplatesExec();
  }, [loadTemplatesExec]);

  useEffect(() => {
    setName(selectedTemplate?.name ?? '');

    mutexRef.current.runExclusive(async () => {
      try {
        // Cleanup previous source preview
        if (obsPreviewSourceIdRef.current) {
          await broadcaster.source.remove(obsPreviewSourceIdRef.current);
          obsPreviewSourceIdRef.current = undefined;
        }

        if (!selectedTemplate || selectedTemplate.type !== 'obs-source') {
          setObsPreviewSourceId(undefined);
          return;
        }

        const source = await broadcaster.source.create(
          selectedTemplate.obsSourceType
        );
        obsPreviewSourceIdRef.current = source.id;
        setObsPreviewSourceId(source.id);
      } catch (err) {
        message.error(err.message);
      }
    });

    if (selectedTemplate?.type === 'browser-rendered') {
      setCustomElementPreview({
        id: 'preview',
        scale: { x: 1, y: 1 },
        position: { x: 0, y: 0 },
        rotation: 0,
        crop: { top: 0, right: 0, bottom: 0, left: 0 },
        ...selectedTemplate,
        css:
          selectedTemplate.css &&
          `http://localhost:${broadcasterState.elementRendererPort}${selectedTemplate.css}`,
        ...TransformUtils.alignToCanvas(
          selectedTemplate.container,
          selectedTemplate.defaultAlignment
        ),
      });
    } else {
      setCustomElementPreview(undefined);
    }
  }, [selectedTemplate, broadcasterState.elementRendererPort]);

  // Cleanup before unmount
  useEffect(() => {
    return () => {
      if (obsPreviewSourceIdRef.current) {
        broadcaster.source.remove(obsPreviewSourceIdRef.current);
      }
    };
  }, []);

  return (
    <div className="flex h-96">
      <div className="w-80 mr-4 overflow-auto">
        <label className="block mb-4">
          <div className="pb-2">Name</div>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="flex mb-4">
          <Button
            type="primary"
            className="flex-1 mr-2"
            icon={<VideoCameraOutlined />}
            onClick={() => {
              mutexRef.current.runExclusive(() => {
                setSelectedTemplate((ps) => {
                  if (
                    ps?.type === 'obs-source' &&
                    ps.obsSourceType === 'dshow_input'
                  ) {
                    return undefined;
                  }
                  return {
                    type: 'obs-source',
                    obsSourceType: 'dshow_input',
                    name: 'Webcam',
                  };
                });
              });
            }}
          >
            Camera
          </Button>
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item
                  onClick={() => {
                    mutexRef.current.runExclusive(() => {
                      setSelectedTemplate((ps) => {
                        if (
                          ps?.type === 'obs-source' &&
                          ps.obsSourceType === 'monitor_capture'
                        ) {
                          return undefined;
                        }
                        return {
                          type: 'obs-source',
                          obsSourceType: 'monitor_capture',
                          name: 'Desktop Capture',
                        };
                      });
                    });
                  }}
                >
                  Fullscreen
                </Menu.Item>
                <Menu.Item
                  onClick={() => {
                    mutexRef.current.runExclusive(() => {
                      setSelectedTemplate((ps) => {
                        if (
                          ps?.type === 'obs-source' &&
                          ps.obsSourceType === 'window_capture'
                        ) {
                          return undefined;
                        }
                        return {
                          type: 'obs-source',
                          obsSourceType: 'window_capture',
                          name: 'Window Capture',
                        };
                      });
                    });
                  }}
                >
                  Window
                </Menu.Item>
              </Menu>
            }
          >
            <Button
              type="primary"
              className="flex-1"
              icon={<DesktopOutlined />}
            >
              Screen <DownOutlined />
            </Button>
          </Dropdown>
        </div>
        <Select
          loading={loadTemplatesState.loading}
          showSearch
          className="w-full"
          placeholder="Search Element..."
          onSelect={(index: number) => {
            const template = loadTemplatesState.data?.templates[index];
            if (!template) return;
            setSelectedTemplate(template);
          }}
        >
          {loadTemplatesState.data?.templates.map((template, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <Select.Option key={index} value={index}>
              {template.name}
            </Select.Option>
          ))}
        </Select>
        <Divider />
        {/* eslint-disable-next-line no-nested-ternary */}
        {obsPreviewSourceId ? (
          <OBSSettingsForm sourceId={obsPreviewSourceId} advancedMode />
        ) : customElementPreview ? (
          <CustomElementSettingsForm
            item={customElementPreview}
            advancedMode
            onVariableChange={(variables) => {
              setCustomElementPreview((ps) => ps && { ...ps, variables });
            }}
          />
        ) : undefined}
      </div>
      <div className="flex-1 flex flex-col justify-between">
        {/* eslint-disable-next-line no-nested-ternary */}
        {obsPreviewSourceId ? (
          <BroadcasterDisplay className="h-48" sourceId={obsPreviewSourceId} />
        ) : customElementPreview ? (
          <div
            style={{
              width: PREVIEW_SCREEN_WIDTH * 0.175,
              height: PREVIEW_SCREEN_HEIGHT * 0.175,
              background: 'black',
            }}
          >
            <div
              style={{
                transform: 'scale(0.175)',
                transformOrigin: 'top left',
                position: 'relative',
                width: PREVIEW_SCREEN_WIDTH,
                height: PREVIEW_SCREEN_HEIGHT,
              }}
            >
              <CustomElementComponent item={customElementPreview} />
            </div>
          </div>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Preview" />
        )}
        <div className="text-right mt-4">
          <Button onClick={onCancel} className="mr-2">
            Cancel
          </Button>
          <Button type="primary" onClick={onAddElement}>
            Add
          </Button>
        </div>
      </div>
    </div>
  );
};

const AddElementModal: FC<ModalProps & { onCancel: () => void }> = ({
  onCancel,
  ...props
}) => {
  return (
    <Modal
      width={720}
      title="Add Element"
      footer={null}
      onCancel={onCancel}
      destroyOnClose
      {...props}
    >
      <ModalContent onCancel={onCancel} />
    </Modal>
  );
};

export default AddElementModal;
