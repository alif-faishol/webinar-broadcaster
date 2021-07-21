import electron from 'electron';
import { TypedIpcMain, TypedIpcRenderer } from 'electron-typed-ipc';
import type { BroadcasterServiceState } from '../broadcaster';

type Events = {
  BROADCASTER_SUBSCRIBE_STATE: () => void;
  BROADCASTER_UNSUBSCRIBE_STATE: () => void;
  BROADCASTER_STATE_UPDATED: (state: BroadcasterServiceState) => void;
};

// eslint-disable-next-line @typescript-eslint/ban-types
type Commands = {};

export const typedIpcMain = electron.ipcMain as TypedIpcMain<Events, Commands>;
export const typedIpcRenderer = electron.ipcRenderer as TypedIpcRenderer<
  Events,
  Commands
>;
