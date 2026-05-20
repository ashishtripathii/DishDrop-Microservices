import express from "express";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

const router = express.Router();

router.post("/upload", async (req, res) => {
  try {
    let { buffer } = req.body;
    if (!buffer || typeof buffer !== "string") {
      return res.status(400).json({
        message: "Invalid buffer",
      });
    }

    if (!buffer.startsWith("data:")) {
      buffer = `data:image/jpeg;base64,${buffer}`;
    }

    console.log("📸 Received:", buffer.slice(0, 50));

    // ✅ FIX: Ensure proper Data URI format

    // ✅ Upload to Cloudinary
    const result = await cloudinary.uploader.upload(buffer, {
      folder: "restaurants",
      timeout: 60000,
    });

    return res.json({
      url: result.secure_url,
    });
  } catch (error: any) {
    console.error("🔥 CLOUDINARY ERROR:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
});

export default router;
