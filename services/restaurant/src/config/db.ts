import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string, {
      dbName: "DishDrop",
    });
    console.log("DB connected successfully");
  } catch (error) {
    console.log(error);
  }
};
