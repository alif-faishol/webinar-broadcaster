import { Form, Button, Checkbox, Input, Select } from 'antd';
import React, { FC, useCallback, useEffect, useState } from 'react';
import BroadcasterService from '../../services/broadcaster';
import { SerializableSource } from '../../services/broadcaster/types';

type OBSSettingsFormProps = {
  advancedMode?: boolean;
  sourceId: string;
};

const OBS_QUICK_SETTINGS = ['url', 'monitor', 'video_device_id', 'window'];

const broadcaster = BroadcasterService.getIpcRendererClient();

const OBSSettingsForm: FC<OBSSettingsFormProps> = ({
  advancedMode = false,
  sourceId,
}) => {
  const [obsSource, setObsSource] = useState<SerializableSource>();

  const loadObsSource = useCallback(async () => {
    const newObsSource = await broadcaster.source.get(sourceId);
    setObsSource(newObsSource);
  }, [sourceId]);

  useEffect(() => {
    loadObsSource();
  }, [loadObsSource]);

  console.log(obsSource);

  if (!obsSource) return null;

  return (
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
                    broadcaster.source.clickButton(obsSource.id, item.name);
                  }}
                >
                  {item.description}
                </Button>
              </Form.Item>
            );
          return null;
        })}
    </Form>
  );
};

export default OBSSettingsForm;
