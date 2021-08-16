import { Form, Checkbox, Input } from 'antd';
import React, { FC } from 'react';
import BroadcasterService from '../../services/broadcaster';
import { CustomItem } from '../../services/broadcaster/types';

type CustomElementSettingsFormProps = {
  advancedMode?: boolean;
  item: CustomItem;
  onVariableChange?: (variables: CustomItem['variables']) => void;
};

const broadcaster = BroadcasterService.getIpcRendererClient();

const CustomElementSettingsForm: FC<CustomElementSettingsFormProps> = ({
  advancedMode,
  item,
  onVariableChange,
}) => {
  if (!item.variables) return null;
  return (
    <Form
      layout="vertical"
      labelAlign="left"
      initialValues={Object.entries(item.variables).reduce(
        (obj, [name, def]) => ({ ...obj, [name]: def.value }),
        {}
      )}
      onValuesChange={(values) => {
        Object.entries(values).forEach(([name, value]) => {
          if (!item.variables) return;
          item.variables[name].value =
            value as typeof item.variables[0]['value'];
        });
        if (onVariableChange) {
          onVariableChange(item.variables);
        } else {
          broadcaster.scene.setCustomItemVariables(item.id, item.variables);
        }
      }}
    >
      {Object.entries(item.variables)
        .filter(([, def]) => advancedMode || def.visibility === 'normal')
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
  );
};

export default CustomElementSettingsForm;
