import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import adminRoutes from "./routes/admin.js";
dotenv.config();

const app = express();
const port = process.env.PORT;
app.use(cors());
app.use("/api/v1", adminRoutes);



app.listen(port, () => {
  console.log(`Admin service is running on : ${port}`);
});
