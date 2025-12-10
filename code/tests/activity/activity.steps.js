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
    context.otherUser = undefined;
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
    );

    when(
      /^the student attempts to get an activity punch with ID$/,
      async () => {
        context.response = await request
          .get(`/activity/${context.activity.id}`)
          .set("Cookie", `auth_token=${context.token}`);
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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
      },
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

  test("Quick punch-in creates an activity for a student", ({
    given,
    when,
    then,
    and,
  }) => {
    given(
      /^a logged-in student "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.user = await prisma.user.create({
          data: { email, name, isProf: false },
        });
        context.token = generateToken(context.user);
      },
    );

    and(
      /^a class named "(.*)" exists and includes "(.*)"$/,
      async (className) => {
        context.klass = await classService.createClass({ name: className });
        await prisma.classRole.create({
          data: {
            userId: context.user.id,
            classId: context.klass.id,
            role: "STUDENT",
          },
        });
      },
    );

    when(/^the student performs a quick punch for "Lecture"$/, async () => {
      context.response = await request
        .post(`/activity/quick-punch`)
        .send({ classId: context.klass.id })
        .set("Cookie", `auth_token=${context.token}`);
    });

    then(/^a new activity punch is created for the student$/, () => {
      expect(context.response.status).toBe(201);
      expect(context.response.body.classId).toBe(context.klass.id);
      expect(context.response.body.userId).toBe(context.user.id);
    });
  });

  test("Quick punch-in fails if no valid class relationship exists", ({
    given,
    when,
    then,
  }) => {
    given(
      /^a logged-in student "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.user = await prisma.user.create({
          data: { email, name, isProf: false },
        });
        context.token = generateToken(context.user);
      },
    );

    when(
      /^the student performs a quick punch for "Lecture" in unknown class$/,
      async () => {
        context.response = await request
          .post(`/activity/quick-punch`)
          .send({ classId: 999999 })
          .set("Cookie", `auth_token=${context.token}`);
      },
    );

    then(/^the student receives an unauthorized activity response$/, () => {
      expect(context.response.status).toBe(500);
    });
  });

  test("Student cannot use a TA-only category", ({
    given,
    when,
    then,
    and,
  }) => {
    given(
      /^a logged-in student "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.user = await prisma.user.create({
          data: { email, name, isProf: false },
        });
        context.token = generateToken(context.user);
      },
    );

    and(
      /^a class named "(.*)" exists and includes "(.*)"$/,
      async (className) => {
        context.klass = await classService.createClass({ name: className });
        await prisma.classRole.create({
          data: {
            userId: context.user.id,
            classId: context.klass.id,
            role: "STUDENT",
          },
        });
      },
    );

    and(/^a TA activity category "(.*)" exists$/, async (catName) => {
      context.category = await activityService.createActivityCategory({
        name: catName,
        description: "TA-only work",
        role: "TA",
      });
    });

    when(/^the student attempt to create a "Grading" punch$/, async () => {
      context.response = await request
        .post(`/activity`)
        .send({
          classId: context.klass.id,
          categoryId: context.category.id,
          startTime: "2025-01-01T10:00:00Z",
          endTime: "2025-01-01T11:00:00Z",
        })
        .set("Cookie", `auth_token=${context.token}`);
    });

    then(/^the student receives a forbidden category response$/, () => {
      expect(context.response.status).toBe(403);
    });
  });

  test("Cannot create an activity when not logged in", ({
    given,
    when,
    then,
  }) => {
    given(/^a student activity category "(.*)" exists$/, async (catName) => {
      context.category = await activityService.createActivityCategory({
        name: catName,
        description: "Student activity",
        role: "STUDENT",
      });
    });

    when(
      /^an unauthenticated request tries to create a "Studying" punch$/,
      async () => {
        context.response = await request
          .post(`/activity`)
          .set("Accept", "application/json")
          .send({
            classId: 1,
            categoryId: context.category.id,
            startTime: "2025-01-01T10:00:00Z",
            endTime: "2025-01-01T11:00:00Z",
          });
      },
    );

    then(/^the request is rejected as unauthorized$/, () => {
      expect(context.response.status).toBe(401);
    });
  });

  test("A student cannot update another student's activity punch", ({
    given,
    when,
    then,
    and,
  }) => {
    given(
      /^a logged-in student "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.user = await prisma.user.create({
          data: { email, name, isProf: false },
        });
        context.token = generateToken(context.user);
      },
    );

    and(/^another student "(.*)" exists$/, async (name) => {
      context.otherUser = await prisma.user.create({
        data: {
          email: `${name.toLowerCase().replace(" ", "")}@test.com`,
          name,
          isProf: false,
        },
      });
    });

    and(
      /^an activity punch for "Studying" exists and belongs to "Alice Student"$/,
      async () => {
        context.category = await activityService.createActivityCategory({
          name: "Studying",
          description: "Student activity",
          role: "STUDENT",
        });

        context.klass = await classService.createClass({ name: "Class 1" });
        await prisma.classRole.create({
          data: {
            userId: context.otherUser.id,
            classId: context.klass.id,
            role: "STUDENT",
          },
        });

        context.activity = await activityService.createActivity({
          classId: context.klass.id,
          categoryId: context.category.id,
          userId: context.otherUser.id,
          startTime: "2025-01-01T10:00:00Z",
          endTime: "2025-01-01T11:00:00Z",
        });
      },
    );

    when(/^Bob attempts to update that activity punch$/, async () => {
      context.response = await request
        .put(`/activity/${context.activity.id}`)
        .send({
          categoryId: context.category.id,
          classId: context.klass.id,
          startTime: "2025-01-01T10:00:00Z",
          endTime: "2025-01-01T11:00:00Z",
        })
        .set("Cookie", `auth_token=${context.token}`);
    });

    then(/^the update is forbidden$/, () => {
      expect(context.response.status).toBe(403);
    });
  });

  test("A student cannot delete another student's activity punch", ({
    given,
    when,
    then,
    and,
  }) => {
    given(
      /^a logged-in student "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.user = await prisma.user.create({
          data: { email, name, isProf: false },
        });
        context.token = generateToken(context.user);
      },
    );

    and(/^another student "(.*)" exists$/, async (name) => {
      context.otherUser = await prisma.user.create({
        data: {
          email: `${name.toLowerCase().replace(" ", "")}@test.com`,
          name,
          isProf: false,
        },
      });
    });

    and(
      /^an activity punch for "Studying" exists and belongs to "Alice Student"$/,
      async () => {
        context.category = await activityService.createActivityCategory({
          name: "Studying",
          description: "Student activity",
          role: "STUDENT",
        });

        context.klass = await classService.createClass({ name: "Class 1" });
        await prisma.classRole.create({
          data: {
            userId: context.otherUser.id,
            classId: context.klass.id,
            role: "STUDENT",
          },
        });

        context.activity = await activityService.createActivity({
          classId: context.klass.id,
          categoryId: context.category.id,
          userId: context.otherUser.id,
          startTime: "2025-01-01T10:00:00Z",
          endTime: "2025-01-01T11:00:00Z",
        });
      },
    );

    when(/^Bob attempts to delete that activity punch$/, async () => {
      context.response = await request
        .delete(`/activity/${context.activity.id}`)
        .set("Cookie", `auth_token=${context.token}`);
    });

    then(/^the delete is forbidden$/, () => {
      expect(context.response.status).toBe(403);
    });
  });

  test("Student loads HTMX activity dropdown with two activities", ({
    given,
    when,
    then,
    and,
  }) => {
    given(
      /^a logged-in student "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.user = await prisma.user.create({
          data: { name, email, isProf: false },
        });
        context.token = generateToken(context.user);
      },
    );

    and(
      /^a class named "(.*)" exists and includes that student$/,
      async (className) => {
        context.klass = await classService.createClass({ name: className });
        await prisma.classRole.create({
          data: {
            userId: context.user.id,
            classId: context.klass.id,
            role: "STUDENT",
          },
        });
      },
    );

    and(
      /^two activity categories "(.*)" and "(.*)" exist$/,
      async (cat1, cat2) => {
        context.category = await activityService.createActivityCategory({
          name: cat1,
          description: "First category",
          role: "STUDENT",
        });

        context.category2 = await activityService.createActivityCategory({
          name: cat2,
          description: "Second category",
          role: "ALL",
        });
      },
    );

    and(/^two activities for that student exist$/, async () => {
      context.activity = await activityService.createActivity({
        classId: context.klass.id,
        categoryId: context.category.id,
        userId: context.user.id,
        startTime: "2025-01-01T10:00:00Z",
        endTime: "2025-01-01T11:00:00Z",
      });

      context.activity2 = await activityService.createActivity({
        classId: context.klass.id,
        categoryId: context.category2.id,
        userId: context.user.id,
        startTime: "2025-01-02T10:00:00Z",
        endTime: "2025-01-02T11:00:00Z",
      });
    });

    when(/^the student requests their activity dropdown$/, async () => {
      context.response = await request
        .get(`/activity/user/dropdown`)
        .set("Cookie", `auth_token=${context.token}`);
    });

    then(
      /^the response contains HTML option elements for both activities$/,
      () => {
        expect(context.response.status).toBe(201);

        const html = context.response.text;

        // Activity 1
        expect(html).toContain(`value="${context.activity.id}"`);
        expect(html).toContain(context.category.name);
        expect(html).toContain(context.klass.name);
        expect(html).toContain("1/1/2025");

        // Activity 2
        expect(html).toContain(`value="${context.activity2.id}"`);
        expect(html).toContain(context.category2.name);
        expect(html).toContain(context.klass.name);
        expect(html).toContain("1/2/2025");
      },
    );
  });

  test("Student loads dropdown but has no activities", ({
    given,
    when,
    then,
  }) => {
    given(
      /^a logged-in student "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.user = await prisma.user.create({
          data: { name, email, isProf: false },
        });
        context.token = generateToken(context.user);
      },
    );

    when(/^the student requests their activity dropdown$/, async () => {
      context.response = await request
        .get(`/activity/user/dropdown`)
        .set("Cookie", `auth_token=${context.token}`);
    });

    then(/^the response is an empty HTML string$/, () => {
      expect(context.response.status).toBe(201);
      expect(context.response.text.trim()).toBe("");
    });
  });

  test("Student loads HTMX activity details for a selected punch", ({
    given,
    when,
    then,
    and,
  }) => {
    given(
      /^a logged-in student "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.user = await prisma.user.create({
          data: { name, email, isProf: false },
        });
        context.token = generateToken(context.user);
      },
    );

    and(
      /^a class named "(.*)" exists and includes that student$/,
      async (className) => {
        context.klass = await classService.createClass({ name: className });
        await prisma.classRole.create({
          data: {
            userId: context.user.id,
            classId: context.klass.id,
            role: "STUDENT",
          },
        });
      },
    );

    and(/^an activity category "(.*)" exists$/, async (catName) => {
      context.category = await activityService.createActivityCategory({
        name: catName,
        description: "Testing category",
        role: "STUDENT",
      });
    });

    and(/^a punch activity for that student exists$/, async () => {
      context.activity = await activityService.createActivity({
        classId: context.klass.id,
        categoryId: context.category.id,
        userId: context.user.id,
        startTime: "2025-01-01T09:00:00Z",
        endTime: "2025-01-01T10:00:00Z",
      });
    });

    when(/^the student requests the activity details$/, async () => {
      const id = context.activity.id;
      context.response = await request
        .get(`/activity/details?punchSelect=${id}`)
        .set("Cookie", `auth_token=${context.token}`);
    });

    then(/^the response contains the formatted activity details$/, () => {
      expect(context.response.status).toBe(201);

      const html = context.response.text;

      // Category
      expect(html).toContain(context.category.name);

      // Start date
      expect(html).toContain("1/1/2025");

      // Check HTML structure pieces
      expect(html).toContain('<div class="punchcard__section">');
      expect(html).toContain(
        '<strong class="punchcard__label">Category</strong>',
      );
      expect(html).toContain(
        '<strong class="punchcard__label">Punch In Time</strong>',
      );
      expect(html).toContain(
        '<strong class="punchcard__label">Punch Out Time</strong>',
      );
    });
  });

  test("Activity details returns empty message when punch not found", ({
    given,
    when,
    then,
  }) => {
    given(
      /^a logged-in student "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.user = await prisma.user.create({
          data: { name, email, isProf: false },
        });
        context.token = generateToken(context.user);
      },
    );

    when(
      /^the student requests details for a non-existent punch$/,
      async () => {
        context.response = await request
          .get(`/activity/details?punchSelect=999999`)
          .set("Cookie", `auth_token=${context.token}`);
      },
    );

    then(/^they receive a no-activity-found message$/, () => {
      expect(context.response.status).toBe(200);
      expect(context.response.text.trim()).toBe(
        "<div>No activity found.</div>",
      );
    });
  });

  test("Student loads the Activity Punch Card component", ({
    given,
    when,
    then,
  }) => {
    given(
      /^a logged-in student "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.user = await prisma.user.create({
          data: { name, email, isProf: false },
        });
        context.token = generateToken(context.user);
      },
    );

    when(/^the student requests the punch card component$/, async () => {
      context.response = await request
        .get("/activity/user/render")
        .set("Cookie", `auth_token=${context.token}`);
    });

    then(/^the server returns the punch card HTML$/, () => {
      expect(context.response.status).toBe(201);

      const html = context.response.text;

      // Verify main container
      expect(html).toContain('<section class="punchcard">');

      // Title
      expect(html).toContain("Activity Punch Card");

      // Dropdown
      expect(html).toContain('<select id="punch-select"');
      expect(html).toContain('hx-get="/activity/user/dropdown"');
      expect(html).toContain('hx-trigger="load"');
      expect(html).toContain('hx-swap="innerHTML"');
      expect(html).toContain(
        "hx-on:change=\"htmx.trigger('#punch-details', 'loadDetails')\"",
      );

      // Details container
      expect(html).toContain('<div id="punch-details"');
      expect(html).toContain('hx-get="/activity/details"');
      expect(html).toContain('hx-trigger="loadDetails"');

      // Buttons
      expect(html).toContain("Edit");
      expect(html).toContain("New");
      expect(html).toContain('hx-get="/activity/edit-modal"');
      expect(html).toContain('hx-get="/activity/new-modal"');

      // Script
      expect(html).toContain("htmx:afterSwap");
      expect(html).toContain("punch-details");
    });
  });

  test("User must be authenticated to render punch card", ({ when, then }) => {
    when(/^an unauthenticated user requests the punch card$/, async () => {
      context.response = await request.get("/activity/user/render");
    });

    then(/^they receive an unauthorized response$/, () => {
      expect(context.response.status).toBe(302);
    });
  });

  test("Open new activity punch form", ({ given, when, then }) => {
    given(
      /^a logged-in student "(.*)" with email "(.*)" exists$/,
      async (userName, email) => {
        context.user = await prisma.user.create({
          data: {
            email: email,
            name: userName,
            isProf: false,
          },
        });
      },
    );

    when(
      /^the student attempts to open the new activity punch form$/,
      async () => {
        const token = generateToken(context.user);
        context.response = await request
          .get("/activity/new-modal")
          .set("Cookie", `auth_token=${token}`);
      },
    );

    then(
      /^the page should show a form to create a new activity punch$/,
      async () => {
        expect(context.response.status).toBe(201);
        expect(context.response.text).toContain(
          "</i> Create New Activity</h3>",
        );
        expect(context.response.text).toContain('<div id="activity-fields">');
        expect(context.response.text).toContain('<div class="modal-footer">');
      },
    );
  });

  test("Open edit activity punch form", ({ given, and, when, then }) => {
    given(
      /^a logged-in student "(.*)" with email "(.*)" exists$/,
      async (userName, email) => {
        context.user = await prisma.user.create({
          data: {
            email: email,
            name: userName,
            isProf: false,
          },
        });
      },
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
      },
    );

    and(
      /^an activity punch for "(.*)" exists and belongs to "John Student"$/,
      async (catName) => {
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
      },
    );

    when(
      /^the student attempts to open the edit activity punch form$/,
      async () => {
        const token = generateToken(context.user);
        context.response = await request
          .get(`/activity/edit-modal?punchSelect=${context.activity.id}`)
          .set("Cookie", `auth_token=${token}`);
      },
    );

    then(
      /^the page should show a form to edit an activity punch$/,
      async () => {
        expect(context.response.status).toBe(201);
        expect(context.response.text).toContain("</i> Edit Activity</h3>");
        expect(context.response.text).toContain(
          `hx-put="/activity/${context.activity.id}"`,
        );
        expect(context.response.text).toContain('<div id="activity-fields">');
      },
    );
  });

  test("Load create or edit activity fields", ({ given, and, when, then }) => {
    given(
      /^a logged-in student "(.*)" with email "(.*)" exists$/,
      async (userName, email) => {
        context.user = await prisma.user.create({
          data: {
            email: email,
            name: userName,
            isProf: false,
          },
        });
      },
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
      },
    );

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

    then(
      /^the page should show options for making an activity punch$/,
      async () => {
        expect(context.response.status).toBe(200);
        expect(context.response.text).toContain(`<div id="activity-fields">`);
        expect(context.response.text).toContain(
          `<option value="${context.category.id}">${context.category.name}</option>`,
        );
      },
    );
  });
});
