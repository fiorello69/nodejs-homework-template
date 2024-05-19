import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";

const contactsPath = path.resolve("models", "contacts.json");

let contacts = [];
async function loadContacts() {
  try {
    const data = await fs.readFile(contactsPath, "utf-8");
    contacts = JSON.parse(data);
  } catch (error) {
    console.error("Failed to load contacts from contacts.json:", error);
  }
}

loadContacts();

async function writeContactsToFile() {
  try {
    await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2));
  } catch (error) {
    console.error("Failed to write contacts to contacts.json:", error);
    throw new Error("Failed to write contacts to contacts.json");
  }
}

async function listContacts() {
  return contacts;
}

async function getContactById(contactId) {
  return contacts.find((el) => el.id === contactId);
}

//
async function removeContact(contactId) {
  const index = contacts.findIndex((contact) => contact.id === contactId);
  if (index === -1) {
    return null;
  } else {
    contacts.splice(index, 1);
    await writeContactsToFile();
    return 1;
  }
}
async function addContact(contact) {
  const preparedNewContact = {
    id: uuidv4(),
    ...contact,
  };
  contacts.push(preparedNewContact);
  await writeContactsToFile();
}

async function updateContact(updatedContact, contactId) {
  const index = contacts.findIndex((contact) => contact.id === contactId);
  if (index === -1) {
    throw new Error("Contact was not found.");
  }

  contacts[index] = { ...updatedContact, id: contactId };
  await writeContactsToFile();
}

const ContactsServices = {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
};
export default ContactsServices;
