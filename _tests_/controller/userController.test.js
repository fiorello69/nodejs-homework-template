import { describe, expect, afterEach, it } from "@jest/globals";
import ContactsServices from "../../controllers/contactControllers.js";
import mockingoose from "mockingoose";
import Contact from "../../models/contacts.js";

describe("ContactsController", () => {
  afterEach(() => {
    mockingoose(Contact).reset();
  });

  it("listContacts", async () => {
    const mockContacts = [
      {
        name: "contacts",
        email: "mattis.Cras@nonenimMauris.net",
        phone: "(542) 451-7038",
      },
      {
        name: "contactsB",
        email: "mattis.Cras@nonenimMauris.net",
        phone: "(542) 451-7038",
      },
    ];

    mockingoose(Contact).toReturn(mockContacts, "find");
    const result = await ContactsServices.listContacts();
    expect(result.length).toBe(2);
  });
});
