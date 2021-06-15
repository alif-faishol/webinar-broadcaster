import { app, BrowserWindow, ipcMain } from 'electron';

const registerModalHandler = (parentWindow: BrowserWindow) => {
  // const modalWindow = new BrowserWindow({
  //   show: true,
  //   parent: parentWindow,
  //   frame: false,
  //   resizable: false,
  //   transparent: true,
  //   webPreferences: {
  //     nodeIntegration: true,
  //     contextIsolation: false,
  //   },
  // });

  // modalWindow.loadURL(`file://${app.getAppPath()}/index.html#/modal`);
  // modalWindow.setIgnoreMouseEvents(true);

  ipcMain.handle('modal-open', (_event, args) => {
    parentWindow.webContents.send('modal-open', args);
  });

  ipcMain.handle('modal-close', (_event, args) => {
    parentWindow.webContents.send('modal-close', args);
  });
};

export default registerModalHandler;
