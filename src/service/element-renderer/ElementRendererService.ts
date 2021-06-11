import { Server } from 'socket.io';
import express from 'express';
import http from 'http';
import { createProxyServer } from 'http-proxy';
import detect from 'detect-port';
import ejs from 'ejs';
import { setState, stateSubject } from '../app/AppState';

class ElementRendererService {
  private static instance: ElementRendererService;

  private io: Server;

  private server: http.Server;

  private constructor(public port: number) {
    const app = express();
    app.engine('html', ejs.renderFile);
    app.use('/dist', express.static(`${__dirname}/dist`));
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
    stateSubject.subscribe((state) => {
      this.io.emit('item-changed', state);
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
