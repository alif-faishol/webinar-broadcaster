import { Dialog, Transition } from '@headlessui/react';
import { ipcRenderer, IpcRendererEvent } from 'electron';
import React, { FC, Fragment, useEffect, useState } from 'react';
import { XIcon } from '@heroicons/react/solid';
import AddSceneModal from './AddSceneModal';
import AddItemModal from './AddItemModal';
import TransformItemModal from './TransformItemModal';

const Container: FC = ({ children }) => {
  return (
    <div className="min-h-screen px-4 font-sans text-center">
      <span className="inline-block h-screen align-middle" aria-hidden="true">
        &#8203;
      </span>
      <Transition.Child
        as={Fragment}
        enter="ease-out duration-200"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="ease-in duration-100"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <div className="inline-block overflow-hidden text-left align-middle bg-white transform shadow-xl relative border border-cool-gray-900">
          {children}
        </div>
      </Transition.Child>
    </div>
  );
};

const ModalScreen: FC = () => {
  const [modalState, setModalState] = useState<{
    open: boolean;
    args?: any;
    type?: string;
    argsResponse?: any;
  }>({ open: false });

  useEffect(() => {
    const onModalOpen = (_event: IpcRendererEvent, args: any) => {
      if (!args || !args?.type) return;
      setModalState({ open: true, type: args.type, args: args.args });
    };
    ipcRenderer.on('modal-open', onModalOpen);
    return () => {
      ipcRenderer.removeListener('modal-open', onModalOpen);
    };
  }, []);

  return (
    <Transition
      show={modalState.open}
      as={Fragment}
      afterLeave={() =>
        ipcRenderer.invoke('modal-close', modalState.argsResponse)
      }
    >
      <Dialog
        open={modalState.open}
        onClose={() => setModalState((ps) => ({ ...ps, open: false }))}
        as="div"
        className="fixed inset-0 z-40 overflow-auto"
        static
      >
        <Dialog.Overlay className="fixed inset-0" />
        <button
          type="button"
          className="bg-red-800 text-white w-10 px-3 h-8 absolute -top-8 right-0"
          onClick={() => setModalState((ps) => ({ ...ps, open: false }))}
        >
          <XIcon />
        </button>
        {modalState.type === 'add-scene' && (
          <Container>
            <AddSceneModal
              onSubmit={(name) => {
                setModalState((ps) => ({
                  ...ps,
                  open: false,
                  argsResponse: name,
                }));
              }}
            />
          </Container>
        )}
        {modalState.type === 'add-item' && (
          <Container>
            <AddItemModal
              onSubmit={() => {
                setModalState((ps) => ({
                  ...ps,
                  open: false,
                }));
              }}
            />
          </Container>
        )}
        {modalState.type === 'transform-item' && (
          <TransformItemModal
            item={modalState.args}
            onClose={() => {
              setModalState((ps) => ({ ...ps, open: false }));
            }}
          />
        )}
      </Dialog>
    </Transition>
  );
};

export default ModalScreen;
