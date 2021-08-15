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
import OBSSettingsForm from './OBSSettingsForm';

type SceneItemConfiguratorProps = {
  sceneItem: SceneItem;
  onRemove: () => void;
  draggableProvided: DraggableProvided;
};

const broadcaster = BroadcasterService.getIpcRendererClient();

const SceneItemConfigurator = ({
  sceneItem,
  onRemove,
  draggableProvided,
}: SceneItemConfiguratorProps) => {
  const [advancedMode, setAdvancedMode] = useState(false);
  const broadcasterState = useBroadcasterState();

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
          {sceneItem.type === 'obs-source' && (
            <OBSSettingsForm
              sourceId={sceneItem.sourceId}
              advancedMode={advancedMode}
            />
          )}
        </div>
      </Card>
    </div>
  );
};

export default SceneItemConfigurator;
