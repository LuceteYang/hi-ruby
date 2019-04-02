import dotenv from "dotenv";
dotenv.config({ path: __dirname + "/../.env" });

import { ChatServer } from "./chat-server";

let app = new ChatServer().getApp();
export { app };