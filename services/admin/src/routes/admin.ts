import express from "express";
import { isAdmin, isAuth } from "../middlewares/isAuth";
import {
  getPendingRestaurant,
  getPendingRiders,
  verifyRestaurant,
  verifyRider,
} from "../controllers/admin";

const router = express.Router();

router.get("/admin/restaurant/pending", isAuth, getPendingRestaurant);
router.get("/admin/rider/pending", isAuth, getPendingRiders);

router.patch("/admin/rider/pending", isAuth, isAdmin, verifyRestaurant);
router.patch("/verify/rider/:id", isAuth, isAdmin, verifyRider);

export default router;
