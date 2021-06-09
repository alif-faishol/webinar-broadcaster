import { app, BrowserWindow, ipcMain } from 'electron';

const registerModalHandler = (parentWindow: BrowserWindow) => {
  const modalWindow = new BrowserWindow({
    show: false,
    parent: parentWindow,
    webPreferences: {
      nodeIntegration: true,
    },
    frame: false,
    resizable: false,
    transparent: true,
  });

  modalWindow.loadURL(`file://${app.getAppPath()}/index.html#/modal`);

  ipcMain.handle('modal-open', (_event, args) => {
    modalWindow.show();
    modalWindow.webContents.send('modal-open', args);
  });

  ipcMain.handle('modal-close', (_event, args) => {
    modalWindow.hide();
    parentWindow.webContents.send('modal-close', args);
  });

  parentWindow.on('move', () => {
    const { x, y } = parentWindow.getContentBounds();
    modalWindow.setPosition(x, y);
  });

  parentWindow.on('resize', () => {
    const { width, height } = parentWindow.getContentBounds();
    modalWindow.setSize(width, height);
  });
};

export default registerModalHandler;
