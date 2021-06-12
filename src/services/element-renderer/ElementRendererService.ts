import { Server } from 'socket.io';
import express from 'express';
import http from 'http';
import { createProxyServer } from 'http-proxy';
import detect from 'detect-port';
import ejs from 'ejs';
import electron from 'electron';
import path from 'path';
import { setState, stateSubject } from '../app/AppState';
import { AppState, CustomItem } from '../app/types';

class ElementRendererService {
  private static instance: ElementRendererService;

  private io: Server;

  private server: http.Server;

  private handleStateChange({ activeScene }: AppState) {
    const itemsGroups: CustomItem[][] = [[]];
    if (!activeScene) {
      this.io.emit('items-updated', itemsGroups);
      return;
    }
    /**
     * Groups items when there's OBS Source in between items so OBS Source can
     * be displayed in proper layer
     */
    activeScene.items.forEach((item) => {
      if (item.type !== 'browser-rendered') {
        if (itemsGroups[itemsGroups.length - 1].length > 0)
          itemsGroups.push([]);
        return;
      }
      itemsGroups[itemsGroups.length - 1].push(item);
    });
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
    const port = await detect(0);
    this.instance = new ElementRendererService(port);
  }
}

export default ElementRendererService;
