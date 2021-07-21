import * as osn from 'obs-studio-node';

interface ISettingParam {
  name: string;
  currentValue: string;
}

interface ISubCategorySetting {
  nameSubCategory: string;
  parameters: ISettingParam;
}

export const setSetting = (
  category: string,
  subCategory: string,
  parameter: string,
  value: string
) => {
  const categorySettings = osn.NodeObs.OBS_settings_getSettings(category).data;

  const subCategorySettings = categorySettings.find(
    (subCategorySetting: ISubCategorySetting) =>
      subCategorySetting.nameSubCategory === subCategory
  );
  if (!subCategorySettings) throw Error('Sub Category not found!');

  const setting = subCategorySettings.parameters.find(
    (param: ISettingParam) => param.name === parameter
  );
  if (!setting) throw Error('Setting with specified param not found!');

  setting.currentValue = value;

  osn.NodeObs.OBS_settings_saveSettings(category, categorySettings);
};

export default {
  setSetting,
};
