import React, { useCallback, useEffect, useState } from 'react';
import { DraggableProvided } from 'react-beautiful-dnd';
import { Card, Button, Input, Select, Form, Checkbox } from 'antd';
import {
  DeleteOutlined,
  DragOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  SceneItem,
  SerializableSource,
} from '../../services/broadcaster/types';
import BroadcasterService from '../../services/broadcaster';
import useBroadcasterState from '../hooks/useBroadcasterState';

type SceneItemConfiguratorProps = {
  sceneItem: SceneItem;
  onRemove: () => void;
  draggableProvided: DraggableProvided;
};

const OBS_QUICK_SETTINGS = ['url', 'monitor', 'video_device_id'];

const broadcaster = BroadcasterService.getIpcRendererClient();

const SceneItemConfigurator = ({
  sceneItem,
  onRemove,
  draggableProvided,
}: SceneItemConfiguratorProps) => {
  const [obsSource, setObsSource] = useState<SerializableSource>();
  const [advancedMode, setAdvancedMode] = useState(false);
  const broadcasterState = useBroadcasterState();

  const loadObsSource = useCallback(async () => {
    if (sceneItem.type !== 'obs-source') return;
    const newObsSource = await broadcaster.source.get(sceneItem.sourceId);
    setObsSource(newObsSource);
  }, [sceneItem]);

  useEffect(() => {
    loadObsSource();
  }, [loadObsSource]);

  console.log(obsSource);

  return (
    <div
      ref={draggableProvided.innerRef}
      {...draggableProvided.draggableProps}
      className="mb-2"
    >
      <Card
        onClick={async () => {
          broadcaster.scene.selectItem(sceneItem.id);
        }}
        title={sceneItem.name}
        size="small"
        extra={
          /* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */
          <div onClick={(e) => e.stopPropagation()}>
            <Button
              type={
                broadcasterState.activeScene?.selectedItem?.id === sceneItem.id
                  ? 'primary'
                  : 'link'
              }
              icon={<DragOutlined />}
              title="transform"
              onClick={async () => {
                broadcaster.scene.selectItem(sceneItem.id);
              }}
            />
            <Button
              type={advancedMode ? 'primary' : 'link'}
              icon={<SettingOutlined />}
              onClick={() => setAdvancedMode((ps) => !ps)}
            />
            <Button
              type="link"
              danger
              icon={<DeleteOutlined onClick={onRemove} />}
            />
          </div>
        }
        {...draggableProvided.dragHandleProps}
      >
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
        <div onClick={(e) => e.stopPropagation()}>
          {sceneItem.type === 'browser-rendered' && sceneItem.variables && (
            <Form
              layout="vertical"
              labelAlign="left"
              initialValues={Object.entries(sceneItem.variables).reduce(
                (obj, [name, def]) => ({ ...obj, [name]: def.value }),
                {}
              )}
              onValuesChange={(values) => {
                Object.entries(values).forEach(([name, value]) => {
                  if (!sceneItem.variables) return;
                  sceneItem.variables[name].value =
                    value as typeof sceneItem.variables[0]['value'];
                });
                broadcaster.scene.setCustomItemVariables(
                  sceneItem.id,
                  sceneItem.variables
                );
              }}
            >
              {Object.entries(sceneItem.variables)
                .filter(
                  ([, def]) => advancedMode || def.visibility === 'normal'
                )
                .map(([name, def], i, arr) => {
                  if (def.type === 'string' || def.type === 'color')
                    return (
                      <Form.Item
                        name={name}
                        key={name}
                        className={i === arr.length - 1 ? 'mb-0' : undefined}
                      >
                        <Input addonBefore={def.label} type="text" />
                      </Form.Item>
                    );
                  if (def.type === 'boolean')
                    return (
                      <Form.Item
                        name={name}
                        key={name}
                        valuePropName="checked"
                        className={i === arr.length - 1 ? 'mb-0' : undefined}
                      >
                        <Checkbox>{def.label}</Checkbox>
                      </Form.Item>
                    );
                  return null;
                })}
            </Form>
          )}
          {obsSource && (
            <Form
              layout="vertical"
              labelAlign="left"
              initialValues={obsSource.settings}
              onValuesChange={(values) => {
                broadcaster.source.setSettings(obsSource.id, values);
              }}
            >
              {obsSource?.properties
                .filter(
                  (item) =>
                    (advancedMode || OBS_QUICK_SETTINGS.includes(item.name)) &&
                    item.visible
                )
                .map((item, i, arr) => {
                  if (item.type === 1)
                    return (
                      <Form.Item
                        name={item.name}
                        key={item.name}
                        valuePropName="checked"
                        className={i === arr.length - 1 ? 'mb-0' : undefined}
                      >
                        <Checkbox>{item.description}</Checkbox>
                      </Form.Item>
                    );
                  if (item.type === 2)
                    return (
                      <Form.Item
                        name={item.name}
                        key={item.name}
                        className={i === arr.length - 1 ? 'mb-0' : undefined}
                        normalize={(val) => parseInt(val, 10)}
                      >
                        <Input addonBefore={item.description} type="number" />
                      </Form.Item>
                    );
                  if (item.type === 4)
                    return (
                      <Form.Item
                        name={item.name}
                        key={item.name}
                        className={i === arr.length - 1 ? 'mb-0' : undefined}
                      >
                        <Input addonBefore={item.description} type="text" />
                      </Form.Item>
                    );
                  if (item.type === 6 && Array.isArray(item.details?.items))
                    return (
                      <Form.Item
                        label={item.description}
                        name={item.name}
                        key={item.name}
                        className={i === arr.length - 1 ? 'mb-0' : undefined}
                      >
                        <Select>
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {item.details.items.map((opt: any) => (
                            <Select.Option value={opt.value} key={opt.value}>
                              {opt.name}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    );
                  if (item.type === 8)
                    return (
                      <Form.Item
                        key={item.name}
                        className={i === arr.length - 1 ? 'mb-0' : undefined}
                      >
                        <Button
                          htmlType="button"
                          onClick={() => {
                            broadcaster.source.clickButton(
                              obsSource.id,
                              item.name
                            );
                          }}
                        >
                          {item.description}
                        </Button>
                      </Form.Item>
                    );
                  return null;
                })}
            </Form>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SceneItemConfigurator;
