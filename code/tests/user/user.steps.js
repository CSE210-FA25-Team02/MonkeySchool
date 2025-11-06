import { loadFeature, defineFeature } from "jest-cucumber";
import { prisma } from "../../src/lib/prisma.js";
import { context } from "../steps.context.js";
import { request } from "../steps.config.js";
import { resetDatabase } from "../utils/reset-db.js";
import * as userService from "../../src/services/user.service.js";

const feature = loadFeature("./features/user.feature");

defineFeature(feature, (test) => {
  beforeEach(async () => {
    await resetDatabase();
    context.user = undefined;
  });

  test("Create a new user", ({ given, when, then, and }) => {
    given(/^no user exists with email "(.*)"$/, async (email) => {
      await prisma.user.deleteMany({ where: { email } });
    });

    when(/^I create a user with name "(.*)" and email "(.*)"$/, async (name, email) => {
      context.response = await request.post("/api/users").send({ name, email });
    });

    then(/^a user with email "(.*)" should exist$/, async (email) => {
      context.user = await prisma.user.findUnique({ where: { email } });
      expect(context.user).not.toBeNull();
    });

    and(/^the user name should be "(.*)"$/, (name) => {
      expect(context.user.name).toBe(name);
    });
  });

  test("Update a user's name", ({ given, when, then }) => {
    given(/^a user with name "(.*)" and email "(.*)" exists$/, async (name, email) => {
      context.user = await userService.createUser({ name, email });
    });

    when(/^I update the user "(.*)" name to "(.*)"$/, async (_, newName) => {
      await request.put(`/api/users/${context.user.id}`).send({ name: newName });
    });

    then(/^the user name should be "(.*)"$/, async (newName) => {
      const updated = await prisma.user.findUnique({ where: { id: context.user.id } });
      expect(updated.name).toBe(newName);
    });
  });

  test("Delete a user", ({ given, when, then }) => {
    given(/^a user with email "(.*)" exists$/, async (email) => {
      context.user = await userService.createUser({ name: "Temp", email });
    });

    when(/^I delete the user with email "(.*)"$/, async () => {
      await request.delete(`/api/users/${context.user.id}`);
    });

    then(/^no user with email "(.*)" should exist$/, async () => {
      const user = await prisma.user.findUnique({ where: { email: context.user.email } });
      expect(user).toBeNull();
    });
  });
});
