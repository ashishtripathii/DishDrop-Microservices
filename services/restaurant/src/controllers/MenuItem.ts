import axios from "axios";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import TryCatch from "../middlewares/trycatch.js";
import Restaurant from "../Models/Restaurant.js";
import getBuffer from "../config/datauri.js";
import MenuItem from "../Models/MenuItem.js";

export const addMenuItem = TryCatch(async (req: AuthenticatedRequest, res) => {
  console.log("🚀 API HIT: addMenuItem");

  // 🔐 Auth check
  if (!req.user) {
    console.log("❌ No user found in request");
    return res.status(401).json({
      message: "Please login",
    });
  }

  console.log("✅ User:", req.user);

  // 🍽 Restaurant check
  const restaurant = await Restaurant.findOne({ ownerId: req.user._id });

  if (!restaurant) {
    console.log("❌ No restaurant found for user:", req.user._id);
    return res.status(404).json({
      message: "No Restaurant found",
    });
  }

  console.log("✅ Restaurant found:", restaurant._id);

  // 🧾 Body check
  const { name, description, price } = req.body;
  console.log("📦 Body:", { name, description, price });

  if (!name || !description || !price) {
    console.log("❌ Missing fields");
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  // 📁 File check
  const file = req.file;

  if (!file) {
    console.log("❌ No file received");
    return res.status(400).json({
      message: "Please provide item image",
    });
  }

  console.log("✅ File received:", {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  });

  // 🔄 Buffer creation
  const fileBuffer = getBuffer(file);

  if (!fileBuffer.content) {
    console.log("❌ Buffer creation failed");
    return res.status(500).json({
      message: "Failed to create file buffer",
    });
  }

  // ------------------

  // const { data: uploadResult } = await axios.post(
  //   `${process.env.UTILS_SERVICE}/api/upload`,
  //   {
  //     buffer: base64,
  //   },
  // );
  // ----------

  console.log("✅ Buffer created");

  // 🔥 IMPORTANT FIX (base64 format)
  // const base64 = `data:${file.mimetype};base64,${fileBuffer.content}`;

  // ☁️ Upload to utils service
  let uploadResult;

  try {
    console.log("📡 Calling utils service:", process.env.UTILS_SERVICE);

    const response = await axios.post(
      `${process.env.UTILS_SERVICE}/api/upload`,
      {
        buffer: fileBuffer.content,
      },
    );

    uploadResult = response.data;

    console.log("✅ Upload success:", uploadResult);
  } catch (err: any) {
    console.log("❌ Upload failed");
    console.error("ERROR:", err?.response?.data || err.message);

    return res.status(500).json({
      message: "Image upload failed",
    });
  }

  // 💾 Save to DB
  const item = await MenuItem.create({
    name,
    description,
    price,
    restaurantId: restaurant._id,
    image: uploadResult.url,
  });

  console.log("✅ Item saved:", item._id);

  res.status(200).json({
    message: "Items Added successfully",
    item,
  });
});

export const getAllItems = TryCatch(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({
      message: "Id is required",
    });
  }

  const items = await MenuItem.find({ restaurantId: id });

  if (!items) {
    return res.status(404).json({
      message: "No items found",
    });
  }

  return res.status(200).json({ items });
});

export const deleteMenuItem = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Please login",
      });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        message: "Id is required",
      });
    }

    const item = await MenuItem.findById(id);

    if (!item) {
      return res.status(404).json({
        message: "No item found",
      });
    }

    const restaurant = await Restaurant.findOne({
      _id: item.restaurantId,
      ownerId: req.user._id,
    });

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not  found",
      });
    }

    await item.deleteOne();

    return res.status(200).json({
      message: "Menu item deleted successfully",
    });
  },
);

export const toggleMenuItemAvalibility = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Please login",
      });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        message: "Id is required",
      });
    }

    const item = await MenuItem.findById(id);

    if (!item) {
      return res.status(404).json({
        message: "No item found",
      });
    }

    const restaurant = await Restaurant.findOne({
      _id: item.restaurantId,
      ownerId: req.user._id,
    });

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not  found",
      });
    }

    item.isAvaliable = !item.isAvaliable;

    await item.save();

    res.status(200).json({
      message: `Item Marked as ${item.isAvaliable ? "available" : "unavailable "}`,
      item,
    });
  },
);
