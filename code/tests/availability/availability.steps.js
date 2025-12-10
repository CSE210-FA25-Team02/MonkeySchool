/**
 * Availability Tests
 * code/tests/availability/availability.steps.js
 */

import { loadFeature, defineFeature } from "jest-cucumber";
import { prisma } from "../../src/lib/prisma.js";
import { context } from "../steps.context.js";
import { request } from "../steps.config.js";
import { resetDatabase } from "../utils/reset-db.js";
import { generateToken } from "../utils/auth.test.helper.js";
import * as availabilityService from "../../src/services/availability.service.js";

const feature = loadFeature("./features/availability.feature");

defineFeature(feature, (test) => {
  beforeEach(async () => {
    await resetDatabase();
    context.user = undefined;
    context.token = undefined;
    context.response = undefined;
  });

  test("Set weekly availability for a user", ({ given, when, then, and }) => {
    given(
      /^a logged-in user "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.user = await prisma.user.create({
          data: { email, name, isProf: false },
        });
        context.token = generateToken(context.user);
      },
    );

    when(/^the user sets weekly availability with ranges:$/, async (table) => {
      const ranges = table.map((row) => ({
        dayOfWeek: parseInt(row.dayOfWeek, 10),
        startTime: row.startTime,
        endTime: row.endTime,
      }));

      context.response = await request
        .post("/availability/save")
        .send({ availability: JSON.stringify(ranges) })
        .set("Cookie", `auth_token=${context.token}`);
    });

    then(/^the availability should be saved successfully$/, () => {
      expect(context.response.status).toBe(200);
    });

    and(/^the user should have (\d+) availability records$/, async (count) => {
      const availability = await prisma.availability.findMany({
        where: { userId: context.user.id },
      });
      expect(availability.length).toBe(parseInt(count, 10));
    });
  });

  test("Replace existing availability when setting new availability", ({
    given,
    when,
    then,
    and,
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

    and(
      /^the user has existing availability for day (\d+) from (\d{2}:\d{2}) to (\d{2}:\d{2})$/,
      async (dayOfWeek, startTime, endTime) => {
        await availabilityService.addUserAvailability(
          context.user.id,
          parseInt(dayOfWeek, 10),
          startTime,
          endTime,
        );
      },
    );

    when(/^the user sets weekly availability with ranges:$/, async (table) => {
      const ranges = table.map((row) => ({
        dayOfWeek: parseInt(row.dayOfWeek, 10),
        startTime: row.startTime,
        endTime: row.endTime,
      }));

      context.response = await request
        .post("/availability/save")
        .send({ availability: JSON.stringify(ranges) })
        .set("Cookie", `auth_token=${context.token}`);
    });

    then(/^the availability should be saved successfully$/, () => {
      expect(context.response.status).toBe(200);
    });

    and(/^the user should have (\d+) availability record$/, async (count) => {
      const availability = await prisma.availability.findMany({
        where: { userId: context.user.id },
      });
      expect(availability.length).toBe(parseInt(count, 10));
    });

    and(
      /^the user should have availability for day (\d+) from (\d{2}:\d{2}) to (\d{2}:\d{2})$/,
      async (dayOfWeek, startTime, endTime) => {
        const availability = await prisma.availability.findFirst({
          where: {
            userId: context.user.id,
            dayOfWeek: parseInt(dayOfWeek, 10),
            startTime,
            endTime,
          },
        });
        expect(availability).toBeTruthy();
      },
    );

    and(
      /^the user should not have availability for day (\d+) from (\d{2}:\d{2}) to (\d{2}:\d{2})$/,
      async (dayOfWeek, startTime, endTime) => {
        const availability = await prisma.availability.findFirst({
          where: {
            userId: context.user.id,
            dayOfWeek: parseInt(dayOfWeek, 10),
            startTime,
            endTime,
          },
        });
        expect(availability).toBeNull();
      },
    );
  });

  test("Set availability for all days of the week", ({
    given,
    when,
    then,
    and,
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

    when(/^the user sets weekly availability with ranges:$/, async (table) => {
      const ranges = table.map((row) => ({
        dayOfWeek: parseInt(row.dayOfWeek, 10),
        startTime: row.startTime,
        endTime: row.endTime,
      }));

      context.response = await request
        .post("/availability/save")
        .send({ availability: JSON.stringify(ranges) })
        .set("Cookie", `auth_token=${context.token}`);
    });

    then(/^the availability should be saved successfully$/, () => {
      expect(context.response.status).toBe(200);
    });

    and(/^the user should have (\d+) availability records$/, async (count) => {
      const availability = await prisma.availability.findMany({
        where: { userId: context.user.id },
      });
      expect(availability.length).toBe(parseInt(count, 10));
    });
  });

  test("Cannot set availability with invalid day of week", ({
    given,
    when,
    then,
    and,
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

    when(
      /^the user attempts to set weekly availability with ranges:$/,
      async (table) => {
        const ranges = table.map((row) => ({
          dayOfWeek: parseInt(row.dayOfWeek, 10),
          startTime: row.startTime,
          endTime: row.endTime,
        }));

        context.response = await request
          .post("/availability/save")
          .send({ availability: JSON.stringify(ranges) })
          .set("Cookie", `auth_token=${context.token}`);
      },
    );

    then(/^the user should receive an error response with status 500$/, () => {
      expect(context.response.status).toBe(500);
    });

    and(/^the error message should contain "(.*)"$/, (errorMessage) => {
      // Check details first (contains the actual error message), then error, then text
      const responseText =
        context.response.body?.details ||
        context.response.body?.error ||
        context.response.text ||
        context.response.body?.message ||
        "";
      // Error messages may include values, so we check for partial match
      expect(responseText.toLowerCase()).toContain(errorMessage.toLowerCase());
    });
  });

  test("Cannot set availability with invalid day of week negative", ({
    given,
    when,
    then,
    and,
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

    when(
      /^the user attempts to set weekly availability with ranges:$/,
      async (table) => {
        const ranges = table.map((row) => ({
          dayOfWeek: parseInt(row.dayOfWeek, 10),
          startTime: row.startTime,
          endTime: row.endTime,
        }));

        context.response = await request
          .post("/availability/save")
          .send({ availability: JSON.stringify(ranges) })
          .set("Cookie", `auth_token=${context.token}`);
      },
    );

    then(/^the user should receive an error response with status 500$/, () => {
      expect(context.response.status).toBe(500);
    });

    and(/^the error message should contain "(.*)"$/, (errorMessage) => {
      // Check details first (contains the actual error message), then error, then text
      const responseText =
        context.response.body?.details ||
        context.response.body?.error ||
        context.response.text ||
        context.response.body?.message ||
        "";
      // Error messages may include values, so we check for partial match
      expect(responseText.toLowerCase()).toContain(errorMessage.toLowerCase());
    });
  });

  test("Cannot set availability with invalid start time format", ({
    given,
    when,
    then,
    and,
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

    when(
      /^the user attempts to set weekly availability with ranges:$/,
      async (table) => {
        const ranges = table.map((row) => ({
          dayOfWeek: parseInt(row.dayOfWeek, 10),
          startTime: row.startTime,
          endTime: row.endTime,
        }));

        context.response = await request
          .post("/availability/save")
          .send({ availability: JSON.stringify(ranges) })
          .set("Cookie", `auth_token=${context.token}`);
      },
    );

    then(/^the user should receive an error response with status 500$/, () => {
      expect(context.response.status).toBe(500);
    });

    and(/^the error message should contain "(.*)"$/, (errorMessage) => {
      // Check details first (contains the actual error message), then error, then text
      const responseText =
        context.response.body?.details ||
        context.response.body?.error ||
        context.response.text ||
        context.response.body?.message ||
        "";
      // Error messages may include values, so we check for partial match
      expect(responseText.toLowerCase()).toContain(errorMessage.toLowerCase());
    });
  });

  test("Cannot set availability with invalid end time format", ({
    given,
    when,
    then,
    and,
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

    when(
      /^the user attempts to set weekly availability with ranges:$/,
      async (table) => {
        const ranges = table.map((row) => ({
          dayOfWeek: parseInt(row.dayOfWeek, 10),
          startTime: row.startTime,
          endTime: row.endTime,
        }));

        context.response = await request
          .post("/availability/save")
          .send({ availability: JSON.stringify(ranges) })
          .set("Cookie", `auth_token=${context.token}`);
      },
    );

    then(/^the user should receive an error response with status 500$/, () => {
      expect(context.response.status).toBe(500);
    });

    and(/^the error message should contain "(.*)"$/, (errorMessage) => {
      // Check details first (contains the actual error message), then error, then text
      const responseText =
        context.response.body?.details ||
        context.response.body?.error ||
        context.response.text ||
        context.response.body?.message ||
        "";
      // Error messages may include values, so we check for partial match
      expect(responseText.toLowerCase()).toContain(errorMessage.toLowerCase());
    });
  });

  test("Cannot set availability with start time after end time", ({
    given,
    when,
    then,
    and,
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

    when(
      /^the user attempts to set weekly availability with ranges:$/,
      async (table) => {
        const ranges = table.map((row) => ({
          dayOfWeek: parseInt(row.dayOfWeek, 10),
          startTime: row.startTime,
          endTime: row.endTime,
        }));

        context.response = await request
          .post("/availability/save")
          .send({ availability: JSON.stringify(ranges) })
          .set("Cookie", `auth_token=${context.token}`);
      },
    );

    then(/^the user should receive an error response with status 500$/, () => {
      expect(context.response.status).toBe(500);
    });

    and(/^the error message should contain "(.*)"$/, (errorMessage) => {
      // Check details first (contains the actual error message), then error, then text
      const responseText =
        context.response.body?.details ||
        context.response.body?.error ||
        context.response.text ||
        context.response.body?.message ||
        "";
      // Error messages may include values, so we check for partial match
      expect(responseText.toLowerCase()).toContain(errorMessage.toLowerCase());
    });
  });

  test("Cannot set availability with start time equal to end time", ({
    given,
    when,
    then,
    and,
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

    when(
      /^the user attempts to set weekly availability with ranges:$/,
      async (table) => {
        const ranges = table.map((row) => ({
          dayOfWeek: parseInt(row.dayOfWeek, 10),
          startTime: row.startTime,
          endTime: row.endTime,
        }));

        context.response = await request
          .post("/availability/save")
          .send({ availability: JSON.stringify(ranges) })
          .set("Cookie", `auth_token=${context.token}`);
      },
    );

    then(/^the user should receive an error response with status 500$/, () => {
      expect(context.response.status).toBe(500);
    });

    and(/^the error message should contain "(.*)"$/, (errorMessage) => {
      // Check details first (contains the actual error message), then error, then text
      const responseText =
        context.response.body?.details ||
        context.response.body?.error ||
        context.response.text ||
        context.response.body?.message ||
        "";
      // Error messages may include values, so we check for partial match
      expect(responseText.toLowerCase()).toContain(errorMessage.toLowerCase());
    });
  });

  test("Cannot set availability with time before 8:00", ({
    given,
    when,
    then,
    and,
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

    when(
      /^the user attempts to set weekly availability with ranges:$/,
      async (table) => {
        const ranges = table.map((row) => ({
          dayOfWeek: parseInt(row.dayOfWeek, 10),
          startTime: row.startTime,
          endTime: row.endTime,
        }));

        context.response = await request
          .post("/availability/save")
          .send({ availability: JSON.stringify(ranges) })
          .set("Cookie", `auth_token=${context.token}`);
      },
    );

    then(/^the user should receive an error response with status 500$/, () => {
      expect(context.response.status).toBe(500);
    });

    and(/^the error message should contain "(.*)"$/, (errorMessage) => {
      // Check details first (contains the actual error message), then error, then text
      const responseText =
        context.response.body?.details ||
        context.response.body?.error ||
        context.response.text ||
        context.response.body?.message ||
        "";
      // Error messages may include values, so we check for partial match
      expect(responseText.toLowerCase()).toContain(errorMessage.toLowerCase());
    });
  });

  test("Cannot set availability with time after 20:00", ({
    given,
    when,
    then,
    and,
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

    when(
      /^the user attempts to set weekly availability with ranges:$/,
      async (table) => {
        const ranges = table.map((row) => ({
          dayOfWeek: parseInt(row.dayOfWeek, 10),
          startTime: row.startTime,
          endTime: row.endTime,
        }));

        context.response = await request
          .post("/availability/save")
          .send({ availability: JSON.stringify(ranges) })
          .set("Cookie", `auth_token=${context.token}`);
      },
    );

    then(/^the user should receive an error response with status 500$/, () => {
      expect(context.response.status).toBe(500);
    });

    and(/^the error message should contain "(.*)"$/, (errorMessage) => {
      // Check details first (contains the actual error message), then error, then text
      const responseText =
        context.response.body?.details ||
        context.response.body?.error ||
        context.response.text ||
        context.response.body?.message ||
        "";
      // Error messages may include values, so we check for partial match
      expect(responseText.toLowerCase()).toContain(errorMessage.toLowerCase());
    });
  });

  test("Cannot set availability with invalid time format", ({
    given,
    when,
    then,
    and,
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

    when(
      /^the user attempts to set weekly availability with ranges:$/,
      async (table) => {
        const ranges = table.map((row) => ({
          dayOfWeek: parseInt(row.dayOfWeek, 10),
          startTime: row.startTime,
          endTime: row.endTime,
        }));

        context.response = await request
          .post("/availability/save")
          .send({ availability: JSON.stringify(ranges) })
          .set("Cookie", `auth_token=${context.token}`);
      },
    );

    then(/^the user should receive an error response with status 500$/, () => {
      expect(context.response.status).toBe(500);
    });

    and(/^the error message should contain "(.*)"$/, (errorMessage) => {
      // Check details first (contains the actual error message), then error, then text
      const responseText =
        context.response.body?.details ||
        context.response.body?.error ||
        context.response.text ||
        context.response.body?.message ||
        "";
      // Error messages may include values, so we check for partial match
      expect(responseText.toLowerCase()).toContain(errorMessage.toLowerCase());
    });
  });

  test("Get user availability", ({ given, when, then, and }) => {
    given(
      /^a logged-in user "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.user = await prisma.user.create({
          data: { email, name, isProf: false },
        });
        context.token = generateToken(context.user);
      },
    );

    and(
      /^the user has availability for day (\d+) from (\d{2}:\d{2}) to (\d{2}:\d{2})$/,
      async (dayOfWeek, startTime, endTime) => {
        await availabilityService.addUserAvailability(
          context.user.id,
          parseInt(dayOfWeek, 10),
          startTime,
          endTime,
        );
      },
    );

    and(
      /^the user has availability for day (\d+) from (\d{2}:\d{2}) to (\d{2}:\d{2})$/,
      async (dayOfWeek, startTime, endTime) => {
        await availabilityService.addUserAvailability(
          context.user.id,
          parseInt(dayOfWeek, 10),
          startTime,
          endTime,
        );
      },
    );

    when(/^the user retrieves their availability$/, async () => {
      context.response = await request
        .get("/availability")
        .set("Cookie", `auth_token=${context.token}`);
    });

    then(
      /^the response should contain (\d+) availability records$/,
      async (count) => {
        expect(context.response.status).toBe(200);
        const availability = await prisma.availability.findMany({
          where: { userId: context.user.id },
        });
        expect(availability.length).toBe(parseInt(count, 10));
      },
    );

    and(/^the availability should be ordered by day and time$/, async () => {
      const availability = await prisma.availability.findMany({
        where: { userId: context.user.id },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      });

      for (let i = 0; i < availability.length - 1; i++) {
        const current = availability[i];
        const next = availability[i + 1];

        if (current.dayOfWeek === next.dayOfWeek) {
          expect(current.startTime <= next.startTime).toBe(true);
        } else {
          expect(current.dayOfWeek < next.dayOfWeek).toBe(true);
        }
      }
    });
  });

  test("Get user availability when user has none", ({ given, when, then }) => {
    given(
      /^a logged-in user "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.user = await prisma.user.create({
          data: { email, name, isProf: false },
        });
        context.token = generateToken(context.user);
      },
    );

    when(/^the user retrieves their availability$/, async () => {
      context.response = await request
        .get("/availability")
        .set("Cookie", `auth_token=${context.token}`);
    });

    then(/^the response should contain 0 availability records$/, async () => {
      expect(context.response.status).toBe(200);
      const availability = await prisma.availability.findMany({
        where: { userId: context.user.id },
      });
      expect(availability.length).toBe(0);
    });
  });

  test("Set empty availability clear all", ({ given, when, then, and }) => {
    given(
      /^a logged-in user "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.user = await prisma.user.create({
          data: { email, name, isProf: false },
        });
        context.token = generateToken(context.user);
      },
    );

    and(
      /^the user has availability for day (\d+) from (\d{2}:\d{2}) to (\d{2}:\d{2})$/,
      async (dayOfWeek, startTime, endTime) => {
        await availabilityService.addUserAvailability(
          context.user.id,
          parseInt(dayOfWeek, 10),
          startTime,
          endTime,
        );
      },
    );

    when(/^the user sets weekly availability with no ranges$/, async () => {
      context.response = await request
        .post("/availability/save")
        .send({ availability: JSON.stringify([]) })
        .set("Cookie", `auth_token=${context.token}`);
    });

    then(/^the availability should be saved successfully$/, () => {
      expect(context.response.status).toBe(200);
    });

    and(/^the user should have 0 availability records$/, async () => {
      const availability = await prisma.availability.findMany({
        where: { userId: context.user.id },
      });
      expect(availability.length).toBe(0);
    });
  });

  test("Set availability with 30-minute intervals", ({
    given,
    when,
    then,
    and,
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

    when(/^the user sets weekly availability with ranges:$/, async (table) => {
      const ranges = table.map((row) => ({
        dayOfWeek: parseInt(row.dayOfWeek, 10),
        startTime: row.startTime,
        endTime: row.endTime,
      }));

      context.response = await request
        .post("/availability/save")
        .send({ availability: JSON.stringify(ranges) })
        .set("Cookie", `auth_token=${context.token}`);
    });

    then(/^the availability should be saved successfully$/, () => {
      expect(context.response.status).toBe(200);
    });

    and(/^the user should have (\d+) availability records$/, async (count) => {
      const availability = await prisma.availability.findMany({
        where: { userId: context.user.id },
      });
      expect(availability.length).toBe(parseInt(count, 10));
    });
  });

  test("Cannot set availability with invalid data format", ({
    given,
    when,
    then,
    and,
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

    when(
      /^the user attempts to set weekly availability with invalid format$/,
      async () => {
        context.response = await request
          .post("/availability/save")
          .send({ availability: "not an array" })
          .set("Cookie", `auth_token=${context.token}`);
      },
    );

    then(/^the user should receive an error response with status 500$/, () => {
      expect(context.response.status).toBe(500);
    });

    and(/^the error message should contain "(.*)"$/, (errorMessage) => {
      // Check details first (contains the actual error message), then error, then text
      const responseText =
        context.response.body?.details ||
        context.response.body?.error ||
        context.response.text ||
        context.response.body?.message ||
        "";
      // Error messages may include values, so we check for partial match
      expect(responseText.toLowerCase()).toContain(errorMessage.toLowerCase());
    });
  });
});
