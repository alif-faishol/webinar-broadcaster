import React, { FC, useCallback } from 'react';
import { PlusIcon } from '@heroicons/react/solid';
import {
  DragDropContext,
  Droppable,
  Draggable,
  OnDragEndResponder,
} from 'react-beautiful-dnd';
import openModal from '../../services/modal/renderer';
import AppService from '../../services/app/AppService';
import { Scene, SceneItemTransformValues } from '../../services/app/types';
import SceneItemConfigurator from './SceneItemConfigurator';

type ElementsSidebarProps = {
  activeScene?: Scene;
  onTransform: (
    transformValues: SceneItemTransformValues & {
      id: string | number;
      width: number;
      height: number;
    }
  ) => void;
};

const appService = AppService.getInstance();

const ElementsSidebar: FC<ElementsSidebarProps> = ({
  activeScene,
  onTransform,
}) => {
  const onDragEnd: OnDragEndResponder = useCallback(
    (result) => {
      if (!result.destination || !activeScene) return;
      const sourceIndex = result.source.index;
      const destinationIndex = result.destination.index;

      const { items } = activeScene;

      const [removed] = items.splice(sourceIndex, 1);
      items.splice(destinationIndex, 0, removed);
      appService.scene.reorderItems(items);
    },
    [activeScene]
  );

  return (
    <div className="flex-1 overflow-auto self-stretch flex flex-col py-4 pr-4">
      <div className="flex justify-between items-center mb-2">
        {activeScene && (
          <>
            <h2 className="text-lg font-bold">ELEMENTS</h2>
            <button
              className="h-8 px-2 bg-cool-gray-900 text-white"
              type="button"
              onClick={() => {
                if (!activeScene) return;
                openModal('add-item');
              }}
            >
              <PlusIcon className="w-5 h-5" />
            </button>
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
                className="flex-1"
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
                        onTransform={onTransform}
                        onRemove={() => {
                          if (!activeScene) return;
                          appService.scene.removeItem(item.id, activeScene.id);
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
    </div>
  );
};

export default ElementsSidebar;