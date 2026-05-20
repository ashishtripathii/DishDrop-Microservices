import axios from "axios";
import getBuffer from "../config/datauri.js";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import TryCatch from "../middlewares/trycatch.js";
import Restaurant from "../Models/Restaurant.js";
import jwt from "jsonwebtoken";

export const addRestaurant = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    console.log("FILE:", req.file);
    console.log("BODY:", req.body);
    if (!user) {
      return res.status(401).json({
        message: "Unauthorized user-Please login",
      });
    }
    const existingRestaurant = await Restaurant.findOne({
      ownerId: user?._id,
    });

    if (existingRestaurant) {
      return res.status(400).json({
        message: "You already have a restaurant ",
      });
    }

    const { name, description, latitude, longitude, formattedAddress, phone } =
      req.body;

    if (!name || !latitude || !longitude) {
      return res.status(400).json({
        message: "Please provide all details  ",
      });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({
        message: "Please provide restaurant image  ",
      });
    }

    const fileBuffer = getBuffer(file);
    if (!fileBuffer.content) {
      return res.status(500).json({
        message: "Failed to create file buffer ",
      });
    }

    console.log(fileBuffer.content.slice(0, 50));
    const { data: uploadResult } = await axios.post(
      `${process.env.UTILS_SERVICE}/api/upload`,
      {
        buffer: fileBuffer.content,
      },
    );

    const restaurant = await Restaurant.create({
      name,
      description,
      phone,
      image: uploadResult.url,
      ownerId: user._id,
      autoLocation: {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)],
        formattedAddress,
      },
      isVerified: false,
    });

    res.status(201).json({
      message: "Restaurant created successfully",
      restaurant,
    });
  },
);

export const fetchMyRestaurant = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized user-Please login",
      });
    }

    const user = req.user;
    const restaurant = await Restaurant.findOne({
      ownerId: user._id,
    });

    if (!restaurant) {
      return res.status(401).json({
        restaurant: null,
      });
    }

    if (!req.user.restaurantId) {
      const token = jwt.sign(
        {
          user: {
            ...req.user,
            restaurantId: restaurant._id,
          },
        },
        process.env.JWT_SEC as string,
        {
          expiresIn: "15d",
        },
      );
      return res.status(200).json({ restaurant, token });
    }
    return res.status(200).json({ restaurant });
  },
);

export const updateStatusRestaurant = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(403).json({
        message: "Please login",
      });
    }
    const { status } = req.body;

    if (typeof status !== "boolean") {
      return res.status(400).json({
        message: "Status must be boolean",
      });
    }

    const restaurant = await Restaurant.findOneAndUpdate(
      {
        ownerId: req.user._id,
      },
      {
        isOpen: status,
      },
      {
        new: true,
      },
    );

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found ",
      });
    }

    return res.status(200).json({
      message: " Restaurant Status  updated",
      restaurant,
    });
  },
);

export const updateRestaurant = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(403).json({
        message: "Please login",
      });
    }

    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        message: " name is required to update",
      });
    }
    const restaurant = await Restaurant.findOneAndUpdate(
      {
        ownerId: req.user._id,
      },
      {
        name,
        description,
      },
      { new: true },
    );

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found ",
      });
    }

    return res.status(200).json({
      message: " Restaurant updated",
      restaurant,
    });
  },
);

export const getNearbyRestaurants = TryCatch(async (req, res) => {
  const { latitude, longitude, radius = "5000", search = "" } = req.query;

  // ✅ Convert properly
  const lat = parseFloat(latitude as string);
  const lng = parseFloat(longitude as string);
  const maxRadius = parseInt(radius as string, 10);

  // ✅ Validate
  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({
      message: "Valid latitude and longitude are required",
    });
  }

  if (isNaN(maxRadius)) {
    return res.status(400).json({
      message: "Invalid radius",
    });
  }

  const query: any = { isVerified: true };

  if (search && typeof search === "string") {
    query.name = { $regex: search, $options: "i" };
  }

  const restaurants = await Restaurant.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lng, lat], // ✅ FIXED (number + correct order)
        },
        distanceField: "distance",
        maxDistance: maxRadius,
        spherical: true,
        query,
      },
    },
    {
      $addFields: {
        distanceKm: {
          $round: [{ $divide: ["$distance", 1000] }, 2],
        },
      },
    },
    {
      $sort: {
        isOpen: -1,
        distance: 1,
      },
    },
  ]);

  return res.status(200).json({
    success: true,
    count: restaurants.length,
    restaurants,
  });
});

export const fetchSingleResturant = TryCatch(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) {
    return res.status(404).json({
      message: "No resturant found",
    });
  }
  res.status(200).json(restaurant);
});
