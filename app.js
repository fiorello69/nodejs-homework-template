import dotenv from "dotenv";
import "dotenv/config";
import express from "express";
import logger from "morgan";
import cors from "cors";
import contactsRouter from "./routes/api/contacts.js";
import authRouter from "./routes/api/users.js";
import connectToDb from "./utils/connectToDb.js";
import passport from "./utils/passport.js";
import uploadRouter from "./routes/api/avatars.js";

const app = express();
const formatsLogger = app.get("env") === "development" ? "dev" : "short";
dotenv.config();
connectToDb();
app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());
app.use(passport.initialize());
app.use(express.static("public"));
app.use("/api/contacts", contactsRouter);
app.use("/api/users", authRouter);
app.use("/api/avatars", uploadRouter);

app.use((_, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use((err, _, res, next) => {
  res.status(500).json({ message: err.message });
});

export default app;
