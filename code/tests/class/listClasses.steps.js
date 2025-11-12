import { loadFeature, defineFeature } from "jest-cucumber";
import { prisma } from "../../src/lib/prisma.js";
import { context } from "../steps.context.js";
import { request } from "../steps.config.js";
import { resetDatabase } from "../utils/reset-db.js";
import * as classService from "../../src/services/class.service.js";

const feature = loadFeature("./features/listClasses.feature");

defineFeature(feature, (test) => {
  beforeEach(async () => {
    await resetDatabase();
    context.user = undefined;
    context.classes = [];
    context.response = undefined;
  });

  test("User views their enrolled classes", ({ given, and, when, then }) => {
    given(/^a user with email "(.*)" exists$/, async (email) => {
      context.user = await prisma.user.create({
        data: {
          email,
          name: "Test User",
          pronouns: "they/them",
        },
      });
    });

    // First enrollment
    and(
      /^the user is enrolled in class "(.*)" with role "(.*)"$/,
      async (className, role) => {
        const klass = await classService.createClass({
          name: className,
          quarter: "FA25",
        });
        await prisma.classRole.create({
          data: {
            userId: context.user.id,
            classId: klass.id,
            role,
          },
        });
        context.classes.push({
          name: className,
          role,
        });
      }
    );

    // Second enrollment
    and(
      /^the user is enrolled in class "(.*)" with role "(.*)"$/,
      async (className, role) => {
        const klass = await classService.createClass({
          name: className,
          quarter: "FA25",
        });
        await prisma.classRole.create({
          data: {
            userId: context.user.id,
            classId: klass.id,
            role,
          },
        });
        context.classes.push({
          name: className,
          role,
        });
      }
    );

    when("the user requests their class list", async () => {
      context.response = await request.get(
        `/classes/user/classes?userId=${context.user.id}`
      );
    });

    then(/^the response should contain (\d+) classes$/, (count) => {
      expect(context.response.body).toHaveLength(parseInt(count));
      expect(context.response.status).toBe(200);
    });

    // First assertion
    and(
      /^the response should include "(.*)" with role "(.*)"$/,
      (className, role) => {
        const found = context.response.body.find(
          (c) => c.name === className && c.role === role
        );
        expect(found).toBeDefined();
        expect(found.name).toBe(className);
        expect(found.role).toBe(role);
        expect(found.inviteCode).toBeDefined();
      }
    );

    // Second assertion
    and(
      /^the response should include "(.*)" with role "(.*)"$/,
      (className, role) => {
        const found = context.response.body.find(
          (c) => c.name === className && c.role === role
        );
        expect(found).toBeDefined();
        expect(found.name).toBe(className);
        expect(found.role).toBe(role);
        expect(found.inviteCode).toBeDefined();
      }
    );
  });

  test("User with no classes sees empty state", ({
    given,
    and,
    when,
    then,
  }) => {
    given(/^a user with email "(.*)" exists$/, async (email) => {
      context.user = await prisma.user.create({
        data: {
          email,
          name: "New User",
          pronouns: "they/them",
        },
      });
    });

    and("the user is not enrolled in any classes", () => {
      // No action needed
    });

    when("the user requests their class list", async () => {
      context.response = await request.get(
        `/classes/user/classes?userId=${context.user.id}`
      );
    });

    then("the response should be an empty array", () => {
      expect(context.response.status).toBe(200);
      expect(context.response.body).toEqual([]);
      expect(Array.isArray(context.response.body)).toBe(true);
    });
  });

  test("Missing userId parameter returns error", ({ when, then, and }) => {
    when("I request class list without userId parameter", async () => {
      context.response = await request
        .get("/classes/user/classes")
        .catch((err) => {
          // Supertest throws on 4xx/5xx by default, we need the response
          return err.response || err;
        });
    });

    then(/^the response should have status code (\d+)$/, (statusCode) => {
      expect(context.response.status).toBe(parseInt(statusCode));
    });

    and(
      /^the response should contain error message "(.*)"$/,
      (errorMessage) => {
        expect(context.response.body.error).toBe(errorMessage);
      }
    );
  });

  test("User views class list HTML page", ({ given, and, when, then }) => {
    given(/^a user with email "(.*)" exists$/, async (email) => {
      context.user = await prisma.user.create({
        data: {
          email,
          name: "HTML Test User",
          pronouns: "they/them",
        },
      });
    });

    and(
      /^the user is enrolled in class "(.*)" with role "(.*)"$/,
      async (className, role) => {
        const klass = await classService.createClass({
          name: className,
          quarter: "FA25",
        });
        await prisma.classRole.create({
          data: {
            userId: context.user.id,
            classId: klass.id,
            role,
          },
        });
      }
    );

    when("the user requests the HTML class list page", async () => {
      context.response = await request.get(
        `/classes/my-classes?userId=${context.user.id}`
      );
    });

    then("the response should contain HTML content", () => {
      expect(context.response.status).toBe(200);
      expect(context.response.text).toContain('<section class="class-list"');
      expect(context.response.text).toContain("class-card");
    });

    and(/^the HTML should display "(.*)"$/, (className) => {
      expect(context.response.text).toContain(className);
    });
  });
});
