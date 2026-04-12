import type { Server as HttpServer } from "node:http";

import { Server } from "socket.io";
import type { RealtimeEventPayloadMap } from "@exam-platform/shared";

let io: Server | null = null;

export function createRealtimeServer(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    socket.on("join:admin", () => {
      socket.join("admins");
    });
  });

  return io;
}

export function getRealtimeServer() {
  if (!io) {
    throw new Error("Realtime server has not been initialized.");
  }

  return io;
}

export function emitRealtimeEvent<EventName extends keyof RealtimeEventPayloadMap>(
  name: EventName,
  payload: RealtimeEventPayloadMap[EventName]
) {
  if (!io) {
    return;
  }

  io.to("admins").emit(name, payload);
}
