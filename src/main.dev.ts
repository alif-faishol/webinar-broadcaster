/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./src/main.prod.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import installExtensions, {
  REACT_DEVELOPER_TOOLS,
} from 'electron-devtools-installer';
import MenuBuilder from './menu';
import registerModalHandler from './services/modal/main';
import AppService from './services/app/AppService';
import ElementRendererService from './services/element-renderer/ElementRendererService';
import ElementService from './services/element/ElementService';
import { setState } from './services/app/AppState';

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const createWindow = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions([REACT_DEVELOPER_TOOLS], {
      forceDownload: true,
    }).catch((err) => console.log(err));
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    icon: getAssetPath('icon.png'),
    minWidth: 1024,
    minHeight: 600,
    frame: false,
    movable: false,
    resizable: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const frontendWindow = new BrowserWindow({
    show: false,
    parent: mainWindow,
    minWidth: 1024,
    minHeight: 600,
    transparent: true,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });
  frontendWindow.on('hide', () => {
    if (!mainWindow) return;
    mainWindow.hide();
    mainWindow.setBounds(frontendWindow.getContentBounds());
  });
  frontendWindow.on('show', () => {
    if (!mainWindow) return;
    mainWindow.show();
    mainWindow.setBounds(frontendWindow.getContentBounds());
  });
  frontendWindow.on('move', () => {
    if (!mainWindow) return;
    mainWindow.setBounds(frontendWindow.getContentBounds());
  });
  frontendWindow.on('resize', () => {
    if (!mainWindow) return;
    mainWindow.setBounds(frontendWindow.getContentBounds());
  });
  ipcMain.on('toggle-maximize', (event) => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
      frontendWindow.unmaximize();
      frontendWindow.setBounds(mainWindow.getContentBounds());
    } else {
      frontendWindow.maximize();
      mainWindow.setBounds(frontendWindow.getContentBounds());
      mainWindow.maximize();
    }
    event.reply('maximized-change', mainWindow.isMaximized());
  });
  ipcMain.on('minimize', () => {
    if (!mainWindow) return;
    mainWindow.minimize();
    mainWindow.setBounds(frontendWindow.getContentBounds());
  });
  ipcMain.on('close', () => {
    if (!mainWindow) return;
    mainWindow.close();
  });
  mainWindow.on('restore', () => {
    if (!mainWindow) return;
    frontendWindow.focus();
    mainWindow.setBounds(frontendWindow.getContentBounds());
  });
  registerModalHandler(frontendWindow);

  AppService.init();
  await ElementRendererService.init();
  ElementService.getInstance();
  setState((ps) => ({
    ...ps,
    windowHandle: mainWindow?.getNativeWindowHandle(),
  }));

  frontendWindow.loadURL(`file://${__dirname}/index.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  frontendWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      frontendWindow.show();
      frontendWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(frontendWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  AppService.shutdown();
});

app.whenReady().then(createWindow).catch(console.log);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});
