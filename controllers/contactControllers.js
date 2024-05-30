import Contact from "../models/contacts.js";

async function listContacts(page = -1, limit = 20, favorite = null) {
  try {
    const skip = (page = -1) * limit;
    let query = {};
    if (favorite !== null) {
      query.favorite = favorite;
    }
    const contacts = await Contact.find(query).skip(skip).limit(limit);
    return contacts;
  } catch (error) {
    throw new Error("Failed to retrieve contacts");
  }
}

async function getContactById(contactId) {
  try {
    const contact = await Contact.findById(contactId);
    return contact;
  } catch (error) {
    throw new Error("Failed to retrieve contact");
  }
}

async function removeContact(contactId) {
  try {
    const result = await Contact.findByIdAndDelete(contactId);
    return result;
  } catch (error) {
    throw new Error("Failed to delete contact");
  }
}

async function addContact(contact) {
  try {
    const newContact = new Contact(contact);
    await newContact.save();
    return newContact;
  } catch (error) {
    throw new Error("Failed to add contact");
  }
}

async function updateContact(updatedContact, contactId) {
  try {
    const result = await Contact.findByIdAndUpdate(contactId, updatedContact, {
      new: true,
    });
    return result;
  } catch (error) {
    throw new Error("Failed to update contact");
  }
}
async function updateStatusContact(contactId, body) {
  try {
    const result = await Contact.findByIdAndUpdate(
      contactId,
      { favorite: body.favorite },
      { new: true }
    );
    return result;
  } catch (error) {
    throw new Error("Failed to update contact status");
  }
}
const ContactsServices = {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
  updateStatusContact,
};

export default ContactsServices;
