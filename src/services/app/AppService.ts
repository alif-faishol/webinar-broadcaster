/* eslint-disable max-classes-per-file */
import { v4 as uuid } from 'uuid';
import * as osn from 'obs-studio-node';
import electron, { ipcMain } from 'electron';
import { Subscription } from 'rxjs';
import path from 'path';
import SourceService from './SourceService';
import SceneService from './SceneService';
import { resetState, stateSubject } from './AppState';
import DisplayService from './DisplayService';

class AppService {
  private static instance: AppService;

  private static obsInitialized = false;

  private static appStateSubscriptions: Map<number, Subscription>;

  scene: SceneService;

  source: SourceService;

  display: DisplayService;

  private constructor() {
    this.scene = new SceneService();
    this.source = new SourceService();
    this.display = new DisplayService();
  }

  static getInstance() {
    if (!this.instance) this.instance = new AppService();
    return this.instance;
  }

  private static initObs() {
    const RESOURCES_PATH = electron.app.isPackaged
      ? path.join(process.resourcesPath, 'assets')
      : path.join(__dirname, '../../../assets');

    if (!this.obsInitialized) {
      osn.NodeObs.IPC.host(`webinar-broadcaster-${uuid()}`);
      osn.NodeObs.SetWorkingDirectory(
        path.join(
          electron.app.getAppPath().replace('app.asar', 'app.asar.unpacked'),
          'node_modules',
          'obs-studio-node'
        )
      );
      const obsDataPath = path.join(RESOURCES_PATH, 'osn-data'); // OBS Studio configs and logs
      const initResult = osn.NodeObs.OBS_API_initAPI(
        'en',
        obsDataPath,
        '1.0.0'
      );

      if (initResult === 0) {
        this.obsInitialized = true;
      }

      return initResult;
    }
    return 0;
  }

  static init() {
    const initResult = this.initObs();
    if (initResult !== 0) throw Error('Failed to initialize OBS!');
    this.instance = new AppService();
    resetState();
    this.appStateSubscriptions = new Map();
    ipcMain.on('subscribe-app-state', (event) => {
      this.appStateSubscriptions.set(
        event.frameId,
        stateSubject.subscribe((state) => {
          event.reply('app-state-updated', state);
        })
      );
    });
    ipcMain.on('unsubscribe-app-state', (event) => {
      this.appStateSubscriptions.get(event.frameId)?.unsubscribe();
    });
  }

  static shutdown() {
    try {
      osn.NodeObs.OBS_service_removeCallback();
      osn.NodeObs.IPC.disconnect();
      this.obsInitialized = false;
    } catch (err) {
      throw Error(err.message);
    }
  }
}

export default AppService;
