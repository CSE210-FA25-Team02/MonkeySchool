// code/tests/class/class.steps.js

import { loadFeature, defineFeature } from "jest-cucumber";
import { prisma } from "../../src/lib/prisma.js";
import { context } from "../steps.context.js";
import { request } from "../steps.config.js";
import { resetDatabase } from "../utils/reset-db.js";
import * as classService from "../../src/services/class.service.js";
import { generateToken } from "../utils/auth.test.helper.js";

const feature = loadFeature("./features/class.feature");

defineFeature(feature, (test) => {
  beforeEach(async () => {
    await resetDatabase();
    context.klass = undefined;
    context.response = undefined;
    context.user = undefined;
  });

  test("Create a new class", ({ when, then, and }) => {
    when(/^I create a class named "(.*)"$/, async (name) => {
      // Ensure request is authenticated as a professor
      context.user = await prisma.user.create({
        data: { email: "prof@ucsd.edu", name: "Prof User", isProf: true },
      });
      const token = generateToken(context.user);
      context.response = await request
        .post("/classes/create")
        .set("Cookie", `auth_token=${token}`)
        .send({ name });
      context.klass = context.response.body;
    });

    then(/^a class named "(.*)" should exist$/, async (name) => {
      const klass = await prisma.class.findFirst({ where: { name } });
      expect(klass).not.toBeNull();
    });

    and("the class should have an auto-generated invite code", () => {
      expect(context.klass.inviteCode).toBeDefined();
      expect(context.klass.inviteCode.length).toBe(8);
    });
  });

  test("Update class name", ({ given, when, then }) => {
    given(/^a class named "(.*)" exists$/, async (name) => {
      // Create a user for authentication
      context.user = await prisma.user.create({
        data: { email: "prof@ucsd.edu", name: "Prof User", isProf: true },
      });
      context.klass = await classService.createClass({ name });
    });

    when(/^I rename the class "(.*)" to "(.*)"$/, async (_, newName) => {
      const token = generateToken(context.user);
      await request
        .put(`/classes/${context.klass.id}`)
        .set("Cookie", `auth_token=${token}`)
        .send({ name: newName });
    });

    then(/^a class named "(.*)" should exist$/, async (newName) => {
      const klass = await prisma.class.findFirst({ where: { name: newName } });
      expect(klass).not.toBeNull();
    });
  });

  test("Delete a class", ({ given, when, then }) => {
    given(/^a class named "(.*)" exists$/, async (name) => {
      // Create a user for authentication
      context.user = await prisma.user.create({
        data: { email: "prof@ucsd.edu", name: "Prof User", isProf: true },
      });
      context.klass = await classService.createClass({ name });
    });

    when(/^I delete the class "(.*)"$/, async () => {
      const token = generateToken(context.user);
      await request
        .delete(`/classes/${context.klass.id}`)
        .set("Cookie", `auth_token=${token}`);
    });

    then(/^no class named "(.*)" should exist$/, async (name) => {
      const klass = await prisma.class.findFirst({ where: { name } });
      expect(klass).toBeNull();
    });
  });
});
