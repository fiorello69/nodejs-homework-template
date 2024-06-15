import { STATUS_CODES } from "./constants.js";

export default function respondWithError(res, error) {
  console.error(error);
  res.status(STATUS_CODES.error).json({ message: error.message || `${error}` });
}
