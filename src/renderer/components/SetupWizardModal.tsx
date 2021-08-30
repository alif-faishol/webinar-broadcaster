import { ModalProps, Modal, Steps, Divider, Typography, Button } from 'antd';
import React, { FC, useEffect, useState } from 'react';

const SetupWizardModal: FC<ModalProps & { onCancel: () => void }> = ({
  onCancel,
  visible,
  ...props
}) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!visible) setStep(0);
  }, [visible]);

  return (
    <Modal
      width={720}
      title="Setup Wizard"
      footer={null}
      onCancel={onCancel}
      visible={visible}
      destroyOnClose
      {...props}
    >
      <Steps current={step} progressDot>
        <Steps.Step title="Create a Scene" />
        <Steps.Step title="Add Elements" />
        <Steps.Step title="Setup YouTube" />
        <Steps.Step title="Start Broadcasting!" />
      </Steps>
      <Divider />
      {step === 0 && (
        <>
          <Typography.Paragraph>
            When talking about scene, you can imagine it as a Slide in
            PowerPoint. You can arrange elements inside it and switch between
            scenes. For example, we can have a scene with static image to be
            displayed before the webinar starts, a scene which contains speakers
            and their names in a lower third, and another scene which displays a
            Word document.
          </Typography.Paragraph>
          <Typography.Paragraph>Lets create a new scene!</Typography.Paragraph>
          <Button type="primary">Create Scene</Button>
        </>
      )}
    </Modal>
  );
};

export default SetupWizardModal;
