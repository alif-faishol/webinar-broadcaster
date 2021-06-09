import React, { FC, useState } from 'react';
import AppService from '../../service/app/AppService';

type AddSourceModalProps = {
  onSubmit: () => void;
};

const optionsMap = {
  monitor_capture: 'Desktop Capture',
  browser_source: 'Website / URL',
  dshow_input: 'Webcam',
};

const appService = AppService.getInstance();

const AddSourceModal: FC<AddSourceModalProps> = ({ onSubmit }) => {
  const [selectedOption, setSelectedOption] = useState<keyof typeof optionsMap>(
    'monitor_capture'
  );
  const [name, setName] = useState('');

  return (
    <div className="w-full max-w-lg p-4">
      <label htmlFor="source-type">
        Source Type
        <select
          id="source-type"
          className="w-full mb-4"
          value={selectedOption}
          onChange={({ target: { value } }) => {
            setSelectedOption(value as keyof typeof optionsMap);
          }}
        >
          {Object.entries(optionsMap).map(([key, value]) => (
            <option key={key} value={key}>
              {value}
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
          placeholder={optionsMap[selectedOption]}
          onChange={({ target: { value } }) => setName(value)}
        />
      </label>
      <button
        type="button"
        className="h-8 w-full bg-cool-gray-900 text-white text-sm font-semibold"
        onClick={async () => {
          appService.scene.addItem(
            name || optionsMap[selectedOption],
            selectedOption
          );
          onSubmit();
        }}
      >
        SUBMIT
      </button>
    </div>
  );
};

export default AddSourceModal;
