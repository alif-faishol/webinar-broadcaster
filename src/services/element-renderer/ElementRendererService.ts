import { Server as IoServer } from 'socket.io';
import express from 'express';
import http from 'http';
import { createProxyServer } from 'http-proxy';
import detectPort from 'detect-port';
import ejs from 'ejs';
import electron from 'electron';
import path from 'path';
import * as osn from 'obs-studio-node';
import { CustomItem, Scene, SceneItem } from '../broadcaster/types';
import BroadcasterService, { BroadcasterServiceState } from '../broadcaster';

const REMOVE_UNUSED_RENDERER_ON_CHANGE = false;

class ElementRendererService {
  private static instance: ElementRendererService;

  private io: IoServer;

  private server: http.Server;

  private renderers: osn.IInput[] = [];

  private prevActiveSceneItems: SceneItem[] | undefined;

  private itemsGroups: CustomItem[][] = [];

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

    this.io = new IoServer(this.server);
    const { observableState } = BroadcasterService.getInstance();
    observableState.subscribe((state) => this.handleStateChange(state));

    // send current state when element renderer first connected
    this.io.on('connect', () => {
      this.handleStateChange(observableState.getValue());
    });

    this.server.listen(port);
    console.log('ELEMENT RENDERER PORT:', port);
    // setState((ps) => ({ ...ps, elementRendererPort: port }));
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

  private createRenderer(layer: number) {
    const osnSource = osn.InputFactory.create(
      'browser_source',
      `renderer-${layer}`,
      {
        url: `http://localhost:${this.port}/?layer=${layer}`,
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

  /**
   * Groups items when there's OBS Source in between items, so OBS Source can
   * be displayed in proper layer
   *
   * e.g.: [item1, item2, item3] in a renderer,
   * item4 is an OBS Source,
   * [item5, item6] in another renderer
   */
  private updateItemsGroups(activeScene: Scene) {
    let prevItem: SceneItem | undefined;
    const osnActiveScene = osn.SceneFactory.fromName(activeScene.id);
    this.itemsGroups = [];
    activeScene.items.forEach((item) => {
      if (item.type === 'browser-rendered') {
        if (!prevItem || prevItem.type === 'obs-source') {
          this.itemsGroups.push([]);
          let renderer = this.renderers[this.itemsGroups.length - 1];

          /**
           * Create renderer and add to OBS Scene if there is no renderer
           * for this itemsGroup
           */
          if (!renderer) {
            renderer = this.createRenderer(this.itemsGroups.length - 1);
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
        this.itemsGroups[this.itemsGroups.length - 1].push(item);
      } else {
        osnActiveScene.findItem(item.id).moveBottom();
      }
      prevItem = item;
    });

    if (REMOVE_UNUSED_RENDERER_ON_CHANGE) {
      /**
       * It is faster to reuse unused renderer instead of
       * creating new renderer when additional renderer is needed.
       *
       * So we're not calling this method for now.
       */
      this.removeUnusedRenderer(this.itemsGroups);
    }
  }

  private handleStateChange({ activeScene }: BroadcasterServiceState) {
    if (!activeScene) {
      this.io.emit('items-updated', []);
      return;
    }

    /**
     * No need to recalculate layers / itemsGroups if reference to
     * "items" (the Array) from activeScene is not changed.
     *
     * Because of this, actions that requires layer or itemsGroups to be
     * recalculated needs to also assigns new "items" Array in activeScene.
     * e.g: when adding/removing item.
     *
     * Example of actions that don't need layers / itemsGroups recalculation:
     * updating item variables
     */
    if (this.prevActiveSceneItems !== activeScene.items) {
      this.updateItemsGroups(activeScene);
    }
    this.io.emit('items-updated', this.itemsGroups);
    this.prevActiveSceneItems = activeScene.items;
  }
}

export default ElementRendererService;
