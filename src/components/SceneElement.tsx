import React, { forwardRef, HTMLAttributes, Ref } from 'react';
import { XIcon, SwitchVerticalIcon } from '@heroicons/react/solid';

type SceneElementProps<
  P = {
    name: string;
  }
> = Omit<HTMLAttributes<HTMLDivElement>, keyof P> & P;

const SceneElement = (
  { name, className }: SceneElementProps,
  ref: Ref<HTMLDivElement>
) => {
  return (
    <div
      ref={ref}
      className={['border border-cool-gray-900', className].join(' ')}
    >
      <div className="flex">
        <div className="bg-cool-gray-900 text-white px-2 text-center flex items-center">
          <SwitchVerticalIcon className="align-middle w-6 h-6" />
        </div>
        <h4
          className="flex-1 px-2 py-1 bg-cool-gray-900 text-white font-semibold truncate"
          title={name}
        >
          {name}
        </h4>
        <button type="button" className="bg-red-800 text-white w-10 px-3">
          <XIcon />
        </button>
      </div>
      <div className="px-2 py-1">hehe</div>
    </div>
  );
};

export default forwardRef(SceneElement);
