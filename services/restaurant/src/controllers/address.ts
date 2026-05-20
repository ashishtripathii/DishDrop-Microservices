import mongoose from "mongoose";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import TryCatch from "../middlewares/trycatch.js";
import Address from "../Models/Address.js";

export const addAddress = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const { mobile, formattedAddress, latitude, longitude } = req.body;

  if (
    !mobile ||
    !formattedAddress ||
    latitude === undefined ||
    longitude === undefined
  ) {
    return res.status(401).json({
      message: "Please provide all details",
    });
  }

  const newAddress = await Address.create({
    userId: user._id,
    mobile,
    formattedAddress,
    location: {
      type: "Point",
      coordinates: [Number(longitude), Number(latitude)],
    },
  });

  return res.status(200).json({
    message: "Address Added successfully ",
    address: newAddress,
  });
});

export const deleteAddress = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Id is required",
      });
    }

    const address = await Address.findOne({
      _id: id,
      userId: user._id.toString(),
    });

    if (!address) {
      return res.status(404).json({
        message: "Address not found ",
      });
    }

    await address.deleteOne();

    res.status(200).json({
      message: "Address deleted successfully",
    });
  },
);

export const getMyAddress = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const address = await Address.find({
    userId: user._id,
  }).sort({ createdAt: -1 });

  if (!address) {
    return res.status(404).json({
      message: "Address not found ",
    });
  }
  res.status(200).json(address);
});
