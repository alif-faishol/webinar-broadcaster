import React, { FC, useCallback, useState } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  OnDragEndResponder,
} from 'react-beautiful-dnd';
import { Typography, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Scene } from '../../services/broadcaster/types';
import SceneItemConfigurator from './SceneItemConfigurator';
import BroadcasterService from '../../services/broadcaster';
import AddElementModal from './AddElementModal';

type ElementsSidebarProps = {
  activeScene?: Scene;
};

const broadcaster = BroadcasterService.getIpcRendererClient();

const ElementsSidebar: FC<ElementsSidebarProps> = ({ activeScene }) => {
  const [addElementModalOpen, setAddElementModalOpen] = useState(false);

  const onDragEnd: OnDragEndResponder = useCallback(
    (result) => {
      if (!result.destination || !activeScene) return;
      const sourceIndex = result.source.index;
      const destinationIndex = result.destination.index;

      const { items } = activeScene;

      const [removed] = items.splice(sourceIndex, 1);
      items.splice(destinationIndex, 0, removed);
      broadcaster.scene.reorderItems(items);
    },
    [activeScene]
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-2 flex-shrink-0">
        {activeScene && (
          <>
            <Typography.Title level={5}>ELEMENTS</Typography.Title>
            <Button
              type="primary"
              onClick={() => {
                setAddElementModalOpen(true);
              }}
              icon={<PlusOutlined />}
            >
              Add
            </Button>
          </>
        )}
      </div>
      {activeScene && (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="element-sidebar">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="flex-1 overflow-auto"
              >
                {activeScene.items.map((item, index) => (
                  <Draggable
                    key={item.id}
                    draggableId={item.id.toString()}
                    index={index}
                  >
                    {(draggableProvided) => (
                      <SceneItemConfigurator
                        draggableProvided={draggableProvided}
                        sceneItem={item}
                        onRemove={() => {
                          if (!activeScene) return;
                          broadcaster.scene.removeItem(item.id, activeScene.id);
                        }}
                      />
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
      <AddElementModal
        visible={addElementModalOpen}
        onCancel={() => setAddElementModalOpen(false)}
      />
    </div>
  );
};

export default ElementsSidebar;
