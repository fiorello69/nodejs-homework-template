import express from "express";
import FileController from "../../controllers/fileControllers.js";
import { STATUS_CODES } from "../../utils/constants.js";
import AuthController from "../../controllers/authControllers.js";
import respondWithError from "../../utils/respondWithErrors.js";

const router = express.Router();

router.patch(
  "/avatars",
  [AuthController.validateAuth, FileController.uploadFile],
  async (req, res) => {
    try {
      const response = await FileController.processAvatar(req, res);
      res.status(STATUS_CODES.success).json(response);
    } catch (error) {
      respondWithError(res, error, STATUS_CODES.error);
    }
  }
);

export default router;
