import React, { useState } from 'react';
import { DraggableProvided } from 'react-beautiful-dnd';
import { Card, Button } from 'antd';
import {
  DeleteOutlined,
  DragOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { SceneItem } from '../../services/broadcaster/types';
import BroadcasterService from '../../services/broadcaster';
import useBroadcasterState from '../hooks/useBroadcasterState';
import OBSSettingsForm from './OBSSettingsForm';
import CustomElementSettingsForm from './CustomElementSettingsForm';

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
          {sceneItem.type === 'browser-rendered' && (
            <CustomElementSettingsForm
              item={sceneItem}
              advancedMode={advancedMode}
            />
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
