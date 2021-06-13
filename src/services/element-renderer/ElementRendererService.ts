import { Server } from 'socket.io';
import express from 'express';
import http from 'http';
import { createProxyServer } from 'http-proxy';
import detectPort from 'detect-port';
import ejs from 'ejs';
import electron from 'electron';
import path from 'path';
import * as osn from 'obs-studio-node';
import { setState, stateSubject } from '../app/AppState';
import { AppState, CustomItem, SceneItem } from '../app/types';

const REMOVE_UNUSED_RENDERER_ON_CHANGE = false;

class ElementRendererService {
  private static instance: ElementRendererService;

  private io: Server;

  private server: http.Server;

  private renderers: osn.IInput[] = [];

  private createRenderer(layer: number, port: number) {
    const osnSource = osn.InputFactory.create(
      'browser_source',
      `renderer-${layer}`,
      {
        url: `http://localhost:${port}/?layer=${layer}`,
        width: 1920,
        height: 1080,
      }
    );
    this.renderers.push(osnSource);
    return osnSource;
  }

  private shutdownRenderer(renderer: osn.IInput) {
    renderer.release();
    renderer.remove();
  }

  /**
   * Remove unused renderer based on itemsGroups requirement
   */
  private removeUnusedRenderer(itemsGroups: CustomItem[][]) {
    if (this.renderers.length > itemsGroups.length)
      this.renderers
        .slice(-(this.renderers.length - itemsGroups.length))
        .forEach((renderer, i) => {
          this.shutdownRenderer(renderer);
          this.renderers.splice(i + itemsGroups.length, 1);
        });
  }

  private handleStateChange({ activeScene, elementRendererPort }: AppState) {
    const itemsGroups: CustomItem[][] = [];

    if (!activeScene || elementRendererPort === undefined) {
      this.io.emit('items-updated', itemsGroups);
      return;
    }

    /**
     * Groups items when there's OBS Source in between items, so OBS Source can
     * be displayed in proper layer
     *
     * e.g.: [item1, item2, item3] in a renderer,
     * item4 is an OBS Source,
     * [item5, item6] in another renderer
     */
    let prevItem: SceneItem | undefined;
    const osnActiveScene = osn.SceneFactory.fromName(activeScene.id);

    activeScene.items.forEach((item) => {
      if (item.type === 'browser-rendered') {
        if (!prevItem || prevItem.type === 'obs-source') {
          itemsGroups.push([]);
          let renderer = this.renderers[itemsGroups.length - 1];

          /**
           * Create renderer and add to OBS Scene if there is no renderer
           * for this itemsGroup
           */
          if (!renderer) {
            renderer = this.createRenderer(
              itemsGroups.length - 1,
              elementRendererPort
            );
            try {
              osnActiveScene.findItem(renderer.name).moveBottom();
            } catch (_err) {
              osnActiveScene.add(renderer).moveBottom();
            }
          }

          /**
           * Check if renderer for this itemsGroup exists in
           * the OBS activeScene. Add if not.
           */
          try {
            osnActiveScene.findItem(renderer.name).moveBottom();
          } catch (err) {
            osnActiveScene.add(renderer).moveBottom();
          }
        }
        itemsGroups[itemsGroups.length - 1].push(item);
      } else {
        osnActiveScene.findItem(item.id).moveBottom();
      }
      prevItem = item;
    });

    if (REMOVE_UNUSED_RENDERER_ON_CHANGE) {
      /**
       * It is faster to use unused renderer instead of
       * creating new renderer when additional renderer is needed.
       *
       * So we're not using this for now.
       */
      this.removeUnusedRenderer(itemsGroups);
    }

    this.io.emit('items-updated', itemsGroups);
  }

  private constructor(public port: number) {
    const app = express();
    const RESOURCES_PATH = electron.app.isPackaged
      ? path.join(process.resourcesPath, 'assets')
      : path.join(__dirname, '../../../assets');
    app.engine('html', ejs.renderFile);
    app.use('/dist', express.static(`${__dirname}/dist`));
    app.use('/assets', express.static(RESOURCES_PATH));
    app.get('/', (req, res) => {
      if (process.env.NODE_ENV === 'development') {
        const elementRendererPort = process.env.ELEMENT_RENDERER_PORT || 1213;
        createProxyServer({
          target: `http://localhost:${elementRendererPort}/dist/element-renderer.dev.html`,
        }).web(req, res);
      } else {
        res.render(`${__dirname}/dist/element-renderer.prod.html`);
      }
    });

    this.server = http.createServer(app);

    this.io = new Server(this.server);
    stateSubject.subscribe((state) => this.handleStateChange(state));

    // send current state when element renderer connected
    this.io.on('connect', () => {
      this.handleStateChange(stateSubject.getValue());
    });

    this.server.listen(port);
    setState((ps) => ({ ...ps, elementRendererPort: port }));
  }

  static getInstance() {
    if (!this.instance) throw Error('Not initialized!');
    return this.instance;
  }

  static async init() {
    // get random available port
    const port = await detectPort(0);
    this.instance = new ElementRendererService(port);
  }
}

export default ElementRendererService;
