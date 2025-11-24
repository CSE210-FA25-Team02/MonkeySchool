// code/tests/authorization.steps.js

import { loadFeature, defineFeature } from "jest-cucumber";
import { prisma } from "../../src/lib/prisma.js";
import { context } from "../steps.context.js";
import { request } from "../steps.config.js";
import { resetDatabase } from "../utils/reset-db.js";
import * as classService from "../../src/services/class.service.js";
import * as userService from "../../src/services/user.service.js";
import * as authService from "../../src/services/auth.service.js";
import * as classRoleService from "../../src/services/classRole.service.js";

const feature = loadFeature("./features/authorization.feature");

defineFeature(feature, (test) => {
  let user, authToken;

  beforeEach(async () => {
    await resetDatabase();
    user = undefined;
    authToken = undefined;
    context.klass = undefined;
    context.response = undefined;
  });

  async function createUserWithRole(role, className, quarter) {
    user = await userService.createUser({
      email: "test@ucsd.edu",
      name: "Test User",
    });
    context.klass = await classService.createClass({
      name: className,
      quarter: quarter,
    });
    await classRoleService.upsertClassRole({
      userId: user.id,
      classId: context.klass.id,
      role: role,
    });
    authToken = authService.generateToken({ id: user.id });
  }

  test("A user with the correct role and quarter can access the resource", ({
    given,
    when,
    then,
  }) => {
    given(
      /^a user with the role "(.*)" for the class "(.*)" in the "(.*)" quarter$/,
      async (role, className, quarter) => {
        await createUserWithRole(role, className, quarter);
      }
    );

    when(
      /^the user tries to access the class "(.*)" in the "(.*)" quarter$/,
      async (className, quarter) => {
        context.response = await request
          .get(`/${quarter}/classes/${context.klass.id}`)
          .set("Cookie", `auth_token=${authToken}`);
      }
    );

    then("the user should be able to access the resource", () => {
      expect(context.response.status).toBe(200);
    });
  });

  test("A user with the wrong role cannot access the resource", ({
    given,
    when,
    then,
  }) => {
    given(
      /^a user with the role "(.*)" for the class "(.*)" in the "(.*)" quarter$/,
      async (role, className, quarter) => {
        await createUserWithRole(role, className, quarter);
      }
    );

    when(
      /^the user tries to update the class "(.*)" in the "(.*)" quarter$/,
      async (className, quarter) => {
        context.response = await request
          .put(`/${quarter}/classes/${context.klass.id}`)
          .set("Cookie", `auth_token=${authToken}`)
          .send({ name: "New Name" });
      }
    );

    then("the user should not be able to access the resource", () => {
      expect(context.response.status).toBe(403);
    });
  });

  test("A user with a role in a different quarter for the same class cannot update the resource", ({
    given,
    and,
    when,
    then,
  }) => {
    let class1, class2;
    given(
      /^a user with the role "(.*)" for the class "(.*)" in the "(.*)" quarter$/,
      async (role, className, quarter) => {
        user = await userService.createUser({
          email: "test@ucsd.edu",
          name: "Test User",
        });
        class1 = await classService.createClass({
          name: className,
          quarter: quarter,
        });
        await classRoleService.upsertClassRole({
          userId: user.id,
          classId: class1.id,
          role: role,
        });
        authToken = authService.generateToken({ id: user.id });
      }
    );

    and(
      /^the user has the role "(.*)" for the class "(.*)" in the "(.*)" quarter$/,
      async (role, className, quarter) => {
        class2 = await classService.createClass({
          name: className,
          quarter: quarter,
        });
        await classRoleService.upsertClassRole({
          userId: user.id,
          classId: class2.id,
          role: role,
        });
      }
    );

    when(
      /^the user tries to update the class "(.*)" in the "(.*)" quarter$/,
      async (className, quarter) => {
        context.response = await request
          .put(`/${quarter}/classes/${class1.id}`)
          .set("Cookie", `auth_token=${authToken}`)
          .send({ name: "New Class Name" });
      }
    );

    then("the user should not be able to access the resource", () => {
      expect(context.response.status).toBe(403);
    });
  });

  test("A user with the correct role but the wrong quarter cannot access the resource", ({
    given,
    when,
    then,
  }) => {
    given(
      /^a user with the role "(.*)" for the class "(.*)" in the "(.*)" quarter$/,
      async (role, className, quarter) => {
        await createUserWithRole(role, className, quarter);
      }
    );

    when(
      /^the user tries to access the class "(.*)" in the "(.*)" quarter$/,
      async (className, quarter) => {
        context.response = await request
          .get(`/${quarter}/classes/${context.klass.id}`)
          .set("Cookie", `auth_token=${authToken}`);
      }
    );

    then("the user should not be able to access the resource", () => {
      expect(context.response.status).toBe(403);
    });
  });

  test("A user who is not logged in cannot access the resource", ({
    given,
    when,
    then,
  }) => {
    given("a user is not logged in", () => {
      // No user created
    });

    when(
      /^the user tries to access the class "(.*)" in the "(.*)" quarter$/,
      async (className, quarter) => {
        context.klass = await classService.createClass({
          name: className,
          quarter: quarter,
        });
        context.response = await request.get(
          `/${quarter}/classes/${context.klass.id}`
        );
      }
    );

    then("the user should not be able to access the resource", () => {
      expect(context.response.status).toBe(401);
    });
  });

  test("A user who is not enrolled in the class cannot access the resource", ({
    given,
    and,
    when,
    then,
  }) => {
    given("a user is logged in", async () => {
      user = await userService.createUser({
        email: "test@ucsd.edu",
        name: "Test User",
      });
      authToken = authService.generateToken({ id: user.id });
    });

    and(
      /^a class "(.*)" exists in the "(.*)" quarter$/,
      async (className, quarter) => {
        context.klass = await classService.createClass({
          name: className,
          quarter: quarter,
        });
      }
    );

    when(
      /^the user tries to access the class "(.*)" in the "(.*)" quarter$/,
      async (className, quarter) => {
        context.response = await request
          .get(`/${quarter}/classes/${context.klass.id}`)
          .set("Cookie", `auth_token=${authToken}`);
      }
    );

    then("the user should not be able to access the resource", () => {
      expect(context.response.status).toBe(403);
    });
  });
});
