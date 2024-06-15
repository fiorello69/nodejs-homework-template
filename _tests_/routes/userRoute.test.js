import { request } from "supertest";
import express from "express";
import authRouter from "../../routes/api/users.js";
import { jest, describe, expect, it, afterEach } from "@jest/globals";
import bodyParser from "body-parser";
import User from "../../models/users.js";
import mockingoose from "mockingoose";
import bcrypt from "bcrypt";

jest.mock("../../controllers/userController.js", () => ({
  validateAuth: (_, __, next) => {
    console.log("validateAuth middleware called");
    next();
  },
}));

// Trebuie sa suprascriem functiile bcrypt
const bcryptCompareMock = jest.fn();
bcrypt.compare = bcryptCompareMock;

// eslint-disable-next-line
const app = new express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/api/users", authRouter);

process.env.TOKEN_SECRET = "secret";

describe("Auth Routes", function () {
  afterEach(() => {
    mockingoose(User).reset();
  });

  it("responds to /api/users/login", async () => {
    bcryptCompareMock.mockResolvedValue(true);
    mockingoose(User)
      .toReturn(
        {
          email: "user@example.com",
          password: "userpassword",
          subscription: "business",
        },
        "findOne"
      )
      .toReturn(
        {
          email: "user@example.com",
        },
        "findOneAndUpdate"
      );

    console.log("Mock setup complete");

    const res = await request(app)
      .post("/api/users/login")
      .send({
        email: "user@example.com",
        password: "userpassword",
      })
      .set("Content-Type", "application/json")
      .set("Accept", "application/json");

    console.log("Response received:", res.body);

    // Răspunsul trebuie să aibă status code 200.
    expect(res.statusCode).toBe(200);
    // Răspunsul trebuie să returneze un token.
    // Nu ne intereseaza valoarea efectiva a JWT-ului
    expect(res.body).toHaveProperty("token");
    // Răspunsul trebuie să returneze un obiect user cu 2 câmpuri: email si subscription, cu valori de tip String.
    expect(res.body).toHaveProperty("user");
    expect(typeof res.body.user.email).toBe("string");
    expect(["starter", "pro", "business"]).toContain(
      res.body.user.subscription
    );
  });
});
