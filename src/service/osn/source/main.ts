import { ipcMain, IpcMainInvokeEvent } from 'electron';
import * as osn from 'obs-studio-node';
import { v4 as uuid } from 'uuid';
import { initialized } from '../general/main';

const getTypes = () => {
  try {
    if (!initialized.getValue()) throw Error('Not initialized!');

    const inputTypes = osn.InputFactory.types();
    return inputTypes;
  } catch (err) {
    throw Error(err.message);
  }
};

const getDisplayList = () => {
  try {
    if (!initialized.getValue()) throw Error('Not initialized!');

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
};

const getCameraList = () => {
  try {
    if (!initialized.getValue()) throw Error('Not initialized!');

    const dummyCameraInput = osn.InputFactory.create(
      'dshow_input',
      'dummy-camera'
    );

    const availableCameras = dummyCameraInput.properties.get('video_device_id')
      .details.items;

    return availableCameras;
  } catch (err) {
    throw Error(err.message);
  }
};

// TODO
const getAudioInputLIst = () => {
  try {
    if (!initialized.getValue()) throw Error('Not initialized!');
  } catch (err) {
    throw Error(err.message);
  }
};

export type CreateDisplaySourceArgs = {
  displayId?: string;
};

const createDisplaySource = async (
  _event: IpcMainInvokeEvent,
  { displayId }: CreateDisplaySourceArgs
) => {
  try {
    if (!initialized.getValue()) throw Error('Not initialized!');

    const source = osn.InputFactory.create(
      'monitor_capture',
      uuid(),
      displayId ? { monitor: displayId } : undefined
    );
    return source.name;
  } catch (err) {
    throw Error(err.message);
  }
};

ipcMain.handle('osn-source-get-types', getTypes);
ipcMain.handle('osn-source-get-display-list', getDisplayList);
ipcMain.handle('osn-source-get-camera-list', getCameraList);
ipcMain.handle('osn-source-create-display-source', createDisplaySource);
