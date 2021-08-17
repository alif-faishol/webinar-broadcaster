import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import electron from 'electron';
import {
  Button,
  Divider,
  Popover,
  Slider,
  Typography,
  Tooltip,
  Badge,
  message,
} from 'antd';
import {
  AudioMutedOutlined,
  AudioOutlined,
  SoundOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Mutex } from 'async-mutex';
import BroadcasterService from '../../services/broadcaster';
import OBSSettingsForm from './OBSSettingsForm';
import { SerializableSource } from '../../services/broadcaster/types';
import useBroadcasterState from '../hooks/useBroadcasterState';
import VolmeterBar from './VolmeterBar';
import VolmeterCircle from './VolmeterCircle';

type AudioConfiguratorProps = {
  audioSourceIds: string[];
};

const broadcaster = BroadcasterService.getIpcRendererClient();

const AudioSourceForm: FC<{ sourceId: string }> = ({ sourceId }) => {
  const mutex = useRef(new Mutex());
  const broadcasterState = useBroadcasterState();
  const [source, setSource] = useState<SerializableSource>();

  const loadSource = useCallback(async () => {
    const newSource = await broadcaster.source.get(sourceId);
    setSource(newSource);
  }, [sourceId]);

  useEffect(() => {
    loadSource();
  }, [loadSource]);

  if (!source) return null;

  const name =
    broadcasterState.activeScene?.items.find(
      (it) => it.type === 'obs-source' && it.sourceId === sourceId
    )?.name ??
    source.id.split('-')[0] ??
    'Unknown';

  return (
    <>
      <div className="flex justify-between">
        <Typography.Text strong>{name}</Typography.Text>
        <div className="flex">
          <Tooltip title={source.muted ? 'Unmute' : 'Mute'}>
            <Button
              className="mr-1"
              shape="circle"
              size="small"
              icon={source.muted ? <AudioMutedOutlined /> : <AudioOutlined />}
              danger={source.muted}
              type={source.muted ? 'primary' : 'default'}
              onClick={() => {
                mutex.current.runExclusive(async () => {
                  await broadcaster.audio.toggleMute(sourceId);
                  await loadSource();
                });
              }}
            />
          </Tooltip>
          <Tooltip
            title={source.monitoringType === 2 ? 'Stop listening' : 'Listen'}
          >
            <Button
              className="mr-1"
              shape="circle"
              size="small"
              icon={<SoundOutlined />}
              type={source.monitoringType === 2 ? 'primary' : 'default'}
              onClick={() => {
                mutex.current.runExclusive(async () => {
                  await broadcaster.audio.setMonitoringType(
                    sourceId,
                    source.monitoringType === 2 ? 0 : 2
                  );
                  await loadSource();
                });
              }}
            />
          </Tooltip>
          <Popover
            trigger="click"
            placement="right"
            content={
              <div className="w-48">
                <OBSSettingsForm
                  sourceId={sourceId}
                  allowedSettingsId={['device_id']}
                />
              </div>
            }
          >
            <Tooltip title="Settings">
              <Button shape="circle" size="small" icon={<SettingOutlined />} />
            </Tooltip>
          </Popover>
        </div>
      </div>
      <Slider
        min={0}
        step={0.01}
        max={1}
        defaultValue={source.volume}
        tipFormatter={(volume) => volume && Math.round(volume * 100)}
        onChange={(volume) => {
          mutex.current.runExclusive(async () => {
            await broadcaster.audio.setVolume(sourceId, volume);
            await loadSource();
          });
        }}
      />
      <div className="ml-[6px]">
        <VolmeterBar sourceId={sourceId} />
      </div>
    </>
  );
};

const AudioConfigurator: FC<AudioConfiguratorProps> = ({ audioSourceIds }) => {
  const [configuratorVisible, setConfiguratorVisible] = useState(false);

  return (
    <Popover
      placement="top"
      destroyTooltipOnHide
      content={audioSourceIds.map((sourceId, i, arr) => (
        <div className="w-64" key={sourceId}>
          <AudioSourceForm sourceId={sourceId} />
          {i !== arr.length - 1 && <Divider className="my-3" />}
        </div>
      ))}
      onVisibleChange={setConfiguratorVisible}
      visible={configuratorVisible}
      trigger="click"
    >
      <Button
        icon={<AudioOutlined />}
        shape="round"
        className="flex items-center"
      >
        Audio
        {audioSourceIds.map((sourceId) => (
          <div className="w-[16px] h-[16px] ml-1" key={sourceId}>
            <VolmeterCircle sourceId={sourceId} />
          </div>
        ))}
      </Button>
    </Popover>
  );
};

export default AudioConfigurator;
