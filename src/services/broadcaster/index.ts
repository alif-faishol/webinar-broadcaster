import { v4 as uuid } from 'uuid';
import * as osn from 'obs-studio-node';
import electron from 'electron';
import { BehaviorSubject, Subscription } from 'rxjs';
import path from 'path';
import { Scene } from './types';
import SceneModule from './modules/scene';
import DisplayModule from './modules/display';
import { typedIpcMain } from '../ipc';

export type BroadcasterServiceState = {
  scenes: Scene[];
  activeScene?: Scene;
};

class BroadcasterService {
  private static instance?: BroadcasterService;

  private stateSubscriptions: Map<
    number,
    { count: number; subsription: Subscription }
  > = new Map();

  private observableState = new BehaviorSubject<BroadcasterServiceState>({
    scenes: [],
  });

  scene: SceneModule;

  display: DisplayModule;

  private constructor(windowHandle: Buffer) {
    if (process.type !== 'browser')
      throw Error('Not in electron main process!');
    const initResult = this.initObs();
    if (initResult !== 0) throw Error('Failed to initialize OBS!');

    this.initStateSubscriptions();

    this.scene = new SceneModule(this.observableState);
    this.display = new DisplayModule(windowHandle);
  }

  static getInstance() {
    if (!this.instance) throw Error('Not initialized!');
    return this.instance;
  }

  static init(windowHandle: Buffer) {
    if (this.instance) return;
    this.instance = new BroadcasterService(windowHandle);
  }

  static getRendererHandler() {
    if (process.type !== 'renderer') throw Error('Not in renderer!');
    if (!this.instance) throw Error('Not initialized!');
    return {
      scene: this.instance.scene.getIpcMethods(),
    };
  }

  private initStateSubscriptions() {
    typedIpcMain.on('BROADCASTER_SUBSCRIBE_STATE', (event) => {
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
    typedIpcMain.on('BROADCASTER_UNSUBSCRIBE_STATE', (event) => {
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
