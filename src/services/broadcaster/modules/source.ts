import * as osn from 'obs-studio-node';
import { v4 as uuid } from 'uuid';
import BroadcasterServiceModule from './BroadcasterServiceModule';
import { SerializableSource } from '../types';

class SourceModule extends BroadcasterServiceModule {
  async getTypes() {
    try {
      const inputTypes = osn.InputFactory.types();
      return inputTypes;
    } catch (err) {
      throw Error(err.message);
    }
  }

  async create(type: string) {
    try {
      const source = osn.InputFactory.create(type, uuid());
      return SourceModule.serializeSource(source);
    } catch (err) {
      throw Error(err.message);
    }
  }

  async setSettings(sourceId: string, settings: osn.ISettings) {
    try {
      const source = osn.InputFactory.fromName(sourceId);
      source.update(settings);
    } catch (err) {
      throw Error(err.message);
    }
  }

  async get(sourceId: string) {
    try {
      const source = osn.InputFactory.fromName(sourceId);
      return SourceModule.serializeSource(source);
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
      properties: this.serializeSourceProperties(source.properties),
    };
  }

  static serializeSourceProperties(
    osnProperties: osn.IProperties
  ): Array<Omit<osn.IProperty, 'next' | 'modified'>> {
    const properties = [];
    let iterableProperties = osnProperties.first();
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
    return properties;
  }

  registerIpcMethods() {
    return {
      getTypes: this.getTypes.bind(this),
      create: this.create.bind(this),
      setSettings: this.setSettings.bind(this),
      get: this.get.bind(this),
    };
  }
}

export default SourceModule;
