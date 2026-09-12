import type { Server } from "socket.io";

let io: Server | null = null;

export function setSocketIO(
  socketServer: Server
) {
  io = socketServer;
}

export function getSocketIO(): Server {
  if (!io) {
    throw new Error(
      "Socket.IO has not been initialized"
    );
  }

  return io;
}

/*
 * Send an event to every active socket
 * belonging to one specific user.
 */
export function emitToUser(
  userId: string,
  event: string,
  data: unknown
) {
  if (!io) {
    console.error(
      "Socket.IO has not been initialized"
    );
    return;
  }

  io.sockets.sockets.forEach(
    (socket) => {
      if (
        socket.data.user?.userId ===
        userId
      ) {
        socket.emit(event, data);
      }
    }
  );
}