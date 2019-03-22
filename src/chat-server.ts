import { createServer, Server } from "http";
import express from "express";
import logger from "morgan";
import path from "path";
import router from "./controllers/route";
import SocketServer from "./controllers/socket";

export class ChatServer {
  public static readonly PORT: number = 3000;
  private app: express.Application;
  private server: Server;
  private port: string | number;

  constructor() {
    this.createApp();
    this.config();
    this.createServer();
    this.middlewares();
    this.initializeControllers();
    this.sockets();
    this.listen();
  }
  private config(): void {
    this.port = process.env.PORT || ChatServer.PORT;
  }
  private sockets(): void {
    new SocketServer(this.server);
  }
  private createServer(): void {
    this.server = createServer(this.app);
  }
  private createApp(): void {
    this.app = express();
  }

  private listen(): void {
    this.server.listen(this.port, () => {
      console.log("Running server on port %s", this.port);
    });
  }
  private middlewares = (): void => {
    this.app.set("views", path.join(__dirname, "../views"));
    this.app.set("view engine", "ejs");
    this.app.use(logger("dev"));
    this.app.use(
      express.static(path.join(__dirname, "public"), { maxAge: 31557600000 })
    );
  };
  private initializeControllers(): void {
    this.app.use("/", router);
  }
  public getApp(): express.Application {
    return this.app;
  }
}
