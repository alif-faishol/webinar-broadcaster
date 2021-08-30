import {
  PlayCircleOutlined,
  SettingOutlined,
  StopOutlined,
} from '@ant-design/icons';
import {
  Button,
  Popover,
  Input,
  Select,
  Typography,
  message,
  InputNumber,
  Tabs,
} from 'antd';
import React, { FC, useEffect, useState } from 'react';
import BroadcasterService from '../../services/broadcaster';
import { ISettingParam } from '../../services/broadcaster/modules/setting';
import { Scene } from '../../services/broadcaster/types';
import useBroadcasterState from '../hooks/useBroadcasterState';
import AudioConfigurator from './AudioConfigurator';

type SceneToolbarProps = {
  activeScene: Scene;
};

const broadcaster = BroadcasterService.getIpcRendererClient();

const GET_YT_STREAMKEY_URL = 'https://www.youtube.com/live_dashboard';

const SceneToolbar: FC<SceneToolbarProps> = ({ activeScene }) => {
  const broadcasterState = useBroadcasterState();
  const [obsSettings, setObsSettings] = useState<{
    [key: string]: { [key: string]: ISettingParam };
  }>({});

  useEffect(() => {
    const settingCategories = ['Stream', 'Video', 'Output'];

    Promise.all(
      settingCategories.map((settingKey) =>
        broadcaster.setting.getObsSettings(settingKey)
      )
    )
      .then((settings) => {
        setObsSettings((ps) => {
          settings.forEach((setting, i) => {
            if (!ps[settingCategories[i]]) {
              ps[settingCategories[i]] = {};
            }
            setting.forEach((param) => {
              ps[settingCategories[i]][param.name] = param;
            });
          });
          return { ...ps };
        });
        return undefined;
      })
      .catch((err) => message.error(err.message));
  }, []);

  return (
    <div
      className={[
        'flex self-center border-solid py-2 px-3 rounded-3xl mb-2 mt-4 shadow-md',
        broadcasterState.streaming ? 'border-ant-red' : 'border-ant-blue',
      ].join(' ')}
    >
      <div className="mr-12">
        {broadcasterState.streaming ? (
          <Button
            type="primary"
            danger
            shape="round"
            icon={<StopOutlined />}
            className="mr-2"
            onClick={() => {
              broadcaster.streaming.stopStreaming();
            }}
          >
            Stop Streaming
          </Button>
        ) : (
          <Button
            type="primary"
            shape="round"
            icon={<PlayCircleOutlined />}
            className="mr-2"
            onClick={() => {
              broadcaster.streaming.startStreaming();
            }}
          >
            Start Streaming
          </Button>
        )}
        <Popover
          trigger={['click']}
          content={
            <div className="w-64">
              <Tabs tabPosition="bottom">
                <Tabs.TabPane tab="General" key={0}>
                  <label className="block mb-2">
                    <div className="mb-1">Server</div>
                    <Select
                      className="w-full"
                      defaultValue={
                        obsSettings.Stream?.server?.currentValue as string
                      }
                      onChange={(value) => {
                        broadcaster.setting.setObsSetting(
                          'Stream',
                          'server',
                          value
                        );
                      }}
                    >
                      {obsSettings.Stream?.server?.values.map((item) => {
                        const [label, value] = Object.entries(item)[0];

                        return (
                          <Select.Option value={value} key={value}>
                            {label}
                          </Select.Option>
                        );
                      })}
                    </Select>
                  </label>
                  <label className="block mb-2">
                    <div className="mb-1">
                      Stream key{' '}
                      <a
                        href={GET_YT_STREAMKEY_URL}
                        target="_blank"
                        rel="noreferrer"
                      >
                        get it here
                      </a>
                    </div>
                    <Input
                      defaultValue={
                        obsSettings.Stream?.key?.currentValue as string
                      }
                      onChange={(e) => {
                        broadcaster.setting.setObsSetting(
                          'Stream',
                          'key',
                          e.target.value
                        );
                      }}
                    />
                  </label>
                </Tabs.TabPane>
                <Tabs.TabPane tab="Video" key={1}>
                  <label className="block mb-2">
                    <div className="mb-1">Resolution</div>
                    <Select
                      className="w-full"
                      defaultValue={
                        obsSettings.Video?.Output?.currentValue as string
                      }
                    >
                      <Select.Option value="1280x720">720p - HD</Select.Option>
                      <Select.Option value="1920x1080">
                        1080p - FHD
                      </Select.Option>
                    </Select>
                  </label>
                  <label className="block mb-2">
                    <div className="mb-1">Encoder</div>
                    <Select
                      className="w-full"
                      defaultValue={
                        obsSettings.Output?.StreamEncoder
                          ?.currentValue as string
                      }
                      onChange={(value) => {
                        broadcaster.setting.setObsSetting(
                          'Output',
                          'StreamEncoder',
                          value
                        );
                      }}
                    >
                      {obsSettings.Output?.StreamEncoder?.values.map((item) => {
                        const [label, value] = Object.entries(item)[0];

                        return (
                          <Select.Option value={value} key={value}>
                            {label}
                          </Select.Option>
                        );
                      })}
                    </Select>
                  </label>
                  <div className="flex mb-2">
                    <label className="block w-16 mr-2">
                      <div className="mb-1">FPS</div>
                      <Select
                        className="w-full"
                        defaultValue={
                          obsSettings.Video?.FPSCommon?.currentValue as string
                        }
                        onChange={(value) => {
                          broadcaster.setting.setObsSetting(
                            'Video',
                            'FPSCommon',
                            value
                          );
                        }}
                      >
                        <Select.Option value="30">30</Select.Option>
                        <Select.Option value="60">60</Select.Option>
                      </Select>
                    </label>
                    <label className="block">
                      <div className="mb-1">Bitrate</div>
                      <InputNumber
                        className="w-full"
                        defaultValue={
                          obsSettings.Output?.VBitrate?.currentValue as number
                        }
                        onChange={(value: number) => {
                          broadcaster.setting.setObsSetting(
                            'Output',
                            'VBitrate',
                            value
                          );
                        }}
                      />
                    </label>
                  </div>
                </Tabs.TabPane>
              </Tabs>
            </div>
          }
          title="Stream settings"
        >
          <Button icon={<SettingOutlined />} shape="circle" />
        </Popover>
      </div>
      <div className="flex">
        <AudioConfigurator audioSourceIds={activeScene.audioSources} />
      </div>
    </div>
  );
};

export default SceneToolbar;
