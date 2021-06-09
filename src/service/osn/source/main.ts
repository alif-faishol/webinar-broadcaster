import { ipcMain, IpcMainInvokeEvent } from 'electron';
import * as osn from 'obs-studio-node';
import { v4 as uuid } from 'uuid';
import { initialized } from '../general/main';

declare module 'obs-studio-node' {
  interface IProperty {
    details: any;
  }
}

export type SerializableSource = {
  id: osn.IInput['name'];
  settings: osn.IInput['settings'];
  width: osn.IInput['width'];
  height: osn.IInput['height'];
  muted: osn.IInput['muted'];
  monitoringType: osn.IInput['monitoringType'];
  flags: osn.IInput['flags'];
  outputFlags: osn.IInput['outputFlags'];
  showing: osn.IInput['showing'];
  status: osn.IInput['status'];
  syncOffset: osn.IInput['syncOffset'];
  type: osn.IInput['type'];
  volume: osn.IInput['volume'];
  properties: Array<Omit<osn.IProperty, 'next' | 'modified'>>;
};

export const serializeSource = (source: osn.IInput): SerializableSource => {
  const properties = [];
  let iterableProperties = source.properties.first();
  while (iterableProperties) {
    properties.push({
      name: iterableProperties.name,
      description: iterableProperties.description,
      enabled: iterableProperties.enabled,
      longDescription: iterableProperties.longDescription,
      status: iterableProperties.status,
      type: iterableProperties.type,
      value: iterableProperties.value,
      visible: iterableProperties.visible,
      details:
        'format' in iterableProperties.details
          ? iterableProperties.details
          : undefined,
    });
    iterableProperties = iterableProperties.next();
  }

  return {
    id: source.name,
    settings: source.settings,
    width: source.width,
    height: source.height,
    muted: source.muted,
    monitoringType: source.monitoringType,
    flags: source.flags,
    outputFlags: source.outputFlags,
    showing: source.showing,
    status: source.status,
    syncOffset: source.syncOffset,
    type: source.type,
    volume: source.volume,
    properties,
  };
};

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

export type CreateSourceArgs = { type: string };

const createSource = (
  _event: IpcMainInvokeEvent,
  { type }: CreateSourceArgs
): SerializableSource => {
  try {
    const source = osn.InputFactory.create(type, uuid());
    return serializeSource(source);
  } catch (err) {
    throw Error(err.message);
  }
};

export type SetSourceSettingsArgs = {
  sourceId: string;
  settings: osn.ISettings;
};

const setSourceSettings = (
  _event: IpcMainInvokeEvent,
  { sourceId, settings }: SetSourceSettingsArgs
) => {
  try {
    const source = osn.InputFactory.fromName(sourceId);
    source.update(settings);
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

export type GetSourceProperties = {
  sourceId: string;
};

const getSourceProperties = (
  _event: IpcMainInvokeEvent,
  { sourceId }: GetSourceProperties
) => {
  try {
    const source = osn.InputFactory.fromName(sourceId);
    return properties;
  } catch (err) {
    throw Error(err.message);
  }
};

ipcMain.handle('osn-source-get-types', getTypes);
ipcMain.handle('osn-source-create', createSource);
ipcMain.handle('osn-source-set-settings', setSourceSettings);
ipcMain.handle('osn-source-get-display-list', getDisplayList);
ipcMain.handle('osn-source-get-camera-list', getCameraList);
ipcMain.handle('osn-source-create-display-source', createDisplaySource);
ipcMain.handle('osn-source-get-properties', getSourceProperties);
