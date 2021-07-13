import React, { FC, useEffect, useState } from 'react';
import { ipcRenderer, IpcRendererEvent } from 'electron';
import { atom, useAtom } from 'jotai';

import { AppState } from '../../services/app/types';

const appStateAtom = atom<AppState>({ scenes: [] });

export const AppStateProvider: FC = ({ children }) => {
  const [, setAppState] = useAtom(appStateAtom);

  useEffect(() => {
    const onAppStateUpdated = (_event: IpcRendererEvent, newState: unknown) => {
      setAppState(newState as AppState);
    };
    ipcRenderer.on('app-state-updated', onAppStateUpdated);
    ipcRenderer.send('subscribe-app-state');
    return () => {
      ipcRenderer.removeListener('app-state-updated', onAppStateUpdated);
      ipcRenderer.send('unusbscribe-app-state');
    };
  }, [setAppState]);

  return <>{children}</>;
};

const useAppState = (): AppState => {
  const [appState] = useAtom(appStateAtom);

  return appState;
};

export default useAppState;
