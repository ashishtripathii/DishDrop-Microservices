import mongoose from "mongoose";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import TryCatch from "../middlewares/trycatch.js";
import Cart from "../Models/Cart.js";

export const addToCart = TryCatch(async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Please Login",
    });
  }

  const userId = req.user._id;

  const { restaurantId, itemId } = req.body;

  if (
    !mongoose.Types.ObjectId.isValid(restaurantId) ||
    !mongoose.Types.ObjectId.isValid(itemId)
  ) {
    return res.status(401).json({
      message: "Invalid Restaurant and ItemId",
    });
  }

  const cartFromDiffrentRestaurant = await Cart.findOne({
    userId,
    restaurantId: { $ne: restaurantId },
  });

  if (cartFromDiffrentRestaurant) {
    return res.status(401).json({
      message:
        "You can Order from only one restaurant at a time,Please clear your cart first to add items from this restaurant",
    });
  }

  const cartItem = await Cart.findOneAndUpdate(
    {
      userId,
      restaurantId,
      itemId,
    },
    {
      $inc: { quantity: 1 },
      $setOnInsert: { userId, restaurantId, itemId },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  return res.status(200).json({
    message: "Item added to cart",
    cart: cartItem,
  });
});

export const fetchCart = TryCatch(async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Please Login",
    });
  }

  const userId = req.user._id;

  const cartItems = await Cart.find({ userId })
    .populate("itemId")
    .populate("restaurantId");

  let subtotal = 0;
  let cartLength = 0;

  for (const cartItem of cartItems) {
    const item: any = cartItem.itemId;

    subtotal += item.price * cartItem.quantity;
    cartLength += cartItem.quantity;
  }

  return res.status(200).json({
    success: true,
    cartLength,
    subtotal,
    cart: cartItems,
  });
});

export const incrementCartItem = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id;
    const { itemId } = req.body;

    if (!userId || !itemId) {
      return res.status(401).json({
        message: "Invalid request",
      });
    }

    const cartItem = await Cart.findOneAndUpdate(
      { userId, itemId },
      { $inc: { quantity: 1 } },
      { new: true },
    );
    if (!cartItem) {
      return res.status(404).json({
        message: "Item not found",
      });
    }

    return res.status(200).json({
      message: "Quantity Increased",
      cartItem,
    });
  },
);

export const decrementCartItem = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id;
    const { itemId } = req.body;

    if (!userId || !itemId) {
      return res.status(401).json({
        message: "Invalid request",
      });
    }

    const cartItem = await Cart.findOne({ userId, itemId });
    if (!cartItem) {
      return res.status(404).json({
        message: "Item not found",
      });
    }

    if (cartItem.quantity === 1) {
      await Cart.deleteOne({ userId, itemId });

      return res.status(200).json({
        message: "Item removed from cart ",
        cartItem,
      });
    }

    cartItem.quantity -= 1;
    await cartItem.save();

    return res.status(200).json({
      message: "Quantity decreased",
      cartItem,
    });
  },
);

export const clearCart = TryCatch(async (req: AuthenticatedRequest, res) => {
  const userId = req.user?._id;
  if (!userId) {
    return res.status(401).json({
      message: "Unauthorized-Please Login",
    });
  }
  await Cart.deleteMany({ userId });
  res.status(200).json({
    message: "Cart cleared successfully",
  });
});
