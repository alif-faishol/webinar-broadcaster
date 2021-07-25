import React, { FC, useEffect, useState } from 'react';
import {
  CustomItemTemplate,
  OBSItemTemplate,
} from '../../../services/broadcaster/types';
import BroadcasterService from '../../../services/broadcaster';

type AddSourceModalProps = {
  onSubmit: () => void;
};

const OBS_TEMPLATES: OBSItemTemplate[] = [
  {
    type: 'obs-source',
    obsSourceType: 'monitor_capture',
    name: 'Desktop Capture',
  },
  {
    type: 'obs-source',
    obsSourceType: 'browser_source',
    name: 'Website /URL',
  },
  {
    type: 'obs-source',
    obsSourceType: 'dshow_input',
    name: 'Webcam',
  },
];

const broadcaster = BroadcasterService.getIpcRendererClient();

const AddSourceModal: FC<AddSourceModalProps> = ({ onSubmit }) => {
  const [templates, setTemplates] =
    useState<Array<CustomItemTemplate | OBSItemTemplate>>(OBS_TEMPLATES);
  const [selectedTemplateIdx, setSelectedTemplateIdx] = useState<number>(0);
  const [name, setName] = useState('');
  const selectedTemplate = templates[selectedTemplateIdx];

  useEffect(() => {
    broadcaster.element
      .loadTemplates()
      .then((result) => setTemplates((ps) => [...ps, ...result.templates]))
      .catch(() => {});
  }, []);

  return (
    <div className="w-full max-w-lg p-4">
      <label htmlFor="source-type">
        Source Type
        <select
          id="source-type"
          className="w-full mb-4"
          value={selectedTemplateIdx}
          onChange={({ target: { value } }) => {
            setSelectedTemplateIdx(parseInt(value, 10) || 0);
          }}
        >
          {templates.map((template, idx) => (
            // eslint-disable-next-line react/no-array-index-key
            <option key={idx} value={idx}>
              {template.name}
            </option>
          ))}
        </select>
      </label>
      <label htmlFor="name">
        Name
        <input
          id="name"
          className="w-full mb-4"
          type="text"
          value={name}
          placeholder={selectedTemplate?.name || '-'}
          onChange={({ target: { value } }) => setName(value)}
        />
      </label>
      <button
        type="button"
        className="h-8 w-full bg-cool-gray-900 text-white text-sm font-semibold"
        onClick={async () => {
          if (!selectedTemplate) return;
          await broadcaster.scene.addItem({
            ...selectedTemplate,
            name: name || selectedTemplate.name,
          });
          onSubmit();
        }}
      >
        SUBMIT
      </button>
    </div>
  );
};

export default AddSourceModal;
