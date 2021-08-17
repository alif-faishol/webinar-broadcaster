import { Button } from 'antd';
import React, { FC } from 'react';
import { Scene } from '../../services/broadcaster/types';
import AudioConfigurator from './AudioConfigurator';

type SceneToolbarProps = {
  activeScene: Scene;
};

const SceneToolbar: FC<SceneToolbarProps> = ({ activeScene }) => {
  return (
    <div className="flex self-center border-solid border-ant-blue py-2 px-3 rounded-3xl mb-2 mt-4 shadow-md">
      <div className="mr-12">
        <Button type="primary" shape="round">
          Start Streaming
        </Button>
      </div>
      <div className="flex">
        <AudioConfigurator audioSourceIds={activeScene.audioSources} />
      </div>
    </div>
  );
};

export default SceneToolbar;
