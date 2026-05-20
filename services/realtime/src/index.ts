import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { initSocket } from "./socket.js";
import internalRoutes from "./routes/internal.js";

dotenv.config();

const app = express();

const port = process.env.PORT;

app.use(cors());

app.use(express.json());

app.use("/api/v1/internal", internalRoutes);

const server = http.createServer(app);

initSocket(server);

server.listen(port, () => {
  console.log(`🚀 Realtime service running on port ${port}`);
});
