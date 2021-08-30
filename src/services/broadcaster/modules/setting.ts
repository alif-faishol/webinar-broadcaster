import * as osn from 'obs-studio-node';
import BroadcasterServiceModule from './BroadcasterServiceModule';

export interface ISettingParam {
  name: string;
  currentValue: string | number | boolean;
  values: Array<{ [key: string]: string }>;
}

export interface ISubCategorySetting {
  nameSubCategory: string;
  parameters: ISettingParam[];
}

class SettingModule extends BroadcasterServiceModule {
  constructor() {
    super();
    if (process.type === 'browser') {
      this.setObsSetting('Video', 'Base', '1920x1080');
      this.setObsSetting('Video', 'Output', '1280x720');
      this.setObsSetting('Video', 'FPSType', 'Common FPS Values');
      this.setObsSetting('Video', 'FPSCommon', '30');
      this.setObsSetting('Stream', 'service', 'YouTube - RTMPS');
      this.setObsSetting('Output', 'Mode', 'Simple');
      this.setObsSetting('Output', 'UseAdvanced', false);
      this.setObsSetting('Output', 'ABitrate', 160);
    }
  }

  async getObsSettings(): Promise<string[]>;
  async getObsSettings(category: string): Promise<ISettingParam[]>;
  async getObsSettings(category: string, parameter: string): Promise<string>;
  async getObsSettings(category?: string, parameter?: string) {
    if (!category) return osn.NodeObs.OBS_settings_getListCategories();
    const settings = osn.NodeObs.OBS_settings_getSettings(category).data;
    if (!parameter)
      return settings
        .map((item: ISubCategorySetting) => item.parameters)
        .flat(1);
    let value;
    settings.find((subCategory: ISubCategorySetting) => {
      return subCategory.parameters.find((param) => {
        if (param.name === parameter) {
          value = param.currentValue;
          return true;
        }
        return false;
      });
    });
    return value;
  }

  async setObsSetting(
    category: string,
    parameter: string,
    value: string | number | boolean
  ) {
    const settings = osn.NodeObs.OBS_settings_getSettings(category).data;

    settings.forEach((subCategory: ISubCategorySetting) => {
      subCategory.parameters.forEach((param) => {
        if (param.name === parameter) {
          param.currentValue = value;
        }
      });
    });

    osn.NodeObs.OBS_settings_saveSettings(category, settings);
  }

  registerIpcMethods() {
    return {
      getObsSettings: this.getObsSettings.bind(this),
      setObsSetting: this.setObsSetting.bind(this),
    };
  }
}

export default SettingModule;
