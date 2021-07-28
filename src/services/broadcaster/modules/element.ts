import fs from 'fs';
import util from 'util';
import path from 'path';
import electron from 'electron';
import * as yup from 'yup';
import mapValues from 'lodash/mapValues';
import BroadcasterServiceModule from './BroadcasterServiceModule';
import { CustomItemTemplate, EAlignment } from '../types';

const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);
const exists = util.promisify(fs.exists);

const MetadataSchema = yup.object().shape({
  name: yup.string().required(),
  author: yup.string().required(),
  version: yup.string().required(),
  container: yup.object().shape({
    configurable: yup.bool(),
    width: yup.number().required(),
    height: yup.number().required(),
  }),
  defaultAlignment: yup.string().oneOf(Object.keys(EAlignment)),
  variables: yup.lazy((obj) =>
    yup.object(
      mapValues(obj, () =>
        yup.object({
          type: yup.string().required(),
          visibility: yup.string().required(),
          label: yup.string().required(),
        })
      )
    )
  ),
});

class ElementModule extends BroadcasterServiceModule {
  private templates: CustomItemTemplate[] = [];

  constructor() {
    super();
    if (process.type === 'browser') this.loadTemplates();
  }

  async getTemplates() {
    return this.templates;
  }

  async loadTemplates() {
    const ELEMENTS_PATH = electron.app.isPackaged
      ? path.join(process.resourcesPath, 'assets/elements')
      : path.join(__dirname, '../../../../assets/elements');

    const elementFolders = (
      await readdir(ELEMENTS_PATH, {
        withFileTypes: true,
      })
    )
      .filter((file) => file.isDirectory())
      .map((file) => file.name);

    const templates: CustomItemTemplate[] = [];
    const errors: Error[] = [];
    await Promise.all(
      elementFolders.map(async (folder) => {
        try {
          const metadata = JSON.parse(
            await readFile(
              path.join(ELEMENTS_PATH, folder, 'metadata.json'),
              'utf-8'
            )
          );
          await MetadataSchema.validate(metadata);
          const template = await readFile(
            path.join(ELEMENTS_PATH, folder, 'template.jsx'),
            'utf-8'
          );
          const cssPath = path.join(ELEMENTS_PATH, folder, 'style.css');
          const thumbnailPath = path.join(
            ELEMENTS_PATH,
            folder,
            'thumbnail.png'
          );
          templates.push({
            ...metadata,
            type: 'browser-rendered',
            template,
            css: (await exists(cssPath))
              ? `/assets/elements/${folder}/style.css`
              : undefined,
            thumbnail: (await exists(thumbnailPath))
              ? `/assets/elements/${folder}/thumbnail.png`
              : undefined,
          });
        } catch (err) {
          errors.push(err);
        }
      })
    );
    this.templates = templates;
    return { templates, errors };
  }

  registerIpcMethods() {
    return {
      getTemplates: this.getTemplates.bind(this),
      loadTemplates: this.loadTemplates.bind(this),
    };
  }
}

export default ElementModule;
