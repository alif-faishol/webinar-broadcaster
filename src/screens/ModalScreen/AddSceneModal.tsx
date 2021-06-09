import React, { FC, useState } from 'react';

type AddSceneModalProps = {
  onSubmit: (value: string) => void;
};

const AddSceneModal: FC<AddSceneModalProps> = ({ onSubmit }) => {
  const [value, setValue] = useState('');

  return (
    <div className="w-full max-w-xs p-4">
      <input
        type="text"
        value={value}
        className="w-full"
        onChange={({ target: { value: newValue } }) => setValue(newValue)}
      />
      <button
        type="button"
        className="h-8 w-full mt-4 bg-cool-gray-900 text-white text-sm font-semibold"
        onClick={() => onSubmit(value)}
      >
        SUBMIT
      </button>
    </div>
  );
};

export default AddSceneModal;
