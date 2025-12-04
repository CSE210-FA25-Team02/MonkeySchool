// code/tests/pulse/pulse.steps.js

import { loadFeature, defineFeature } from "jest-cucumber";
import { prisma } from "../../src/lib/prisma.js";
import { context } from "../steps.context.js";
import { request } from "../steps.config.js";
import { resetDatabase } from "../utils/reset-db.js";
import * as classService from "../../src/services/class.service.js";
import * as pulseService from "../../src/services/pulse.service.js";
import { generateToken } from "../utils/auth.test.helper.js";

const feature = loadFeature("./features/pulse.feature");

defineFeature(feature, (test) => {
  beforeEach(async () => {
    await resetDatabase();
    context.user = undefined;
    context.klass = undefined;
    context.response = undefined;
    context.token = undefined;
    context.pulseEntry = undefined;
    context.students = [];
    context.instructor = undefined;
  });

  test("Student submits a pulse check for today", ({
    given,
    and,
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

    and(
      /^a class named "(.*)" exists and includes "(.*)" as a "(.*)"$/,
      async (className, userName, role) => {
        context.klass = await classService.createClass({ name: className });
        await prisma.classRole.create({
          data: {
            userId: context.user.id,
            classId: context.klass.id,
            role: role.toUpperCase(),
          },
        });
      },
    );

    when(/^the student submits a pulse value of (\d+)$/, async (pulse) => {
      context.response = await request
        .post(`/classes/${context.klass.id}/pulse`)
        .send({ pulse: parseInt(pulse, 10) })
        .set("Cookie", `auth_token=${context.token}`)
        .set("Accept", "application/json");
    });

    then(/^the pulse entry should be saved with value (\d+)$/, async (value) => {
      const pulseEntry = await prisma.pulseEntry.findFirst({
        where: {
          userId: context.user.id,
          classId: context.klass.id,
        },
      });
      expect(pulseEntry).not.toBeNull();
      expect(pulseEntry.value).toBe(parseInt(value, 10));
    });

    and(/^the response should indicate success$/, () => {
      expect(context.response.status).toBe(200);
      expect(context.response.body.success).toBe(true);
      expect(context.response.body.pulse).toBeDefined();
    });
  });

  test("Student updates their pulse check for today", ({
    given,
    and,
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

    and(
      /^a class named "(.*)" exists and includes "(.*)" as a "(.*)"$/,
      async (className, userName, role) => {
        context.klass = await classService.createClass({ name: className });
        await prisma.classRole.create({
          data: {
            userId: context.user.id,
            classId: context.klass.id,
            role: role.toUpperCase(),
          },
        });
      },
    );

    and(
      /^the student has already submitted a pulse value of (\d+) for today$/,
      async (pulse) => {
        await pulseService.submitPulse(
          context.user.id,
          context.klass.id,
          parseInt(pulse, 10),
        );
      },
    );

    when(/^the student submits a pulse value of (\d+)$/, async (pulse) => {
      context.response = await request
        .post(`/classes/${context.klass.id}/pulse`)
        .send({ pulse: parseInt(pulse, 10) })
        .set("Cookie", `auth_token=${context.token}`)
        .set("Accept", "application/json");
    });

    then(/^the pulse entry should be updated to value (\d+)$/, async (value) => {
      const pulseEntry = await prisma.pulseEntry.findFirst({
        where: {
          userId: context.user.id,
          classId: context.klass.id,
        },
      });
      expect(pulseEntry.value).toBe(parseInt(value, 10));
    });

    and(/^the response should indicate success$/, () => {
      expect(context.response.status).toBe(200);
    });
  });

  test("Student retrieves their pulse check for today", ({
    given,
    and,
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

    and(
      /^a class named "(.*)" exists and includes "(.*)" as a "(.*)"$/,
      async (className, userName, role) => {
        context.klass = await classService.createClass({ name: className });
        await prisma.classRole.create({
          data: {
            userId: context.user.id,
            classId: context.klass.id,
            role: role.toUpperCase(),
          },
        });
      },
    );

    and(
      /^the student has already submitted a pulse value of (\d+) for today$/,
      async (pulse) => {
        await pulseService.submitPulse(
          context.user.id,
          context.klass.id,
          parseInt(pulse, 10),
        );
      },
    );

    when(/^the student retrieves their pulse for today$/, async () => {
      context.response = await request
        .get(`/classes/${context.klass.id}/pulse/today`)
        .set("Cookie", `auth_token=${context.token}`)
        .set("Accept", "application/json");
    });

    then(/^the response should contain pulse value (\d+)$/, (value) => {
      expect(context.response.status).toBe(200);
      expect(context.response.body.pulse).toBe(parseInt(value, 10));
    });
  });

  test("Student retrieves pulse when none exists", ({
    given,
    and,
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

    and(
      /^a class named "(.*)" exists and includes "(.*)" as a "(.*)"$/,
      async (className, userName, role) => {
        context.klass = await classService.createClass({ name: className });
        await prisma.classRole.create({
          data: {
            userId: context.user.id,
            classId: context.klass.id,
            role: role.toUpperCase(),
          },
        });
      },
    );

    when(/^the student retrieves their pulse for today$/, async () => {
      context.response = await request
        .get(`/classes/${context.klass.id}/pulse/today`)
        .set("Cookie", `auth_token=${context.token}`)
        .set("Accept", "application/json");
    });

    then(/^the response should contain pulse value null$/, () => {
      expect(context.response.status).toBe(200);
      expect(context.response.body.pulse).toBeNull();
    });
  });

  test("Student submits invalid pulse values", ({
    given,
    and,
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

    and(
      /^a class named "(.*)" exists and includes "(.*)" as a "(.*)"$/,
      async (className, userName, role) => {
        context.klass = await classService.createClass({ name: className });
        await prisma.classRole.create({
          data: {
            userId: context.user.id,
            classId: context.klass.id,
            role: role.toUpperCase(),
          },
        });
      },
    );

    when(/^the student submits a pulse value of (-?\d+)$/, async (pulse) => {
      context.response = await request
        .post(`/classes/${context.klass.id}/pulse`)
        .send({ pulse: parseInt(pulse, 10) })
        .set("Cookie", `auth_token=${context.token}`)
        .set("Accept", "application/json");
    });

    then(/^the response should indicate an error$/, () => {
      expect(context.response.status).toBeGreaterThanOrEqual(400);
    });

    and(/^the error message should mention "(.*)"$/, (message) => {
      // Get all possible error message sources - check both JSON and HTML
      const response = context.response;
      if (!response) {
        throw new Error("Response is undefined");
      }
      
      // Get response content from all possible sources
      const body = response.body || {};
      const text = response.text || "";
      
      // Extract message from body if it's JSON
      let bodyMessage = "";
      if (typeof body === "object" && body !== null) {
        bodyMessage = body.message || body.error || "";
      } else if (typeof body === "string") {
        bodyMessage = body;
      }
      
      // Combine all response content into one string to search
      const allResponseContent = (text + " " + bodyMessage + " " + JSON.stringify(body)).toLowerCase();
      const lowerMessage = message.toLowerCase();
      
      // Check if the message appears anywhere in the response
      // Split the message into words and check if all key words appear
      const messageWords = lowerMessage.split(/\s+/).filter(w => w.length > 2);
      const hasAllWords = messageWords.length === 0 || messageWords.every(word => allResponseContent.includes(word));
      
      // Also check for the full message
      const hasFullMessage = allResponseContent.includes(lowerMessage);
      
      // Pass if either the full message or all key words are present
      expect(hasFullMessage || hasAllWords).toBe(true);
    });
  });

  test("Non-student cannot submit pulse", ({
    given,
    and,
    when,
    then,
  }) => {
    given(
      /^a logged-in user "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.user = await prisma.user.create({
          data: { email, name, isProf: false },
        });
        context.token = generateToken(context.user);
      },
    );

    and(/^a class named "(.*)" exists$/, async (className) => {
      context.klass = await classService.createClass({ name: className });
    });

    and(/^"(.*)" is not enrolled in "(.*)"$/, async () => {
      // User is not enrolled - no classRole created
    });

    when(/^"(.*)" attempts to submit a pulse value of (\d+)$/, async (_, pulse) => {
      context.response = await request
        .post(`/classes/${context.klass.id}/pulse`)
        .send({ pulse: parseInt(pulse, 10) })
        .set("Cookie", `auth_token=${context.token}`)
        .set("Accept", "application/json");
    });

    then(/^the response should indicate forbidden access$/, () => {
      expect(context.response.status).toBe(403);
    });

    and(/^the error message should mention "(.*)"$/, (message) => {
      // Get all possible error message sources - check both JSON and HTML
      const response = context.response;
      if (!response) {
        throw new Error("Response is undefined");
      }
      
      // Get response content from all possible sources
      const body = response.body || {};
      const text = response.text || "";
      
      // Extract message from body if it's JSON
      let bodyMessage = "";
      if (typeof body === "object" && body !== null) {
        bodyMessage = body.message || body.error || "";
      } else if (typeof body === "string") {
        bodyMessage = body;
      }
      
      // Combine all response content into one string to search
      const allResponseContent = (text + " " + bodyMessage + " " + JSON.stringify(body)).toLowerCase();
      const lowerMessage = message.toLowerCase();
      
      // Check if the message appears anywhere in the response
      // Split the message into words and check if all key words appear
      const messageWords = lowerMessage.split(/\s+/).filter(w => w.length > 2);
      const hasAllWords = messageWords.length === 0 || messageWords.every(word => allResponseContent.includes(word));
      
      // Also check for the full message
      const hasFullMessage = allResponseContent.includes(lowerMessage);
      
      // Pass if either the full message or all key words are present
      expect(hasFullMessage || hasAllWords).toBe(true);
    });
  });

  test("Student cannot submit pulse for class they're not enrolled in", ({
    given,
    and,
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

    and(/^a class named "(.*)" exists$/, async (className) => {
      context.klass = await classService.createClass({ name: className });
    });

    and(/^"(.*)" is not enrolled in "(.*)"$/, async () => {
      // User is not enrolled - no classRole created
    });

    when(/^"(.*)" attempts to submit a pulse value of (\d+)$/, async (_, pulse) => {
      context.response = await request
        .post(`/classes/${context.klass.id}/pulse`)
        .send({ pulse: parseInt(pulse, 10) })
        .set("Cookie", `auth_token=${context.token}`)
        .set("Accept", "application/json");
    });

    then(/^the response should indicate forbidden access$/, () => {
      expect(context.response.status).toBe(403);
    });

    and(/^the error message should mention "(.*)"$/, (message) => {
      // Get all possible error message sources - check both JSON and HTML
      const response = context.response;
      if (!response) {
        throw new Error("Response is undefined");
      }
      
      // Get response content from all possible sources
      const body = response.body || {};
      const text = response.text || "";
      
      // Extract message from body if it's JSON
      let bodyMessage = "";
      if (typeof body === "object" && body !== null) {
        bodyMessage = body.message || body.error || "";
      } else if (typeof body === "string") {
        bodyMessage = body;
      }
      
      // Combine all response content into one string to search
      const allResponseContent = (text + " " + bodyMessage + " " + JSON.stringify(body)).toLowerCase();
      const lowerMessage = message.toLowerCase();
      
      // Check if the message appears anywhere in the response
      // Split the message into words and check if all key words appear
      const messageWords = lowerMessage.split(/\s+/).filter(w => w.length > 2);
      const hasAllWords = messageWords.length === 0 || messageWords.every(word => allResponseContent.includes(word));
      
      // Also check for the full message
      const hasFullMessage = allResponseContent.includes(lowerMessage);
      
      // Pass if either the full message or all key words are present
      expect(hasFullMessage || hasAllWords).toBe(true);
    });
  });

  test("Instructor views pulse analytics for their class", ({
    given,
    and,
    when,
    then,
  }) => {
    given(
      /^a logged-in instructor "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.instructor = await prisma.user.create({
          data: { email, name, isProf: true },
        });
        context.token = generateToken(context.instructor);
      },
    );

    and(/^a class named "(.*)" exists$/, async (className) => {
      context.klass = await classService.createClass({ name: className });
    });

    and(/^"(.*)" is a "(.*)" in "(.*)"$/, async (_, role) => {
      await prisma.classRole.create({
        data: {
          userId: context.instructor.id,
          classId: context.klass.id,
          role: role.toUpperCase(),
        },
      });
    });

    and(
      /^there are pulse entries for the last (\d+) days in "(.*)"$/,
      async (days) => {
        // Create some test students
        for (let i = 0; i < 3; i++) {
          const student = await prisma.user.create({
            data: {
              email: `student${i}@ucsd.edu`,
              name: `Student ${i}`,
              isProf: false,
            },
          });
          await prisma.classRole.create({
            data: {
              userId: student.id,
              classId: context.klass.id,
              role: "STUDENT",
            },
          });
          context.students.push(student);

          // Create pulse entries for the last N days
          const today = new Date();
          for (let d = 0; d < parseInt(days, 10); d++) {
            const date = new Date(today);
            date.setDate(date.getDate() - d);
            date.setHours(0, 0, 0, 0);

            await prisma.pulseEntry.create({
              data: {
                userId: student.id,
                classId: context.klass.id,
                value: Math.floor(Math.random() * 5) + 1,
                date,
              },
            });
          }
        }
      },
    );

    when(
      /^the instructor requests pulse analytics with range (\d+)$/,
      async (range) => {
        context.response = await request
          .get(`/classes/${context.klass.id}/pulse/analytics?range=${range}`)
          .set("Cookie", `auth_token=${context.token}`)
          .set("Accept", "application/json");
      },
    );

    then(/^the response should contain analytics data$/, () => {
      expect(context.response.status).toBe(200);
      expect(context.response.body.days).toBeDefined();
      expect(Array.isArray(context.response.body.days)).toBe(true);
    });

    and(/^the analytics should include average pulse values$/, () => {
      if (context.response.body.days.length > 0) {
        expect(context.response.body.days[0].averagePulse).toBeDefined();
      }
    });

    and(/^the analytics should include entry counts$/, () => {
      if (context.response.body.days.length > 0) {
        expect(context.response.body.days[0].count).toBeDefined();
      }
    });
  });

  test("TA views pulse analytics", ({ given, and, when, then }) => {
    given(
      /^a logged-in TA "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.instructor = await prisma.user.create({
          data: { email, name, isProf: false },
        });
        context.token = generateToken(context.instructor);
      },
    );

    and(/^a class named "(.*)" exists$/, async (className) => {
      context.klass = await classService.createClass({ name: className });
    });

    and(/^"(.*)" is a "(.*)" in "(.*)"$/, async (_, role) => {
      await prisma.classRole.create({
        data: {
          userId: context.instructor.id,
          classId: context.klass.id,
          role: role.toUpperCase(),
        },
      });
    });

    and(
      /^there are pulse entries for the last (\d+) days in "(.*)"$/,
      async (days) => {
        const student = await prisma.user.create({
          data: {
            email: "student@ucsd.edu",
            name: "Student",
            isProf: false,
          },
        });
        await prisma.classRole.create({
          data: {
            userId: student.id,
            classId: context.klass.id,
            role: "STUDENT",
          },
        });

        const today = new Date();
        for (let d = 0; d < parseInt(days, 10); d++) {
          const date = new Date(today);
          date.setDate(date.getDate() - d);
          date.setHours(0, 0, 0, 0);

          await prisma.pulseEntry.create({
            data: {
              userId: student.id,
              classId: context.klass.id,
              value: 4,
              date,
            },
          });
        }
      },
    );

    when(
      /^the instructor requests pulse analytics with range (\d+)$/,
      async (range) => {
        context.response = await request
          .get(`/classes/${context.klass.id}/pulse/analytics?range=${range}`)
          .set("Cookie", `auth_token=${context.token}`)
          .set("Accept", "application/json");
      },
    );

    then(/^the response should contain analytics data$/, () => {
      expect(context.response.status).toBe(200);
      expect(context.response.body.days).toBeDefined();
    });
  });

  test("Tutor views pulse analytics", ({ given, and, when, then }) => {
    given(
      /^a logged-in tutor "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.instructor = await prisma.user.create({
          data: { email, name, isProf: false },
        });
        context.token = generateToken(context.instructor);
      },
    );

    and(/^a class named "(.*)" exists$/, async (className) => {
      context.klass = await classService.createClass({ name: className });
    });

    and(/^"(.*)" is a "(.*)" in "(.*)"$/, async (_, role) => {
      await prisma.classRole.create({
        data: {
          userId: context.instructor.id,
          classId: context.klass.id,
          role: role.toUpperCase(),
        },
      });
    });

    and(
      /^there are pulse entries for the last (\d+) days in "(.*)"$/,
      async (days) => {
        const student = await prisma.user.create({
          data: {
            email: "student@ucsd.edu",
            name: "Student",
            isProf: false,
          },
        });
        await prisma.classRole.create({
          data: {
            userId: student.id,
            classId: context.klass.id,
            role: "STUDENT",
          },
        });

        const today = new Date();
        for (let d = 0; d < parseInt(days, 10); d++) {
          const date = new Date(today);
          date.setDate(date.getDate() - d);
          date.setHours(0, 0, 0, 0);

          await prisma.pulseEntry.create({
            data: {
              userId: student.id,
              classId: context.klass.id,
              value: 3,
              date,
            },
          });
        }
      },
    );

    when(
      /^the instructor requests pulse analytics with range (\d+)$/,
      async (range) => {
        context.response = await request
          .get(`/classes/${context.klass.id}/pulse/analytics?range=${range}`)
          .set("Cookie", `auth_token=${context.token}`)
          .set("Accept", "application/json");
      },
    );

    then(/^the response should contain analytics data$/, () => {
      expect(context.response.status).toBe(200);
      expect(context.response.body.days).toBeDefined();
    });
  });

  test("Student cannot view pulse analytics", ({
    given,
    and,
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

    and(/^a class named "(.*)" exists$/, async (className) => {
      context.klass = await classService.createClass({ name: className });
    });

    and(/^"(.*)" is a "(.*)" in "(.*)"$/, async (_, role) => {
      await prisma.classRole.create({
        data: {
          userId: context.user.id,
          classId: context.klass.id,
          role: role.toUpperCase(),
        },
      });
    });

    when(/^"(.*)" attempts to view pulse analytics$/, async () => {
      context.response = await request
        .get(`/classes/${context.klass.id}/pulse/analytics?range=7`)
        .set("Cookie", `auth_token=${context.token}`)
        .set("Accept", "application/json");
    });

    then(/^the response should indicate forbidden access$/, () => {
      expect(context.response.status).toBe(403);
    });

    and(/^the error message should mention "(.*)"$/, (message) => {
      // Get all possible error message sources - check both JSON and HTML
      const response = context.response;
      if (!response) {
        throw new Error("Response is undefined");
      }
      
      // Get response content from all possible sources
      const body = response.body || {};
      const text = response.text || "";
      
      // Extract message from body if it's JSON
      let bodyMessage = "";
      if (typeof body === "object" && body !== null) {
        bodyMessage = body.message || body.error || "";
      } else if (typeof body === "string") {
        bodyMessage = body;
      }
      
      // Combine all response content into one string to search
      const allResponseContent = (text + " " + bodyMessage + " " + JSON.stringify(body)).toLowerCase();
      const lowerMessage = message.toLowerCase();
      
      // Check if the message appears anywhere in the response
      // Split the message into words and check if all key words appear
      const messageWords = lowerMessage.split(/\s+/).filter(w => w.length > 2);
      const hasAllWords = messageWords.length === 0 || messageWords.every(word => allResponseContent.includes(word));
      
      // Also check for the full message
      const hasFullMessage = allResponseContent.includes(lowerMessage);
      
      // Pass if either the full message or all key words are present
      expect(hasFullMessage || hasAllWords).toBe(true);
    });
  });

  test("Instructor requests analytics with different ranges", ({
    given,
    and,
    when,
    then,
  }) => {
    given(
      /^a logged-in instructor "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.instructor = await prisma.user.create({
          data: { email, name, isProf: true },
        });
        context.token = generateToken(context.instructor);
      },
    );

    and(/^a class named "(.*)" exists$/, async (className) => {
      context.klass = await classService.createClass({ name: className });
    });

    and(/^"(.*)" is a "(.*)" in "(.*)"$/, async (_, role) => {
      await prisma.classRole.create({
        data: {
          userId: context.instructor.id,
          classId: context.klass.id,
          role: role.toUpperCase(),
        },
      });
    });

    and(
      /^there are pulse entries for the last (\d+) days in "(.*)"$/,
      async (days) => {
        const student = await prisma.user.create({
          data: {
            email: "student@ucsd.edu",
            name: "Student",
            isProf: false,
          },
        });
        await prisma.classRole.create({
          data: {
            userId: student.id,
            classId: context.klass.id,
            role: "STUDENT",
          },
        });

        const today = new Date();
        for (let d = 0; d < parseInt(days, 10); d++) {
          const date = new Date(today);
          date.setDate(date.getDate() - d);
          date.setHours(0, 0, 0, 0);

          await prisma.pulseEntry.create({
            data: {
              userId: student.id,
              classId: context.klass.id,
              value: 4,
              date,
            },
          });
        }
      },
    );

    when(
      /^the instructor requests pulse analytics with range (\d+)$/,
      async (range) => {
        context.response = await request
          .get(`/classes/${context.klass.id}/pulse/analytics?range=${range}`)
          .set("Cookie", `auth_token=${context.token}`)
          .set("Accept", "application/json");
      },
    );

    then(/^the response should contain analytics data$/, () => {
      expect(context.response.status).toBe(200);
      expect(context.response.body.days).toBeDefined();
    });

    and(/^the analytics should cover (\d+) days$/, (range) => {
      expect(context.response.body.range).toBe(parseInt(range, 10));
    });
  });

  test("Instructor requests analytics with invalid range", ({
    given,
    and,
    when,
    then,
  }) => {
    given(
      /^a logged-in instructor "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.instructor = await prisma.user.create({
          data: { email, name, isProf: true },
        });
        context.token = generateToken(context.instructor);
      },
    );

    and(/^a class named "(.*)" exists$/, async (className) => {
      context.klass = await classService.createClass({ name: className });
    });

    and(/^"(.*)" is a "(.*)" in "(.*)"$/, async (_, role) => {
      await prisma.classRole.create({
        data: {
          userId: context.instructor.id,
          classId: context.klass.id,
          role: role.toUpperCase(),
        },
      });
    });

    when(/^the instructor requests pulse analytics with range (\d+)$/, async (range) => {
      context.response = await request
        .get(`/classes/${context.klass.id}/pulse/analytics?range=${range}`)
        .set("Cookie", `auth_token=${context.token}`)
        .set("Accept", "application/json");
    });

    then(/^the response should indicate an error$/, () => {
      expect(context.response.status).toBeGreaterThanOrEqual(400);
    });

    and(/^the error message should mention "(.*)"$/, (message) => {
      // Get all possible error message sources - check both JSON and HTML
      const response = context.response;
      if (!response) {
        throw new Error("Response is undefined");
      }
      
      // Get response content from all possible sources
      const body = response.body || {};
      const text = response.text || "";
      
      // Extract message from body if it's JSON
      let bodyMessage = "";
      if (typeof body === "object" && body !== null) {
        bodyMessage = body.message || body.error || "";
      } else if (typeof body === "string") {
        bodyMessage = body;
      }
      
      // Combine all response content into one string to search
      const allResponseContent = (text + " " + bodyMessage + " " + JSON.stringify(body)).toLowerCase();
      const lowerMessage = message.toLowerCase();
      
      // Check if the message appears anywhere in the response
      // Split the message into words and check if all key words appear
      const messageWords = lowerMessage.split(/\s+/).filter(w => w.length > 2);
      const hasAllWords = messageWords.length === 0 || messageWords.every(word => allResponseContent.includes(word));
      
      // Also check for the full message
      const hasFullMessage = allResponseContent.includes(lowerMessage);
      
      // Pass if either the full message or all key words are present
      expect(hasFullMessage || hasAllWords).toBe(true);
    });
  });

  test("Instructor views pulse details for a specific date", ({
    given,
    and,
    when,
    then,
  }) => {
    given(
      /^a logged-in instructor "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.instructor = await prisma.user.create({
          data: { email, name, isProf: true },
        });
        context.token = generateToken(context.instructor);
      },
    );

    and(/^a class named "(.*)" exists$/, async (className) => {
      context.klass = await classService.createClass({ name: className });
    });

    and(/^"(.*)" is a "(.*)" in "(.*)"$/, async (_, role) => {
      await prisma.classRole.create({
        data: {
          userId: context.instructor.id,
          classId: context.klass.id,
          role: role.toUpperCase(),
        },
      });
    });

    and(
      /^there are pulse entries for date "(.*)" in "(.*)"$/,
      async (dateStr) => {
        const student1 = await prisma.user.create({
          data: {
            email: "student1@ucsd.edu",
            name: "Student One",
            isProf: false,
          },
        });
        const student2 = await prisma.user.create({
          data: {
            email: "student2@ucsd.edu",
            name: "Student Two",
            isProf: false,
          },
        });

        await prisma.classRole.create({
          data: {
            userId: student1.id,
            classId: context.klass.id,
            role: "STUDENT",
          },
        });
        await prisma.classRole.create({
          data: {
            userId: student2.id,
            classId: context.klass.id,
            role: "STUDENT",
          },
        });

        const date = new Date(dateStr + "T00:00:00");
        await prisma.pulseEntry.create({
          data: {
            userId: student1.id,
            classId: context.klass.id,
            value: 4,
            date,
          },
        });
        await prisma.pulseEntry.create({
          data: {
            userId: student2.id,
            classId: context.klass.id,
            value: 5,
            date,
          },
        });
      },
    );

    when(/^the instructor requests pulse details for date "(.*)"$/, async (dateStr) => {
      context.response = await request
        .get(`/classes/${context.klass.id}/pulse/details?date=${dateStr}`)
        .set("Cookie", `auth_token=${context.token}`)
        .set("Accept", "application/json");
    });

    then(/^the response should contain pulse details$/, () => {
      expect(context.response.status).toBe(200);
      expect(context.response.body.entries).toBeDefined();
      expect(Array.isArray(context.response.body.entries)).toBe(true);
    });

    and(/^the details should include student names and pulse values$/, () => {
      if (context.response.body.entries.length > 0) {
        expect(context.response.body.entries[0].studentName).toBeDefined();
        expect(context.response.body.entries[0].pulse).toBeDefined();
      }
    });
  });

  test("Instructor requests pulse details with invalid date", ({
    given,
    and,
    when,
    then,
  }) => {
    given(
      /^a logged-in instructor "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.instructor = await prisma.user.create({
          data: { email, name, isProf: true },
        });
        context.token = generateToken(context.instructor);
      },
    );

    and(/^a class named "(.*)" exists$/, async (className) => {
      context.klass = await classService.createClass({ name: className });
    });

    and(/^"(.*)" is a "(.*)" in "(.*)"$/, async (_, role) => {
      await prisma.classRole.create({
        data: {
          userId: context.instructor.id,
          classId: context.klass.id,
          role: role.toUpperCase(),
        },
      });
    });

    when(/^the instructor requests pulse details for date "(.*)"$/, async (dateStr) => {
      context.response = await request
        .get(`/classes/${context.klass.id}/pulse/details?date=${dateStr}`)
        .set("Cookie", `auth_token=${context.token}`)
        .set("Accept", "application/json");
    });

    then(/^the response should indicate an error$/, () => {
      expect(context.response.status).toBeGreaterThanOrEqual(400);
    });

    and(/^the error message should mention "(.*)"$/, (message) => {
      // Get all possible error message sources - check both JSON and HTML
      const response = context.response;
      if (!response) {
        throw new Error("Response is undefined");
      }
      
      // Get response content from all possible sources
      const body = response.body || {};
      const text = response.text || "";
      
      // Extract message from body if it's JSON
      let bodyMessage = "";
      if (typeof body === "object" && body !== null) {
        bodyMessage = body.message || body.error || "";
      } else if (typeof body === "string") {
        bodyMessage = body;
      }
      
      // Combine all response content into one string to search
      const allResponseContent = (text + " " + bodyMessage + " " + JSON.stringify(body)).toLowerCase();
      const lowerMessage = message.toLowerCase();
      
      // Check if the message appears anywhere in the response
      // Split the message into words and check if all key words appear
      const messageWords = lowerMessage.split(/\s+/).filter(w => w.length > 2);
      const hasAllWords = messageWords.length === 0 || messageWords.every(word => allResponseContent.includes(word));
      
      // Also check for the full message
      const hasFullMessage = allResponseContent.includes(lowerMessage);
      
      // Pass if either the full message or all key words are present
      expect(hasFullMessage || hasAllWords).toBe(true);
    });
  });

  test("Instructor views pulse analytics page", ({
    given,
    and,
    when,
    then,
  }) => {
    given(
      /^a logged-in instructor "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.instructor = await prisma.user.create({
          data: { email, name, isProf: true },
        });
        context.token = generateToken(context.instructor);
      },
    );

    and(/^a class named "(.*)" exists$/, async (className) => {
      context.klass = await classService.createClass({ name: className });
    });

    and(/^"(.*)" is a "(.*)" in "(.*)"$/, async (_, role) => {
      await prisma.classRole.create({
        data: {
          userId: context.instructor.id,
          classId: context.klass.id,
          role: role.toUpperCase(),
        },
      });
    });

    and(
      /^there are pulse entries for the last (\d+) days in "(.*)"$/,
      async (days) => {
        const student = await prisma.user.create({
          data: {
            email: "student@ucsd.edu",
            name: "Student",
            isProf: false,
          },
        });
        await prisma.classRole.create({
          data: {
            userId: student.id,
            classId: context.klass.id,
            role: "STUDENT",
          },
        });

        const today = new Date();
        for (let d = 0; d < parseInt(days, 10); d++) {
          const date = new Date(today);
          date.setDate(date.getDate() - d);
          date.setHours(0, 0, 0, 0);

          await prisma.pulseEntry.create({
            data: {
              userId: student.id,
              classId: context.klass.id,
              value: 4,
              date,
            },
          });
        }
      },
    );

    when(/^the instructor requests the pulse analytics page$/, async () => {
      context.response = await request
        .get(`/classes/${context.klass.id}/pulse/page`)
        .set("Cookie", `auth_token=${context.token}`)
        .set("Accept", "text/html");
    });

    then(/^the response should be HTML$/, () => {
      expect(context.response.status).toBe(200);
      expect(context.response.headers["content-type"]).toContain("text/html");
    });

    and(/^the HTML should contain pulse analytics data$/, () => {
      expect(context.response.text).toContain("pulse");
    });
  });
});

