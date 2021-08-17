import { Form, Button, Checkbox, Input, Select, FormInstance } from 'antd';
import { Mutex } from 'async-mutex';
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import BroadcasterService from '../../services/broadcaster';
import { SerializableSource } from '../../services/broadcaster/types';

type OBSSettingsFormProps = {
  advancedMode?: boolean;
  sourceId: string;
  allowedSettingsId?: string[];
};

const OBS_QUICK_SETTINGS = ['url', 'monitor', 'video_device_id', 'window'];

const broadcaster = BroadcasterService.getIpcRendererClient();

const OBSSettingsForm: FC<OBSSettingsFormProps> = ({
  advancedMode = false,
  sourceId,
  allowedSettingsId = OBS_QUICK_SETTINGS,
}) => {
  const formRef = useRef<FormInstance>(null);
  const mutex = useRef(new Mutex());
  const [obsSource, setObsSource] = useState<SerializableSource>();

  const loadObsSource = useCallback(async () => {
    const newObsSource = await broadcaster.source.get(sourceId);
    setObsSource(newObsSource);
  }, [sourceId]);

  useEffect(() => {
    loadObsSource();
  }, [loadObsSource]);

  const onValuesChange = useCallback(
    (values) => {
      mutex.current.runExclusive(async () => {
        if (!obsSource) return;
        await broadcaster.source.setSettings(obsSource.id, values);
        await loadObsSource();
      });
    },
    [obsSource, loadObsSource]
  );

  const onButtonClick = useCallback(
    (name) => {
      mutex.current.runExclusive(async () => {
        if (!obsSource) return;
        await broadcaster.source.clickButton(obsSource.id, name);
        await loadObsSource();
      });
    },
    [obsSource, loadObsSource]
  );

  console.log(obsSource);

  if (!obsSource) return null;

  return (
    <Form
      ref={formRef}
      layout="vertical"
      labelAlign="left"
      initialValues={obsSource.settings}
      onValuesChange={onValuesChange}
    >
      {obsSource?.properties
        .filter(
          (item) =>
            (advancedMode || allowedSettingsId.includes(item.name)) &&
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
                  onClick={() => onButtonClick(item.name)}
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
