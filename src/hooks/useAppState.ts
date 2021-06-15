import { ipcRenderer, IpcRendererEvent } from 'electron';
import { useEffect, useState } from 'react';
import { AppState } from '../services/app/types';

const useAppState = (): AppState => {
  const [state, setState] = useState<AppState>({ scenes: [] });

  useEffect(() => {
    const onAppStateUpdated = (_event: IpcRendererEvent, newState: unknown) => {
      setState(newState as AppState);
    };
    ipcRenderer.on('app-state-updated', onAppStateUpdated);
    ipcRenderer.send('subscribe-app-state');
    return () => {
      ipcRenderer.removeListener('app-state-updated', onAppStateUpdated);
      ipcRenderer.send('unusbscribe-app-state');
    };
  }, []);

  return state;
};

export default useAppState;
