import express from "express";
import AuthController from "../../controllers/authControllers.js";
import { STATUS_CODES } from "../../utils/constants.js";
import User from "../../models/users.js";
import UserController from "../../controllers/userControllers.js";
import passport from "../../utils/passport.js";
import { v4 as uuidv4 } from "uuid";
import sendEmailTo from "../../nodemailer/nodemailer.js";
const router = express.Router();

function validateSignupPayload(data) {
  const { email, password } = data;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !password) {
    return "Email and password are required";
  }

  if (!emailRegex.test(email)) {
    return "Invalid email format";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters long";
  }

  return null;
}

function validateLoginPayload(data) {
  const { email, password } = data;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !password) {
    return "Email and password are required";
  }

  if (!emailRegex.test(email)) {
    return "Invalid email format";
  }

  return null;
}
/* POST localhost:3000/api/users/signup/ */
router.post("/signup", async (req, res) => {
  try {
    const validationError = validateSignupPayload(req.body);
    if (validationError) {
      return res
        .status(STATUS_CODES.badRequest)
        .json({ message: validationError });
    }

    const newUser = await AuthController.signup(req.body);

    res.status(STATUS_CODES.created).json({
      user: {
        email: newUser.email,
        subscription: newUser.subscription,
      },
    });
  } catch (error) {
    if (error.message === "Email in use") {
      return res.status(STATUS_CODES.Conflict).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
});
/* POST localhost:3000/api/users/login/ */
router.post("/login", async (req, res) => {
  try {
    const validationError = validateLoginPayload(req.body);
    if (validationError) {
      return res
        .status(STATUS_CODES.badRequest)
        .json({ message: validationError });
    }

    const { token, user } = await AuthController.login(req.body);

    console.log(`--- user ${user.email} Login! ---`);

    res.status(STATUS_CODES.success).json({
      token,
      user: {
        email: user.email,
        subscription: user.subscription,
      },
    });
  } catch (error) {
    res.status(STATUS_CODES.Unauthorized).json({ message: error.message });
  }
});

/* GET localhost:3000/api/users/logout/ */
router.get(
  "/logout",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    try {
      console.log("Authenticated user:", req.user);
      const userId = req.user._id;
      const user = await User.findById(userId);

      if (!user) {
        console.log("User not found:", userId);
        return res
          .status(STATUS_CODES.Unauthorized)
          .json({ message: "Not authorized" });
      }

      user.token = null;
      await user.save();

      res
        .status(STATUS_CODES.success)
        .json({ message: "User has been logged out successfully" });
    } catch (error) {
      console.error(error);
      res.status(STATUS_CODES.error).json({ message: "Server error" });
    }
  }
);
/* GET localhost:3000/api/users/current/ */
router.get(
  "/current",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return res
          .status(STATUS_CODES.Unauthorized)
          .json({ message: "Not authorized" });
      }
      console.log("Current user data: ");
      console.log("userId:", user._id);
      console.log("email:", user.email);
      console.log("subscription:", user.subscription);
      res.status(STATUS_CODES.success).json({
        email: user.email,
        subscription: user.subscription,
      });
    } catch (error) {
      console.error(error);
      res.status(STATUS_CODES.error).json({ message: "Server error" });
    }
  }
);
/* PATCH localhost:3000/api/users/:userId/ */
router.patch(
  "/:userId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const userIdFromToken = req.user._id.toString();
      const userIdFromRequest = req.params.userId;

      if (userIdFromToken !== userIdFromRequest) {
        return res
          .status(STATUS_CODES.forbidden)
          .json({ message: "Unauthorized" });
      }

      const { subscription } = req.body;
      const validSubscriptions = ["starter", "pro", "business"];
      if (!validSubscriptions.includes(subscription)) {
        return res
          .status(STATUS_CODES.badRequest)
          .json({ message: "Invalid subscription" });
      }

      const updatedUser = await UserController.updateSubscription(
        userIdFromRequest,
        subscription
      );

      res.status(200).json({
        message: "Subscription updated successfully!",
        user: updatedUser,
      });
      console.log(`--- Subscription ${subscription} updated successfully! ---`);
    } catch (error) {
      console.error(error);
      res.status(STATUS_CODES.error).json({ message: "Server error" });
    }
  }
);
// GET localhost : 3000/api/users/verify/:verificationToken
router.get("/verify/:verificationToken", async (req, res) => {
  const token = req.params.verificationToken;

  try {
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res
        .status(STATUS_CODES.notFound)
        .json({ message: "User not found" });
    }

    user.verify = true;
    user.verificationToken = null;
    await user.save();

    res
      .status(STATUS_CODES.success)
      .json({ message: "Verification successful" });
  } catch (error) {
    console.error(error);
    res.status(STATUS_CODES.error).json({ message: "Server error" });
  }
});

// POST localhost :3000/api/users/verify
router.post("/verify", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res
      .status(STATUS_CODES.badRequest)
      .json({ message: "Missing required field email" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(STATUS_CODES.notFound)
        .json({ message: "User not found" });
    }

    if (user.verify) {
      return res
        .status(STATUS_CODES.badRequest)
        .json({ message: "Verification has already been passed" });
    }

    const verificationToken = uuidv4();
    user.verificationToken = verificationToken;
    await user.save();

    sendEmailTo(email, verificationToken);

    res
      .status(STATUS_CODES.success)
      .json({ message: "Verification email sent" });
  } catch (error) {
    console.error(error);
    res.status(STATUS_CODES.error).json({ message: "Server error" });
  }
});
// DEL localhost: 3000 /api/users/delete/:email
router.delete("/delete/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const user = await User.findOneAndDelete({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
