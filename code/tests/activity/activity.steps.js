// code/tests/activity/activity.steps.js

import { loadFeature, defineFeature } from "jest-cucumber";
import { prisma } from "../../src/lib/prisma.js";
import { context } from "../steps.context.js";
import { request } from "../steps.config.js";
import { resetDatabase } from "../utils/reset-db.js";
import * as classService from "../../src/services/class.service.js";
import * as activityService from "../../src/services/activity.service.js";
import { generateToken } from "../utils/auth.test.helper.js";

const feature = loadFeature("./features/activity.feature");

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

  test("Create a student activity punch", ({ given, when, then, and }) => {
    given(
      /^a logged-in student "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        // Make sure a student exists
        context.user = await prisma.user.create({
          data: { email: email, name: name, isProf: false },
        });
        context.token = generateToken(context.user);
      }
    );

    and(
      /^a class named "(.*)" exists and includes "(.*)"$/,
      async (className, userName) => {
        context.klass = await classService.createClass({ name: className });
        await prisma.classRole.create({
          data: {
            userId: context.user.id,
            classId: context.klass.id,
            role: "STUDENT",
          },
        });
      }
    );

    and(/^a student activity category "(.*)" exists$/, async (catName) => {
      context.category = await activityService.createActivityCategory({
        name: catName,
        description: "Sessions for reviewing class material",
        role: "STUDENT",
      });
    });

    when(/^the student attempt to create a "Studying" punch$/, async () => {
      const activityData = {
        classId: context.klass.id,
        categoryId: context.category.id,
        startTime: "2025-01-01T10:00:00Z",
        endTime: "2025-01-01T11:00:00Z",
      };
      context.response = await request
        .post(`/activity`)
        .send(activityData)
        .set("Cookie", `auth_token=${context.token}`);
    });

    then(/^the student recieves a new activity punch$/, () => {
      expect(context.response.status).toBe(201);
      expect(context.response.body.categoryId).toBe(context.category.id);
      expect(context.response.body.classId).toBe(context.klass.id);
      expect(context.response.body.userId).toBe(context.user.id);
    });
  });

  test("Create a TA activity punch", ({ given, when, then, and }) => {
    given(
      /^a logged-in TA "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        // Make sure a TA exists
        context.user = await prisma.user.create({
          data: { email: email, name: name, isProf: false },
        });
        context.token = generateToken(context.user);
      }
    );

    and(
      /^a class named "(.*)" exists and includes "(.*)"$/,
      async (className, userName) => {
        context.klass = await classService.createClass({ name: className });
        await prisma.classRole.create({
          data: {
            userId: context.user.id,
            classId: context.klass.id,
            role: "TA",
          },
        });
      }
    );

    and(/^a TA activity category "(.*)" exists$/, async (catName) => {
      context.category = await activityService.createActivityCategory({
        name: catName,
        description: "Sessions for evaluating student assignments",
        role: "TA",
      });
    });

    when(/^the TA attempt to create a "Grading" punch$/, async () => {
      const activityData = {
        classId: context.klass.id,
        categoryId: context.category.id,
        startTime: "2025-01-01T10:00:00Z",
        endTime: "2025-01-01T11:00:00Z",
      };
      context.response = await request
        .post(`/activity`)
        .send(activityData)
        .set("Cookie", `auth_token=${context.token}`);
    });

    then(/^the TA recieves a new activity punch$/, () => {
      expect(context.response.status).toBe(201);
      expect(context.response.body.categoryId).toBe(context.category.id);
      expect(context.response.body.classId).toBe(context.klass.id);
      expect(context.response.body.userId).toBe(context.user.id);
    });
  });

  test("Create an all activity punch as a student", ({
    given,
    when,
    then,
    and,
  }) => {
    given(
      /^a logged-in student "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        // Make sure a student exists
        context.user = await prisma.user.create({
          data: { email: email, name: name, isProf: false },
        });
        context.token = generateToken(context.user);
      }
    );

    and(
      /^a class named "(.*)" exists and includes "(.*)"$/,
      async (className, userName) => {
        context.klass = await classService.createClass({ name: className });
        await prisma.classRole.create({
          data: {
            userId: context.user.id,
            classId: context.klass.id,
            role: "STUDENT",
          },
        });
      }
    );

    and(/^an all activity category "(.*)" exists$/, async (catName) => {
      context.category = await activityService.createActivityCategory({
        name: catName,
        description: "Sessions for attending professor talks",
        role: "ALL",
      });
    });

    when(/^the student attempt to create a "Lecture" punch$/, async () => {
      const activityData = {
        classId: context.klass.id,
        categoryId: context.category.id,
        startTime: "2025-01-01T10:00:00Z",
        endTime: "2025-01-01T11:00:00Z",
      };
      context.response = await request
        .post(`/activity`)
        .send(activityData)
        .set("Cookie", `auth_token=${context.token}`);
    });

    then(/^the student recieves a new activity punch$/, () => {
      expect(context.response.status).toBe(201);
      expect(context.response.body.categoryId).toBe(context.category.id);
      expect(context.response.body.classId).toBe(context.klass.id);
      expect(context.response.body.userId).toBe(context.user.id);
    });
  });

  test("Create an all activity punch as a TA", ({ given, when, then, and }) => {
    given(
      /^a logged-in TA "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        // Make sure a TA exists
        context.user = await prisma.user.create({
          data: { email: email, name: name, isProf: false },
        });
        context.token = generateToken(context.user);
      }
    );

    and(
      /^a class named "(.*)" exists and includes "(.*)"$/,
      async (className, userName) => {
        context.klass = await classService.createClass({ name: className });
        await prisma.classRole.create({
          data: {
            userId: context.user.id,
            classId: context.klass.id,
            role: "TA",
          },
        });
      }
    );

    and(/^an all activity category "(.*)" exists$/, async (catName) => {
      context.category = await activityService.createActivityCategory({
        name: catName,
        description: "Sessions for attending professor talks",
        role: "ALL",
      });
    });

    when(/^the TA attempt to create a "Lecture" punch$/, async () => {
      const activityData = {
        classId: context.klass.id,
        categoryId: context.category.id,
        startTime: "2025-01-01T10:00:00Z",
        endTime: "2025-01-01T11:00:00Z",
      };
      context.response = await request
        .post(`/activity`)
        .send(activityData)
        .set("Cookie", `auth_token=${context.token}`);
    });

    then(/^the TA recieves a new activity punch$/, () => {
      expect(context.response.status).toBe(201);
      expect(context.response.body.categoryId).toBe(context.category.id);
      expect(context.response.body.classId).toBe(context.klass.id);
      expect(context.response.body.userId).toBe(context.user.id);
    });
  });

  test("Get an activity punch by ID", ({ given, when, then, and }) => {
    given(
      /^a logged-in student "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        // Make sure a student exists
        context.user = await prisma.user.create({
          data: { email: email, name: name, isProf: false },
        });
        context.token = generateToken(context.user);
      }
    );

    and(
      /^a class named "(.*)" exists and includes "(.*)"$/,
      async (className, userName) => {
        context.klass = await classService.createClass({ name: className });
        await prisma.classRole.create({
          data: {
            userId: context.user.id,
            classId: context.klass.id,
            role: "STUDENT",
          },
        });
      }
    );

    and(/^a student activity category "(.*)" exists$/, async (catName) => {
      context.category = await activityService.createActivityCategory({
        name: catName,
        description: "Sessions for reviewing class material",
        role: "STUDENT",
      });
    });

    and(
      /^an activity punch for "Studying" exists and belongs to "Bob Student"$/,
      async () => {
        const activityData = {
          classId: context.klass.id,
          categoryId: context.category.id,
          userId: context.user.id,
          startTime: "2025-01-01T10:00:00Z",
          endTime: "2025-01-01T11:00:00Z",
        };
        context.activity = await activityService.createActivity(activityData);
      }
    );

    when(
      /^the student attempts to get an activity punch with ID$/,
      async () => {
        context.response = await request
          .get(`/activity/${context.activity.id}`)
          .set("Cookie", `auth_token=${context.token}`);
      }
    );

    then(/^the student recieives the "Studying" activity punch$/, () => {
      expect(context.response.status).toBe(200);
      expect(context.response.body.categoryId).toBe(context.category.id);
      expect(context.response.body.classId).toBe(context.klass.id);
      expect(context.response.body.userId).toBe(context.user.id);
    });
  });

  test("Get all activities from a student", ({ given, when, then, and }) => {
    given(
      /^a logged-in student "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        // Make sure a student exists
        context.user = await prisma.user.create({
          data: { email: email, name: name, isProf: false },
        });
        context.token = generateToken(context.user);
      }
    );

    and(
      /^a class named "(.*)" exists and includes "(.*)"$/,
      async (className, userName) => {
        context.klass = await classService.createClass({ name: className });
        await prisma.classRole.create({
          data: {
            userId: context.user.id,
            classId: context.klass.id,
            role: "STUDENT",
          },
        });
      }
    );

    and(/^a student activity category "(.*)" exists$/, async (catName) => {
      context.category = await activityService.createActivityCategory({
        name: catName,
        description: "Sessions for reviewing class material",
        role: "STUDENT",
      });
    });

    and(/^a student activity category "(.*)" exists$/, async (catName) => {
      context.category2 = await activityService.createActivityCategory({
        name: catName,
        description: "Sessions for listening to professor talks",
        role: "ALL",
      });
    });

    and(
      /^an activity punch for "Studying" exists and belongs to "Bob Student"$/,
      async () => {
        const activityData = {
          classId: context.klass.id,
          categoryId: context.category.id,
          userId: context.user.id,
          startTime: "2025-01-01T10:00:00Z",
          endTime: "2025-01-01T11:00:00Z",
        };
        context.activity = await activityService.createActivity(activityData);
      }
    );

    and(
      /^an activity punch for "Lecture" exists and belongs to "Bob Student"$/,
      async () => {
        const activityData = {
          classId: context.klass.id,
          categoryId: context.category2.id,
          userId: context.user.id,
          startTime: "2025-01-01T10:00:00Z",
          endTime: "2025-01-01T11:00:00Z",
        };
        context.activity2 = await activityService.createActivity(activityData);
      }
    );

    when(/^the student attempts to get all of their activities$/, async () => {
      context.response = await request
        .get(`/activity/user`)
        .set("Cookie", `auth_token=${context.token}`)
        .set("Accept", "application/json");
    });

    then(
      /^the student recieives the "Studying" and "Lecture" activity punch$/,
      () => {
        expect(context.response.status).toBe(200);
        expect(context.response.body[0].categoryId).toBe(context.category.id);
        expect(context.response.body[0].classId).toBe(context.klass.id);
        expect(context.response.body[0].userId).toBe(context.user.id);
        expect(context.response.body[1].categoryId).toBe(context.category2.id);
        expect(context.response.body[1].classId).toBe(context.klass.id);
        expect(context.response.body[1].userId).toBe(context.user.id);
      }
    );
  });

  test("Update an activity punch", ({ given, when, then, and }) => {
    given(
      /^a logged-in student "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        // Make sure a student exists
        context.user = await prisma.user.create({
          data: { email: email, name: name, isProf: false },
        });
        context.token = generateToken(context.user);
      }
    );

    and(
      /^a class named "(.*)" exists and includes "(.*)"$/,
      async (className, userName) => {
        context.klass = await classService.createClass({ name: className });
        await prisma.classRole.create({
          data: {
            userId: context.user.id,
            classId: context.klass.id,
            role: "STUDENT",
          },
        });
      }
    );

    and(/^a student activity category "(.*)" exists$/, async (catName) => {
      context.category = await activityService.createActivityCategory({
        name: catName,
        description: "Sessions for reviewing class material",
        role: "STUDENT",
      });
    });

    and(/^a student activity category "(.*)" exists$/, async (catName) => {
      context.category2 = await activityService.createActivityCategory({
        name: catName,
        description: "Sessions for listening to professor talks",
        role: "ALL",
      });
    });

    and(
      /^an activity punch for "Studying" exists and belongs to "Bob Student"$/,
      async () => {
        const activityData = {
          classId: context.klass.id,
          categoryId: context.category.id,
          userId: context.user.id,
          startTime: "2025-01-01T10:00:00Z",
          endTime: "2025-01-01T11:00:00Z",
        };
        context.activity = await activityService.createActivity(activityData);
      }
    );

    when(
      /^the student tries to update the category to "Lecture"$/,
      async () => {
        const activityData = {
          classId: context.klass.id,
          categoryId: context.category2.id,
          startTime: "2025-01-01T10:00:00Z",
          endTime: "2025-01-01T11:00:00Z",
        };
        context.response = await request
          .put(`/activity/${context.activity.id}`)
          .send(activityData)
          .set("Cookie", `auth_token=${context.token}`);
      }
    );

    then(/^the student recieves a "Lecture" activity punch$/, () => {
      expect(context.response.status).toBe(201);
      expect(context.response.body.categoryId).toBe(context.category2.id);
      expect(context.response.body.classId).toBe(context.klass.id);
      expect(context.response.body.userId).toBe(context.user.id);
    });
  });

  test("Delete an activity punch", ({ given, when, then, and }) => {
    given(
      /^a logged-in student "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        // Make sure a student exists
        context.user = await prisma.user.create({
          data: { email: email, name: name, isProf: false },
        });
        context.token = generateToken(context.user);
      }
    );

    and(
      /^a class named "(.*)" exists and includes "(.*)"$/,
      async (className, userName) => {
        context.klass = await classService.createClass({ name: className });
        await prisma.classRole.create({
          data: {
            userId: context.user.id,
            classId: context.klass.id,
            role: "STUDENT",
          },
        });
      }
    );

    and(/^a student activity category "(.*)" exists$/, async (catName) => {
      context.category = await activityService.createActivityCategory({
        name: catName,
        description: "Sessions for reviewing class material",
        role: "STUDENT",
      });
    });

    and(
      /^an activity punch for "Studying" exists and belongs to "Bob Student"$/,
      async () => {
        const activityData = {
          classId: context.klass.id,
          categoryId: context.category.id,
          userId: context.user.id,
          startTime: "2025-01-01T10:00:00Z",
          endTime: "2025-01-01T11:00:00Z",
        };
        context.activity = await activityService.createActivity(activityData);
      }
    );

    when(/^the student deletes the activity punch$/, async () => {
      context.response = await request
        .delete(`/activity/${context.activity.id}`)
        .set("Cookie", `auth_token=${context.token}`);
    });

    then(/^the student receivies no activity punch$/, () => {
      expect(context.response.status).toBe(204);
      expect(context.response.text).toBe("");
    });
  });
});
