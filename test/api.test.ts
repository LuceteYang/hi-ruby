import request from "supertest";
import { ChatServer } from "../src/chat-server";
const app = new ChatServer().getApp()
describe("GET /", () => {
  it("should return 200 OK", () => {
    return request(app)
      .get("/")
      .expect(200);
  });
});
