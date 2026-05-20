import { Server } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";

let io: Server;

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SEC!) as any;

      if (!decoded?.user) {
        return next(new Error("Unauthorized"));
      }

      socket.data.user = decoded.user;

      next();
    } catch (error) {
      console.log("❌ Socket auth failed", error);

      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;

    console.log("✅ User connected:", user._id);

    // user room
    socket.join(`user:${user._id}`);

    // restaurant room
    if (user.restaurantId) {
      socket.join(`restaurant:${user.restaurantId}`);

      console.log(
        "🏪 Joined restaurant room:",
        `restaurant:${user.restaurantId}`,
      );
    }

    // manual join room
    socket.on("join-room", (room) => {
      socket.join(room);

      console.log("➕ Joined room:", room);
    });

    // manual leave room
    socket.on("leave-room", (room) => {
      socket.leave(room);

      console.log("➖ Left room:", room);
    });

    console.log("📦 Socket rooms:", [...socket.rooms]);

    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", user._id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }

  return io;
};
