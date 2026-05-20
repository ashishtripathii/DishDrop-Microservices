import User from "../model/User.js";
import jwt, { JwtPayload } from "jsonwebtoken";
import TryCatch from "../middlewares/trycatch.js";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import { oauth2Client } from "../config/googleConfig.js";
import axios from "axios";

export const loginUser = TryCatch(async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({
      message: "Authorization code is required",
    });
  }

  let googleRes;
  try {
    googleRes = await oauth2Client.getToken(code);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Google Token Error:", error.message);
    } else {
      console.error("Google Token Error:", error);
    }
    return res.status(500).json({
      message: "Google authentication failed",
    });
  }

  if (!googleRes.tokens?.access_token) {
    return res.status(400).json({
      message: "Failed to retrieve access token",
    });
  }

  oauth2Client.setCredentials(googleRes.tokens);

  let userRes;
  try {
    userRes = await axios.get(
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${googleRes.tokens.access_token}`,
    );
  } catch (error: unknown) {
    console.error("User Info Error:", error);
    return res.status(500).json({
      message: "Failed to fetch user info",
    });
  }

  const { email, name, picture } = userRes.data;

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name,
      email,
      image: picture,
    });
  }

  const token = jwt.sign({user }, process.env.JWT_SEC as string, {
    expiresIn: "15d",
  });

  return res.status(200).json({
    message: "Logged in Success",
    token,
    user,
  });
});

const allowedRoles = ["customer", "rider", "seller"] as const;

type Role = (typeof allowedRoles)[number];

export const addUserRole = TryCatch(async (req: AuthenticatedRequest, res) => {
  if (!req.user?._id) {
    return res.status(400).json({
      message: "Unauthorized",
    });
  }

  const { role } = req.body as { role: Role };
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({
      message: "Invalid role",
    });
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { role },
    { returnDocument: "after" },
  );

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  const token = jwt.sign({ user }, process.env.JWT_SEC as string, {
    expiresIn: "15d",
  });

  return res.status(200).json({ token, user });
});

export const myProfile = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = req?.user;
  return res.status(200).json({ user });
});
