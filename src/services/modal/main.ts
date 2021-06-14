import { app, BrowserWindow, ipcMain } from 'electron';

const registerModalHandler = (parentWindow: BrowserWindow) => {
  const modalWindow = new BrowserWindow({
    show: true,
    parent: parentWindow,
    frame: false,
    resizable: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  modalWindow.loadURL(`file://${app.getAppPath()}/index.html#/modal`);
  modalWindow.setIgnoreMouseEvents(true);

  ipcMain.handle('modal-open', (_event, args) => {
    modalWindow.setIgnoreMouseEvents(false);
    modalWindow.webContents.send('modal-open', args);
  });

  ipcMain.handle('modal-close', (_event, args) => {
    modalWindow.setIgnoreMouseEvents(true);
    parentWindow.webContents.send('modal-close', args);
  });

  parentWindow.on('move', () => {
    modalWindow.setBounds(parentWindow.getContentBounds());
  });

  parentWindow.on('resize', () => {
    modalWindow.setBounds(parentWindow.getContentBounds());
  });
};

export default registerModalHandler;
