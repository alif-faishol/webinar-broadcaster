import { IpcMainInvokeEvent } from 'electron/main';
import * as osn from 'obs-studio-node';
import { v4 as uuid } from 'uuid';
import { SerializableSource } from './types';
import { callableFromRenderer, serializeProperties } from './utils';

class SourceService {
  event?: IpcMainInvokeEvent;

  @callableFromRenderer
  async getTypes() {
    try {
      const inputTypes = osn.InputFactory.types();
      return inputTypes;
    } catch (err) {
      throw Error(err.message);
    }
  }

  @callableFromRenderer
  async create(type: string) {
    try {
      const source = osn.InputFactory.create(type, uuid());
      return SourceService.serializeSource(source);
    } catch (err) {
      throw Error(err.message);
    }
  }

  @callableFromRenderer
  async setSettings(sourceId: string, settings: osn.ISettings) {
    try {
      const source = osn.InputFactory.fromName(sourceId);
      source.update(settings);
    } catch (err) {
      throw Error(err.message);
    }
  }

  @callableFromRenderer
  async get(sourceId: string) {
    try {
      const source = osn.InputFactory.fromName(sourceId);
      return SourceService.serializeSource(source);
    } catch (err) {
      throw Error(err.message);
    }
  }

  static serializeSource(source: osn.IInput): SerializableSource {
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
      properties: serializeProperties(source.properties),
    };
  }
}

export default SourceService;
