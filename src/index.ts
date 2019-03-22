import dotenv from "dotenv";
dotenv.config();

import { ChatServer } from './chat-server';

let app = new ChatServer().getApp();
export { app };