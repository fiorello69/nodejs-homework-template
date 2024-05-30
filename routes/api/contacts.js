import express from "express";
import ContactsServices from "../../controllers/contactControllers.js";
import Joi from "joi";
import { STATUS_CODES } from "../../utils/constants.js";

const router = express.Router();
const schema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  email: Joi.string()
    .email({ minDomainSegments: 2, tlds: { allow: ["com", "net", "ro"] } })
    .required(),
  phone: Joi.string().alphanum().min(10).max(20).required(),
  favorite: Joi.boolean().optional(),
});

/* GET localhost:3000/api/contacts */
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const favorite = req.query.favorite === "true";
    const contactsList = await ContactsServices.listContacts(page, limit);
    res.status(STATUS_CODES.success).json({
      message: "List of contacts was loaded successfully",
      data: contactsList,
    });
  } catch (error) {
    respondWithError(res, error);
  }
});

/* GET localhost:3000/api/contacts/:contactId */
router.get("/:contactId", async (req, res) => {
  try {
    const contactId = req.params.contactId;

    const contact = await ContactsServices.getContactById(contactId);

    if (!contact) {
      return res.status(STATUS_CODES.notFound).json({
        message: "Contact was not found",
      });
    }

    res.status(STATUS_CODES.success).json({
      message: "The contact was found!",
      data: contact,
    });
  } catch (error) {
    respondWithError(res, error);
  }
});

/* POST localhost:3000/api/contacts */
router.post("/", async (req, res) => {
  try {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(STATUS_CODES.badRequest).json({
        message: "Validation error",
        errors: error.details.map((err) => err.message),
      });
    }

    await ContactsServices.addContact(value);
    res.status(STATUS_CODES.created).json({
      message: `Contact ${value.name} was added successfully`,
    });
  } catch (error) {
    respondWithError(res, error);
  }
});

/* DELETE localhost:3000/api/contacts/:contactId */
router.delete("/:contactId", async (req, res) => {
  try {
    const contactId = req.params.contactId;
    const contact = await ContactsServices.getContactById(contactId);

    if (!contact) {
      return res.status(STATUS_CODES.notFound).json({
        message: "The contact was not found.",
      });
    } else {
      const result = await ContactsServices.removeContact(contactId);
      if (result) {
        return res.status(STATUS_CODES.deleted).json({
          message: `Contact ${contact.name} has been successfully deleted.`,
        });
      }
    }
  } catch (error) {
    respondWithError(res, error);
  }
});

/* PUT localhost:3000/api/contacts/:contactId */
router.put("/:contactId", async (req, res) => {
  try {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(STATUS_CODES.badRequest).json({
        message: "Validation error",
        errors: error.details.map((err) => err.message),
      });
    }

    const contactId = req.params.contactId;
    await ContactsServices.updateContact(value, contactId);
    res.status(STATUS_CODES.success).json({
      message: `Contact ${value.name} was updated successfully`,
    });
  } catch (error) {
    respondWithError(res, error);
  }
});
/* PATCH localhost:3000/api/contacts/:contactId/favorite */
router.patch("/:contactId/favorite", async (req, res) => {
  try {
    const { favorite } = req.body;
    if (favorite === undefined) {
      return res.status(STATUS_CODES.badRequest).json({
        message: "Missing field favorite",
      });
    }

    const contactId = req.params.contactId;
    const updatedContact = await ContactsServices.updateStatusContact(
      contactId,
      req.body
    );

    if (!updatedContact) {
      return res.status(STATUS_CODES.notFound).json({
        message: "Not found",
      });
    }

    res.status(STATUS_CODES.success).json({
      message: `Contact ${updatedContact.name} favorite status updated successfully`,
      data: updatedContact,
    });
  } catch (error) {
    respondWithError(res, error);
  }
});

function respondWithError(res, error) {
  console.error(error);
  res.status(STATUS_CODES.error).json({ message: error.message || `${error}` });
}

export default router;
