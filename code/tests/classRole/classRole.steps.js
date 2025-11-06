import { loadFeature, defineFeature } from "jest-cucumber";
import { prisma } from "../../src/lib/prisma.js";
import { context } from "../steps.context.js";
import { request } from "../steps.config.js";
import { resetDatabase } from "../utils/reset-db.js";
import * as userService from "../../src/services/user.service.js";
import * as classService from "../../src/services/class.service.js";

const feature = loadFeature("./features/classRole.feature");

defineFeature(feature, (test) => {
  beforeEach(async () => {
    await resetDatabase();
    context.user = undefined;
    context.klass = undefined;
  });

  test("Assign a user to a class with a role", ({ given, when, then }) => {
    given(/^a user "(.*)" exists$/, async (email) => {
      context.user = await userService.createUser({ name: "User", email });
    });

    given(/^a class named "(.*)" exists$/, async (name) => {
      context.klass = await classService.createClass({ name });
    });

    when(/^I assign "(.*)" to "(.*)" as "(.*)"$/, async (_, __, role) => {
      await request.post("/api/classRoles/assign").send({
        userId: context.user.id,
        classId: context.klass.id,
        role,
      });
    });

    then(/^"(.*)" should have role "(.*)" in "(.*)"$/, async (_, role) => {
      const cr = await prisma.classRole.findUnique({
        where: { user_class_unique: { userId: context.user.id, classId: context.klass.id } },
      });
      expect(cr.role).toBe(role.toUpperCase());
    });
  });

  test("Change a user's role in a class", ({ given, when, then }) => {
    given(/^"(.*)" is a "(.*)" in "(.*)"$/, async (email, role, className) => {
      context.user = await userService.createUser({ name: "U", email });
      context.klass = await classService.createClass({ name: className });

      await prisma.classRole.create({
        data: {
          userId: context.user.id,
          classId: context.klass.id,
          role: role.toUpperCase(),
        },
      });
    });

    when(/^I change the role to "(.*)"$/, async (newRole) => {
      await request.post("/api/classRoles/assign").send({
        userId: context.user.id,
        classId: context.klass.id,
        role: newRole,
      });
    });

    then(/^"(.*)" should have role "(.*)" in "(.*)"$/, async (_, newRole) => {
      const cr = await prisma.classRole.findUnique({
        where: { user_class_unique: { userId: context.user.id, classId: context.klass.id } },
      });
      expect(cr.role).toBe(newRole.toUpperCase());
    });
  });

  test("Remove a user from a class", ({ given, when, then }) => {
    given(/^"(.*)" is a member of "(.*)"$/, async (email, className) => {
      context.user = await userService.createUser({ name: "U", email });
      context.klass = await classService.createClass({ name: className });

      await prisma.classRole.create({
        data: {
          userId: context.user.id,
          classId: context.klass.id,
          role: "STUDENT",
        },
      });
    });

    when(/^I remove the user from the class$/, async () => {
      await request.post("/api/classRoles/remove").send({
        userId: context.user.id,
        classId: context.klass.id,
      });
    });

    then(/^"(.*)" should not belong to "(.*)"$/, async () => {
      const cr = await prisma.classRole.findFirst({
        where: { userId: context.user.id, classId: context.klass.id },
      });
      expect(cr).toBeNull();
    });
  });
});
