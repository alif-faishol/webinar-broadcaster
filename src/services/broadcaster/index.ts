import { v4 as uuid } from 'uuid';
import * as osn from 'obs-studio-node';
import electron from 'electron';
import { BehaviorSubject, Subscription } from 'rxjs';
import path from 'path';
import { Scene } from './types';
import SceneModule from './modules/scene';
import DisplayModule from './modules/display';
import SourceModule from './modules/source';
import ElementModule from './modules/element';
import { processTypeIs } from './utils/decorator';

export type BroadcasterServiceState = {
  scenes: Scene[];
  activeScene?: Scene;
  elementRendererPort?: number;
};

class BroadcasterService {
  private static instance?: BroadcasterService;

  private stateSubscriptions: Map<
    number,
    { count: number; subsription: Subscription }
  > = new Map();

  observableState = new BehaviorSubject<BroadcasterServiceState>({
    scenes: [],
  });

  source: SourceModule;

  scene: SceneModule;

  display: DisplayModule;

  element: ElementModule;

  private constructor(windows: DisplayModule['windows']) {
    const initResult = this.initObs();
    if (initResult !== 0) throw Error('Failed to initialize OBS!');

    this.initStateSubscriptionHandler();

    /**
     * Modules initialization
     */
    this.source = new SourceModule(this.observableState);
    this.scene = new SceneModule(this.observableState, this.source);
    this.display = new DisplayModule(windows);
    this.element = new ElementModule();
  }

  static getInstance() {
    if (!this.instance) throw Error('Not initialized!!');
    return this.instance;
  }

  static init(windows: DisplayModule['windows']) {
    if (this.instance) return;
    this.instance = new BroadcasterService(windows);
  }

  @processTypeIs('renderer')
  static getIpcRendererClient() {
    return {
      /**
       * Register modules' IPC Methods
       */
      source: new SourceModule().getIpcRendererMethods(),
      scene: new SceneModule().getIpcRendererMethods(),
      display: new DisplayModule().getIpcRendererMethods(),
      element: new ElementModule().getIpcRendererMethods(),

      subscribe: (cb: (state: BroadcasterServiceState) => void) => {
        electron.ipcRenderer.send('BROADCASTER_SUBSCRIBE_STATE');
        const listener = (
          _event: electron.IpcRendererEvent,
          ...args: [BroadcasterServiceState]
        ) => {
          cb(args[0]);
        };
        electron.ipcRenderer.on('BROADCASTER_STATE_UPDATED', listener);
        return () => {
          electron.ipcRenderer.send('BROADCASTER_UNSUBSCRIBE_STATE');
          electron.ipcRenderer.off('BROADCASTER_STATE_UPDATED', listener);
        };
      },
    };
  }

  private initStateSubscriptionHandler() {
    electron.ipcMain.on('BROADCASTER_SUBSCRIBE_STATE', (event) => {
      const existingSubscriber = this.stateSubscriptions.get(event.frameId);
      if (existingSubscriber) {
        this.stateSubscriptions.set(event.frameId, {
          ...existingSubscriber,
          count: existingSubscriber.count + 1,
        });
      } else {
        this.stateSubscriptions.set(event.frameId, {
          count: 1,
          subsription: this.observableState.subscribe((state) => {
            event.reply('BROADCASTER_STATE_UPDATED', state);
          }),
        });
      }
    });
    electron.ipcMain.on('BROADCASTER_UNSUBSCRIBE_STATE', (event) => {
      const existingSubscriber = this.stateSubscriptions.get(event.frameId);
      if (!existingSubscriber) return;
      if (existingSubscriber.count > 1) {
        this.stateSubscriptions.set(event.frameId, {
          ...existingSubscriber,
          count: existingSubscriber.count - 1,
        });
      } else {
        this.stateSubscriptions.delete(event.frameId);
      }
    });
  }

  private initObs() {
    const RESOURCES_PATH = electron.app.isPackaged
      ? path.join(process.resourcesPath, 'assets')
      : path.join(__dirname, '../../../assets');

    osn.NodeObs.IPC.host(`webinar-broadcaster-${uuid()}`);
    osn.NodeObs.SetWorkingDirectory(
      path.join(
        electron.app.getAppPath().replace('app.asar', 'app.asar.unpacked'),
        'node_modules',
        'obs-studio-node'
      )
    );
    const obsDataPath = path.join(RESOURCES_PATH, 'osn-data'); // OBS Studio configs and logs
    const initResult = osn.NodeObs.OBS_API_initAPI('en', obsDataPath, '1.0.0');

    return initResult;
  }

  static shutdown() {
    try {
      osn.NodeObs.OBS_service_removeCallback();
      osn.NodeObs.IPC.disconnect();
      delete this.instance;
    } catch (err) {
      throw Error(err.message);
    }
  }
}

export default BroadcasterService;
