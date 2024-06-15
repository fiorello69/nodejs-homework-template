import jwt from "jsonwebtoken";
import "dotenv/config";
import User from "../models/users.js";
import bcrypt from "bcrypt";
import passport from "passport";
import gravatar from "gravatar";
import { v4 as uuidv4 } from "uuid";
import sendEmailTo from "../nodemailer/nodemailer.js";

const AuthController = {
  login,
  signup,
  validateAuth,
  getPayloadFromJWT,
  getUserByValidationToken,
  updateToken,
};

const secretForToken = process.env.TOKEN_SECRET;

async function signup(data) {
  const { email, password } = data;
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("Email in use");
  }

  const userAvatar = gravatar.url(data.email);
  const saltRounds = 10;
  const encryptedPassword = await bcrypt.hash(data.password, saltRounds);
  const verificationToken = uuidv4();

  const newUser = new User({
    email: data.email,
    subscription: "starter",
    password: encryptedPassword,
    avatarURL: userAvatar,
    verificationToken,
  });

  await newUser.setPassword(encryptedPassword);

  await newUser.save();
  sendEmailTo(data.email, verificationToken);
  return newUser;
}

async function login(data) {
  const { email, password } = data;

  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Email or password is wrong");
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw new Error("Email or password is wrong");
  }

  const token = jwt.sign(
    {
      userId: user._id,
    },
    secretForToken,
    {
      expiresIn: "1h",
    }
  );

  user.token = token;
  await user.save();

  return { token, user };
}

function getPayloadFromJWT(token) {
  try {
    const payload = jwt.verify(token, secretForToken);

    return payload;
  } catch (err) {
    console.error(err);
  }
}

export function validateAuth(req, res, next) {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (!user || err) {
      return res.status(401).json({
        status: "error",
        code: 401,
        message: "Unauthorized",
        data: "Unauthorized",
      });
    }
    req.user = user;
    next();
  })(req, res, next);
}
export async function getUserByValidationToken(token) {
  const user = await User.findOne({ verificationToken: token, verify: false });

  if (user) {
    return true;
  }

  return false;
}
async function updateToken(email, token) {
  token = token || uuidv4();
  await User.findOneAndUpdate({ email }, { verificationToken: token });
  sendEmailTo(email, token);
}
export default AuthController;
