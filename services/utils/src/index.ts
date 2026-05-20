import express from "express";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import uploadRoutes from "./routes/cloudinary.js";
import cors from "cors";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import paymentRoutes from "./routes/payment.js";

dotenv.config();

await connectRabbitMQ();

const app = express();
const port = process.env.PORT || 5002;
const { CLOUD_NAME, CLOUD_API_KEY, CLOUD_API_SECRET } = process.env;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

if (!CLOUD_API_KEY || !CLOUD_NAME || !CLOUD_API_SECRET) {
  throw new Error("Missing Cloudinary environment variables");
}

cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: CLOUD_API_KEY,
  api_secret: CLOUD_API_SECRET,
});

app.use("/api", uploadRoutes);
app.use("/api/payment", paymentRoutes);


app.listen(port, async () => {
  console.log(`Utils  Service is working on http://localhost:${port}`);
});
