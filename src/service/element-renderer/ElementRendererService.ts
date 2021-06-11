import { Server } from 'socket.io';
import express from 'express';
import http from 'http';
import detect from 'detect-port';
import { stateSubject } from '../app/AppState';

class ElementRendererService {
  private static instance: ElementRendererService;

  private io: Server;

  private server: http.Server;

  private constructor(public port: number) {
    const app = express();
    console.log(port);
    app.set('view engine', 'ejs');
    app.get('/', (req, res) => {
      const elementRendererDevPort = process.env.ELEMENT_RENDERER_PORT || 1213;
      const bundleUrl =
        process.env.NODE_ENV === 'development'
          ? `http://localhost:${elementRendererDevPort}/dist/element-renderer.dev.js`
          : './dist/element-renderer.prod.js';

      res.render(`${__dirname}/index`, { bundleUrl, socketPort: port });
    });

    this.server = http.createServer(app);

    this.io = new Server(this.server);
    stateSubject.subscribe((state) => {
      this.io.emit('item-changed', state);
    });

    this.server.listen(port);
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
