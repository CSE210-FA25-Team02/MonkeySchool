// code/tests/class/classCreateForm.steps.js

import { loadFeature, defineFeature } from "jest-cucumber";
import { prisma } from "../../src/lib/prisma.js";
import { context } from "../steps.context.js";
import { request } from "../steps.config.js";
import { resetDatabase } from "../utils/reset-db.js";
import * as classService from "../../src/services/class.service.js";
import { generateToken } from "../utils/auth.test.helper.js";

const feature = loadFeature("./features/classCreateForm.feature");

defineFeature(feature, (test) => {
  beforeEach(async () => {
    await resetDatabase();
    context.klass = undefined;
    context.response = undefined;
    context.user = undefined;
    context.token = undefined;
  });

  test("Professor opens the create class form", ({ given, when, then }) => {
    given(/^a logged-in professor user exists$/, async () => {
        context.user = await prisma.user.create({
            data: {
                email: "professor@university.edu",
                name: "Test Professor",
                isProf: true,
            }
        });
    });

    when(/^the professor opens the create class form modal$/, async () => {
        const token = generateToken(context.user);
        context.response = await request
            .get("/classes/form")
            .set("Cookie", `auth_token=${token}`);
    });

    then(/^the page should show a form to create a class$/, async () => {
        expect(context.response.status).toBe(201);
        expect(context.response.text).toContain('<div class="classes-modal">');
        expect(context.response.text).toContain('<div class="classes-modal__actions">');
        expect(context.response.text).toContain('<section id="modal" class="classes-modal__overlay">');
    });
  });

  test("Professor closes the class creation form", ({ given, and, when, then }) => {
    given(/^a logged-in professor user exists$/, async () => {
        context.user = await prisma.user.create({
            data: {
                email: "professor@university.edu",
                name: "Test Professor",
                isProf: true,
            }
        });
    });

    and(/^the professor opens the create class form modal$/, async () => {
        context.token = generateToken(context.user);
        await request
            .get("/classes/form")
            .set("Cookie", `auth_token=${context.token}`);
    });

    when(/^the professor requests to close the class creation form$/, async () => {
        context.response = await request
            .get("/classes/close-form")
            .set("Cookie", `auth_token=${context.token}`);
    });

    then(/^an empty form container should be returned$/, async () => {
        expect(context.response.status).toBe(201);
        expect(context.response.text).toContain("");
    });
  });

  test("A student cannot open the create class form", ({ given, when, then }) => {
    given(/^a logged-in student user exists$/, async () => {
        context.user = await prisma.user.create({
            data: {
                email: "student@university.edu",
                name: "Test student",
                isProf: false,
            }
        });
    });

    when(/^the student attempts to open the create class form modal$/, async () => {
        const token = generateToken(context.user);
        context.response = await request
            .get("/classes/form")
            .set("Cookie", `auth_token=${token}`);
    });

    then(/^the system should deny access$/, async () => {
        expect(context.response.status).toBe(401);
        expect(context.response.text).toContain("Unauthorized to create class.");
    });
  });


  test("Unauthenticated user cannot open the create class form", ({ given, when, then }) => {
    given("no user is logged in", () => {
        context.user = null;
    });

    when("the user tries to open the create class form modal", async () => {
        context.response = await request
        .get("/classes/form")
        .set("Accept", "application/json");
    });

    then("they should be redirected to login", () => {
        expect(context.response.status).toBe(401);
        const body = JSON.parse(context.response.text);
        expect(body.error).toBe("User not found");
    });
  });
});