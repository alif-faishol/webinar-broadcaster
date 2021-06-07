import path from 'path';
import { app, ipcMain } from 'electron';

import * as osn from 'obs-studio-node';

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../../assets');

// class OSN {
//   constructor() {
//     console.log('initializing obs...');
//     osn.NodeObs.OBS_service_connectOutputSignals((signalInfo) => {
//       console.log('OBS OUTPUT SIGNAL', signalInfo);
//     });
//
//     console.debug('OBS initialized');
//     console.log(RESOURCES_PATH);
//     const settings = osn.NodeObs.OBS_settings_getSettings('Output').data;
//     console.log(JSON.stringify(settings, null, 2));
//   }
// }

declare module 'obs-studio-node' {
  interface IProperty {
    details?: any;
  }
}

const registerEvents = (): void => {
  ipcMain.handle('osn-init', () => {
    if (!osn.Global.initialized) {
      osn.NodeObs.IPC.host(`webinar-broadcaster-${Math.random()}`);
      osn.NodeObs.SetWorkingDirectory(
        path.join(__dirname, '../../../node_modules', 'obs-studio-node')
      );
      const obsDataPath = path.join(RESOURCES_PATH, 'osn-data'); // OBS Studio configs and logs
      const initResult = osn.NodeObs.OBS_API_initAPI(
        'en',
        obsDataPath,
        '1.0.0'
      );

      if (initResult !== 0) throw Error('OBS Initialization failed');
    }

    const inputTypes = osn.InputFactory.types();

    return [inputTypes];
  });

  ipcMain.handle('osn-get-camera-input', () => {
    try {
      if (!osn.Global.initialized) throw Error('Not initialized!');

      const dummyCameraInput = osn.InputFactory.create(
        'dshow_input',
        'dummy-camera'
      );

      const availableCameras = dummyCameraInput.properties.get(
        'video_device_id'
      ).details.items;

      return availableCameras;
    } catch (err) {
      throw Error(err.message);
    }
  });

  ipcMain.handle('osn-get-display-input', () => {
    try {
      if (!osn.Global.initialized) throw Error('Not initialized!');

      const dummyDisplayInput = osn.InputFactory.create(
        'monitor_capture',
        'dummy-display'
      );

      const availableDisplays = dummyDisplayInput.properties.get('monitor')
        .details.items;

      dummyDisplayInput.remove();

      return availableDisplays;
    } catch (err) {
      throw Error(err.message);
    }
  });

  ipcMain.handle('osn-create-scene', (_event, sceneName) => {
    try {
      if (!osn.Global.initialized) throw Error('Not initialized!');

      const scene = osn.SceneFactory.create(sceneName);

      return scene.name;
    } catch (err) {
      throw Error(err.message);
    }
  });

  ipcMain.handle('osn-attach-display-input-to-scene', (_event, displayId) => {
    try {
      if (!osn.Global.initialized) throw Error('Not initialized!');

    } catch (err) {
      throw Error(err.message);
    }
  });
};

export default {
  registerEvents,
};
