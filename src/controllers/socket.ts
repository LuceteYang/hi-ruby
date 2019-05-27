import SocketIO from "socket.io";
import { Server } from "http";

export default class SocketServer {
  private io: SocketIO.Server;
  private rooms = {};
  private socketIds = {};
  constructor(server: Server) {
    this.io = SocketIO(server);
    this.IoInit();
  }
  private IoInit() {
    this.io.on("connection", socket => {
      // 룸접속
      socket.on("enter", (roomName: string, userId: string) => {
        let roomId = roomName;
        socket.join(roomId); // 소켓을 특정 room에 binding합니다.

        // 룸에 사용자 정보 추가, 이미 룸이 있는경우
        if (this.rooms[roomId]) {
          this.rooms[roomId][socket.id] = userId;
        } else {
          // 룸 생성 후 사용자 추가
          this.rooms[roomId] = {};
          this.rooms[roomId][socket.id] = userId;
        }
        let thisRoom = this.rooms[roomId];

        // 유저 정보 추가
        this.io.sockets.in(roomId).emit("join", roomId, thisRoom);
        //console.log('ROOM LIST', io.sockets.adapter.this.rooms);
      });

      /**
       * 메시지 핸들링
       */
      socket.on("message", data => {
        //console.log('message: ' + data);

        if (data.to === "all") {
          // for broadcasting without me
          socket.broadcast.to(data.roomId).emit("message", data);
        } else {
          // for target user
          const targetSocketId = this.socketIds[data.to];
          if (targetSocketId) {
            this.io.to(targetSocketId).emit("message", data);
          }
        }
      });

      /**
       * 연결 해제 핸들링
       */
      socket.on("disconnect", () => {
        console.log("a user disconnected", socket.id);
        const roomId = this.findRoomBySocketId(socket.id);
        if (roomId) {
          socket.broadcast
            .to(roomId)
            .emit("leave", this.rooms[roomId][socket.id]); // 자신 제외 룸안의 유저ID 전달
          delete this.rooms[roomId][socket.id]; // 해당 유저 제거
          if(Object.keys(this.rooms[roomId]).length===0){
            delete this.rooms[roomId]
          }
        }
      });
    });
  }
  private findRoomBySocketId(value: string) {
    const arr = Object.keys(this.rooms);
    let result: any = null;

    for (let i = 0; i < arr.length; i++) {
      if (this.rooms[arr[i]][value]) {
        result = arr[i];
        break;
      }
    }

    return result;
  }
}
