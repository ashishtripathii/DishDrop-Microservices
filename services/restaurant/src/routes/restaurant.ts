import express from "express";
import { isAuth, isSeller } from "../middlewares/isAuth.js";
import {
  addRestaurant,
  fetchMyRestaurant,
  fetchSingleResturant,
  getNearbyRestaurants,
  updateRestaurant,
  updateStatusRestaurant,
} from "../controllers/restaurant.js";
import uploadFile from "../middlewares/multer.js";

const router = express.Router();

router.post("/new", isAuth, isSeller, uploadFile, addRestaurant);
router.get("/my", isAuth, isSeller, fetchMyRestaurant);
router.put("/status", isAuth, isSeller, updateStatusRestaurant);
router.put("/:id", isAuth, isSeller, updateRestaurant);
router.get("/all", isAuth, getNearbyRestaurants);
router.get("/:id", isAuth, fetchSingleResturant);

export default router;
