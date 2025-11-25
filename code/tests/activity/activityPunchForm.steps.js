// code/tests/activity/activity.steps.js

import { loadFeature, defineFeature } from "jest-cucumber";
import { prisma } from "../../src/lib/prisma.js";
import { context } from "../steps.context.js";
import { request } from "../steps.config.js";
import { resetDatabase } from "../utils/reset-db.js";
import * as classService from "../../src/services/class.service.js";
import * as activityService from "../../src/services/activity.service.js";
import { generateToken } from "../utils/auth.test.helper.js";

const feature = loadFeature("./features/activityPunchForm.feature");

defineFeature(feature, (test) => {
  beforeEach(async () => {
    await resetDatabase();
    context.klass = undefined;
    context.response = undefined;
    context.response2 = undefined;
    context.user = undefined;
    context.token = undefined;
    context.category = undefined;
    context.category2 = undefined;
    context.activtiy = undefined;
    context.activity2 = undefined;
  });

  test("Open new activity punch form", ({ given, when, then }) => {
    given(/^a logged-in student "(.*)" with email "(.*)" exists$/, async (userName, email) => {
        context.user = await prisma.user.create({
            data: {
                email: email,
                name: userName,
                isProf: false,
            }
        });
    });

    when(/^the student attempts to open the new activity punch form$/, async () => {
        const token = generateToken(context.user);
        context.response = await request
            .get("/activity/new-modal")
            .set("Cookie", `auth_token=${token}`);
    });

    then(/^the page should show a form to create a new activity punch$/, async () => {
        expect(context.response.status).toBe(201);
        expect(context.response.text).toContain('<h2>Create New Activity</h2>');
        expect(context.response.text).toContain('<div id="activity-fields">');
        expect(context.response.text).toContain('<div class="punchcard__modal-content">');
    });
  });

  test("Close activity punch form", ({ given, when, then }) => {
    given(/^a logged-in student "(.*)" with email "(.*)" exists$/, async (userName, email) => {
        context.user = await prisma.user.create({
            data: {
                email: email,
                name: userName,
                isProf: false,
            }
        });
    });

    when(/^the student attempts to close the new activity punch form$/, async () => {
        const token = generateToken(context.user);
        context.response = await request
            .get("/activity/close-form")
            .set("Cookie", `auth_token=${token}`);
    });

    then(/^the page should disable the activity punch form$/, async () => {
        expect(context.response.status).toBe(201);
        expect(context.response.text).toContain('');
    });
  });

  test("Open edit activity punch form", ({ given, and, when, then }) => {
    given(/^a logged-in student "(.*)" with email "(.*)" exists$/, async (userName, email) => {
        context.user = await prisma.user.create({
            data: {
                email: email,
                name: userName,
                isProf: false,
            }
        });
    });

    and(/^a class named "(.*)" exists and includes "(.*)"$/, async (className, userName) => {
        context.klass = await classService.createClass({ name: className });
        await prisma.classRole.create({
        data: {
            userId: context.user.id,
            classId: context.klass.id,
            role: "STUDENT"
        }
        });
    });

    and(/^an activity punch for "(.*)" exists and belongs to "John Student"$/, async (catName) => {
        context.category = await activityService.createActivityCategory({ 
            name: catName,
            description: "Sessions for reviewing class material",
            role: "STUDENT",
        });

        const activityData = {
            classId: context.klass.id,
            categoryId: context.category.id,
            userId: context.user.id,
            startTime: "2025-01-01T10:00:00Z",
            endTime: "2025-01-01T11:00:00Z",
        };
        context.activity = await activityService.createActivity(activityData);
    });

    when(/^the student attempts to open the edit activity punch form$/, async () => {
        const token = generateToken(context.user);
        context.response = await request
            .get(`/activity/edit-modal?punchSelect=${context.activity.id}`)
            .set("Cookie", `auth_token=${token}`);
    });

    then(/^the page should show a form to edit an activity punch$/, async () => {
        expect(context.response.status).toBe(201);
        expect(context.response.text).toContain('<h2>Edit Activity</h2>');
        expect(context.response.text).toContain(`<form hx-put="/activity/${context.activity.id}" hx-target="#punch-details" hx-swap="innerHTML">`);
        expect(context.response.text).toContain('<div id="activity-fields">');
    });
  });

  test("Render punch card", ({given, and, when, then}) => {
    given(/^a logged-in student "(.*)" with email "(.*)" exists$/, async (userName, email) => {
        context.user = await prisma.user.create({
            data: {
                email: email,
                name: userName,
                isProf: false,
            }
        });
    });

    when(/^the student visits their profile page$/, async () => {
        const token = generateToken(context.user);
        context.response = await request
            .get(`/users/profile`)
            .set("hx-request", "true")
            .set("Cookie", `auth_token=${token}`);

        context.response2 = await request
            .get(`/activity/user/render`)
            .set("Cookie", `auth_token=${token}`);
    });

    then(/^the page should show a punch card component$/, async () =>{
        expect(context.response.status).toBe(200);
        expect(context.response.text).toContain('id="punchcard-container"');

        expect(context.response2.status).toBe(201);
        expect(context.response2.text).toContain('<h3 class="punchcard__title">Activity Punch Card</h3>');
        expect(context.response2.text).toContain('<div class="punchcard__buttons">');
    });
  });

  test("Render punch card dropdown", ({ given, and, when, then }) => {
    given(/^a logged-in student "(.*)" with email "(.*)" exists$/, async (userName, email) => {
        context.user = await prisma.user.create({
            data: {
                email: email,
                name: userName,
                isProf: false,
            }
        });
    });

    and(/^a class named "(.*)" exists and includes "(.*)"$/, async (className, userName) => {
        context.klass = await classService.createClass({ name: className });
        await prisma.classRole.create({
        data: {
            userId: context.user.id,
            classId: context.klass.id,
            role: "STUDENT"
        }
        });
    });

    and(/^an activity punch for "(.*)" exists and belongs to "John Student"$/, async (catName) => {
        context.category = await activityService.createActivityCategory({ 
            name: catName,
            description: "Sessions for reviewing class material",
            role: "STUDENT",
        });

        const activityData = {
            classId: context.klass.id,
            categoryId: context.category.id,
            userId: context.user.id,
            startTime: "2025-01-01T10:00:00Z",
            endTime: "2025-01-01T11:00:00Z",
        };
        context.activity = await activityService.createActivity(activityData);
    });

    when(/^the student looks at the punch card on their profile page$/, async () => {
        const token = generateToken(context.user);
        context.response = await request
            .get(`/activity/user/dropdown`)
            .set("Cookie", `auth_token=${token}`);
    });

    then(/^the page should show a drop down of their activity punches$/, async () =>{
        expect(context.response.status).toBe(201);
        expect(context.response.text).toContain(`<option value="${context.activity.id}">`);
        expect(context.response.text).toContain(`- ${context.klass.name} -`);
    });
  });

  test("Render activity details", ({ given, and, when, then }) => {
    given(/^a logged-in student "(.*)" with email "(.*)" exists$/, async (userName, email) => {
        context.user = await prisma.user.create({
            data: {
                email: email,
                name: userName,
                isProf: false,
            }
        });
    });

    and(/^a class named "(.*)" exists and includes "(.*)"$/, async (className, userName) => {
        context.klass = await classService.createClass({ name: className });
        await prisma.classRole.create({
        data: {
            userId: context.user.id,
            classId: context.klass.id,
            role: "STUDENT"
        }
        });
    });

    and(/^an activity punch for "(.*)" exists and belongs to "John Student"$/, async (catName) => {
        context.category = await activityService.createActivityCategory({ 
            name: catName,
            description: "Sessions for reviewing class material",
            role: "STUDENT",
        });

        const activityData = {
            classId: context.klass.id,
            categoryId: context.category.id,
            userId: context.user.id,
            startTime: "2025-01-01T10:00:00Z",
            endTime: "2025-01-01T11:00:00Z",
        };
        context.activity = await activityService.createActivity(activityData);
    });

    when(/^the student selects the punch on their punch card$/, async () => {
        const token = generateToken(context.user);
        context.response = await request
            .get(`/activity/details?punchSelect=${context.activity.id}`)
            .set("Cookie", `auth_token=${token}`);
    });

    then(/^the page should show the details of the "Studying" punch$/, async () =>{
        expect(context.response.status).toBe(201);
        expect(context.response.text).toContain(`<div class="punchcard__value">${context.category.name}</div>`);
        expect(context.response.text).toContain(`<strong class="punchcard__label">Punch In Time</strong>`);
    });
  });

  test("Load create or edit activity fields", ({ given, and, when, then }) => {
    given(/^a logged-in student "(.*)" with email "(.*)" exists$/, async (userName, email) => {
        context.user = await prisma.user.create({
            data: {
                email: email,
                name: userName,
                isProf: false,
            }
        });
    });

    and(/^a class named "(.*)" exists and includes "(.*)"$/, async (className, userName) => {
        context.klass = await classService.createClass({ name: className });
        await prisma.classRole.create({
        data: {
            userId: context.user.id,
            classId: context.klass.id,
            role: "STUDENT"
        }
        });
    });

    and(/^a student activity category for "(.*)" exists$/, async (catName) => {
        context.category = await activityService.createActivityCategory({ 
            name: catName,
            description: "Sessions for reviewing class material",
            role: "STUDENT",
        });
    });

    when(/^the student opens the punch card form$/, async () => {
        const token = generateToken(context.user);
        context.response = await request
            .get(`/activity/load-fields?classId=${context.klass.id}`)
            .set("Cookie", `auth_token=${token}`);
    });

    then(/^the page should show options for making an activity punch$/, async () =>{
        expect(context.response.status).toBe(201);
        expect(context.response.text).toContain(`<div id="activity-fields">`);
        expect(context.response.text).toContain(`<option value="${context.category.id}">${context.category.name}</option>`);
    });
  });
});
