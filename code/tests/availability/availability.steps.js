import { loadFeature, defineFeature } from "jest-cucumber";
import { prisma } from "../../src/lib/prisma.js";
import { resetDatabase } from "../utils/reset-db.js";
import * as availabilityService from "../../src/services/availability.service.js";

const feature = loadFeature("./features/availability.feature");

// Test state
let users = {};
let groups = {};
let availabilities = {};
let lastError = null;
let lastResult = null;

// Helper function to get day number from day name
function getDayNumber(dayName) {
  const dayMap = {
    "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3,
    "Thursday": 4, "Friday": 5, "Saturday": 6
  };
  return dayMap[dayName];
}

defineFeature(feature, test => {
  beforeEach(async () => {
    await resetDatabase();

    // Reset test state
    users = {};
    groups = {};
    availabilities = {};
    lastError = null;
    lastResult = null;
  });

  test("User adds valid availability", ({ given, when, then, and }) => {
    given(/^a user with email "(.*)" exists$/, async (email) => {
      const user = await prisma.user.create({
        data: {
          email,
          name: email.split("@")[0],
          preferredName: email.split("@")[0]
        }
      });
      users[email] = user;
    });

    when(/^Alice adds availability for (.*) from "(.*)" to "(.*)"$/, async (dayName, startTime, endTime) => {
      try {
        const dayOfWeek = getDayNumber(dayName);
        lastResult = await availabilityService.addUserAvailability(
          users["alice@example.com"].id,
          dayOfWeek,
          startTime,
          endTime
        );
        lastError = null;
      } catch (error) {
        lastError = error.message;
        lastResult = null;
      }
    });

    then("the availability should be created successfully", () => {
      expect(lastError).toBeNull();
      expect(lastResult).toBeDefined();
      expect(lastResult.id).toBeDefined();
    });

    and(/^Alice should have availability on (.*) from "(.*)" to "(.*)"$/, async (dayName, startTime, endTime) => {
      const availability = await availabilityService.getUserAvailability(users["alice@example.com"].id);
      const dayAvail = availability.filter(a => a.dayOfWeek === getDayNumber(dayName));
      
      expect(dayAvail).toHaveLength(1);
      expect(dayAvail[0].startTime).toBe(startTime);
      expect(dayAvail[0].endTime).toBe(endTime);
    });
  });

  test("User adds invalid availability with bad time format", ({ given, when, then }) => {
    given(/^a user with email "(.*)" exists$/, async (email) => {
      const user = await prisma.user.create({
        data: {
          email,
          name: email.split("@")[0],
          preferredName: email.split("@")[0]
        }
      });
      users[email] = user;
    });

    when(/^Alice tries to add availability for (.*) from "(.*)" to "(.*)"$/, async (dayName, startTime, endTime) => {
      try {
        const dayOfWeek = getDayNumber(dayName);
        await availabilityService.addUserAvailability(
          users["alice@example.com"].id,
          dayOfWeek,
          startTime,
          endTime
        );
        lastError = null;
      } catch (error) {
        lastError = error.message;
      }
    });

    then(/^the request should fail with error "(.*)"$/, (expectedError) => {
      expect(lastError).toBe(expectedError);
    });
  });

  test("User adds invalid availability with bad day", ({ given, when, then }) => {
    given(/^a user with email "(.*)" exists$/, async (email) => {
      const user = await prisma.user.create({
        data: {
          email,
          name: email.split("@")[0],
          preferredName: email.split("@")[0]
        }
      });
      users[email] = user;
    });

    when(/^Alice tries to add availability for day (.*) from "(.*)" to "(.*)"$/, async (day, startTime, endTime) => {
      try {
        await availabilityService.addUserAvailability(
          users["alice@example.com"].id,
          parseInt(day),
          startTime,
          endTime
        );
        lastError = null;
      } catch (error) {
        lastError = error.message;
      }
    });

    then(/^the request should fail with error "(.*)"$/, (expectedError) => {
      expect(lastError).toBe(expectedError);
    });
  });

  test("User adds invalid availability with start time after end time", ({ given, when, then }) => {
    given(/^a user with email "(.*)" exists$/, async (email) => {
      const user = await prisma.user.create({
        data: {
          email,
          name: email.split("@")[0],
          preferredName: email.split("@")[0]
        }
      });
      users[email] = user;
    });

    when(/^Alice tries to add availability for (.*) from "(.*)" to "(.*)"$/, async (dayName, startTime, endTime) => {
      try {
        const dayOfWeek = getDayNumber(dayName);
        await availabilityService.addUserAvailability(
          users["alice@example.com"].id,
          dayOfWeek,
          startTime,
          endTime
        );
        lastError = null;
      } catch (error) {
        lastError = error.message;
      }
    });

    then(/^the request should fail with error "(.*)"$/, (expectedError) => {
      expect(lastError).toBe(expectedError);
    });
  });

  test("User deletes their own availability", ({ given, and, when, then }) => {
    given(/^a user with email "(.*)" exists$/, async (email) => {
      const user = await prisma.user.create({
        data: {
          email,
          name: email.split("@")[0],
          preferredName: email.split("@")[0]
        }
      });
      users[email] = user;
    });

    and(/^Alice has availability for (.*) from "(.*)" to "(.*)"$/, async (dayName, startTime, endTime) => {
      const availability = await availabilityService.addUserAvailability(
        users["alice@example.com"].id,
        getDayNumber(dayName),
        startTime,
        endTime
      );
      availabilities.alice = availability;
    });

    when("Alice deletes her Monday availability", async () => {
      try {
        await availabilityService.deleteUserAvailability(
          availabilities.alice.id,
          users["alice@example.com"].id
        );
        lastError = null;
      } catch (error) {
        lastError = error.message;
      }
    });

    then("the availability should be deleted successfully", () => {
      expect(lastError).toBeNull();
    });

    and("Alice should have no availability on Monday", async () => {
      const availability = await availabilityService.getUserAvailability(users["alice@example.com"].id);
      const mondayAvail = availability.filter(a => a.dayOfWeek === 1);
      expect(mondayAvail).toHaveLength(0);
    });
  });

  test("User cannot delete another user's availability", ({ given, and, when, then }) => {
    given(/^a user with email "(.*)" exists$/, async (email) => {
      const user = await prisma.user.create({
        data: {
          email,
          name: email.split("@")[0],
          preferredName: email.split("@")[0]
        }
      });
      users[email] = user;
    });

    and(/^a user with email "(.*)" exists$/, async (email) => {
      const user = await prisma.user.create({
        data: {
          email,
          name: email.split("@")[0],
          preferredName: email.split("@")[0]
        }
      });
      users[email] = user;
    });

    and(/^Alice has availability for (.*) from "(.*)" to "(.*)"$/, async (dayName, startTime, endTime) => {
      const availability = await availabilityService.addUserAvailability(
        users["alice@example.com"].id,
        getDayNumber(dayName),
        startTime,
        endTime
      );
      availabilities.alice = availability;
    });

    when("Bob tries to delete Alice's Monday availability", async () => {
      try {
        await availabilityService.deleteUserAvailability(
          availabilities.alice.id,
          users["bob@example.com"].id
        );
        lastError = null;
      } catch (error) {
        lastError = error.message;
      }
    });

    then(/^the request should fail with error "(.*)"$/, (expectedError) => {
      expect(lastError).toBe(expectedError);
    });
  });

  test("Group availability shows density correctly", ({ given, and, when, then }) => {
    given(/^a user with email "(.*)" exists$/, async (email) => {
      const user = await prisma.user.create({
        data: {
          email,
          name: email.split("@")[0],
          preferredName: email.split("@")[0]
        }
      });
      users[email] = user;
    });

    and(/^a user with email "(.*)" exists$/, async (email) => {
      const user = await prisma.user.create({
        data: {
          email,
          name: email.split("@")[0],
          preferredName: email.split("@")[0]
        }
      });
      users[email] = user;
    });

    and(/^a user with email "(.*)" exists$/, async (email) => {
      const user = await prisma.user.create({
        data: {
          email,
          name: email.split("@")[0],
          preferredName: email.split("@")[0]
        }
      });
      users[email] = user;
    });

    and(/^a group "(.*)" exists with these members$/, async (groupName) => {
      // Create class first
      const classRecord = await prisma.class.create({
        data: {
          name: "Test Class",
          inviteCode: "TEST123"
        }
      });

      // Create group
      const group = await prisma.group.create({
        data: {
          name: groupName,
          classId: classRecord.id
        }
      });
      groups[groupName] = group;

      // Add all users to the group
      const userEmails = ["alice@example.com", "bob@example.com", "charlie@example.com"];
      for (const email of userEmails) {
        await prisma.groupRole.create({
          data: {
            userId: users[email].id,
            groupId: group.id,
            role: email === "alice@example.com" ? "LEADER" : "MEMBER"
          }
        });
      }
    });

    and(/^Alice has availability for Monday from "(.*)" to "(.*)"$/, async (startTime, endTime) => {
      await availabilityService.addUserAvailability(
        users["alice@example.com"].id,
        getDayNumber("Monday"),
        startTime,
        endTime
      );
    });

    and(/^Bob has availability for Monday from "(.*)" to "(.*)"$/, async (startTime, endTime) => {
      await availabilityService.addUserAvailability(
        users["bob@example.com"].id,
        getDayNumber("Monday"),
        startTime,
        endTime
      );
    });

    and(/^Charlie has availability for Monday from "(.*)" to "(.*)"$/, async (startTime, endTime) => {
      await availabilityService.addUserAvailability(
        users["charlie@example.com"].id,
        getDayNumber("Monday"),
        startTime,
        endTime
      );
    });

    when("I get group availability for Team Alpha", async () => {
      lastResult = await availabilityService.getGroupAvailability(groups["Team Alpha"].id);
    });

    then(/^the density for Monday "(.*)" should be (.*) with (.*) available member$/, (timeSlot, expectedDensity, expectedCount) => {
      const dayNum = getDayNumber("Monday");
      const slot = lastResult.densityMap[dayNum][timeSlot];
      expect(slot.density).toBeCloseTo(parseFloat(expectedDensity), 2);
      expect(slot.availableCount).toBe(parseInt(expectedCount));
    });

    and(/^the density for Monday "(.*)" should be (.*) with (.*) available members$/, (timeSlot, expectedDensity, expectedCount) => {
      const dayNum = getDayNumber("Monday");
      const slot = lastResult.densityMap[dayNum][timeSlot];
      expect(slot.density).toBeCloseTo(parseFloat(expectedDensity), 2);
      expect(slot.availableCount).toBe(parseInt(expectedCount));
    });

    and(/^the density for Monday "(.*)" should be (.*) with (.*) available members$/, (timeSlot, expectedDensity, expectedCount) => {
      const dayNum = getDayNumber("Monday");
      const slot = lastResult.densityMap[dayNum][timeSlot];
      expect(slot.density).toBeCloseTo(parseFloat(expectedDensity), 2);
      expect(slot.availableCount).toBe(parseInt(expectedCount));
    });

    and(/^the density for Monday "(.*)" should be (.*) with (.*) available members$/, (timeSlot, expectedDensity, expectedCount) => {
      const dayNum = getDayNumber("Monday");
      const slot = lastResult.densityMap[dayNum][timeSlot];
      expect(slot.density).toBeCloseTo(parseFloat(expectedDensity), 2);
      expect(slot.availableCount).toBe(parseInt(expectedCount));
    });

    and(/^the density for Monday "(.*)" should be (.*) with (.*) available member$/, (timeSlot, expectedDensity, expectedCount) => {
      const dayNum = getDayNumber("Monday");
      const slot = lastResult.densityMap[dayNum][timeSlot];
      expect(slot.density).toBeCloseTo(parseFloat(expectedDensity), 2);
      expect(slot.availableCount).toBe(parseInt(expectedCount));
    });
  });

  test("Empty group availability", ({ given, and, when, then }) => {
    given(/^a user with email "(.*)" exists$/, async (email) => {
      const user = await prisma.user.create({
        data: {
          email,
          name: email.split("@")[0],
          preferredName: email.split("@")[0]
        }
      });
      users[email] = user;
    });

    and(/^a user with email "(.*)" exists$/, async (email) => {
      const user = await prisma.user.create({
        data: {
          email,
          name: email.split("@")[0],
          preferredName: email.split("@")[0]
        }
      });
      users[email] = user;
    });

    and(/^a user with email "(.*)" exists$/, async (email) => {
      const user = await prisma.user.create({
        data: {
          email,
          name: email.split("@")[0],
          preferredName: email.split("@")[0]
        }
      });
      users[email] = user;
    });

    and(/^a group "(.*)" exists with these members$/, async (groupName) => {
      // Create class first
      const classRecord = await prisma.class.create({
        data: {
          name: "Test Class",
          inviteCode: "TEST123"
        }
      });

      // Create group
      const group = await prisma.group.create({
        data: {
          name: groupName,
          classId: classRecord.id
        }
      });
      groups[groupName] = group;

      // Add all users to the group
      const userEmails = ["alice@example.com", "bob@example.com", "charlie@example.com"];
      for (const email of userEmails) {
        await prisma.groupRole.create({
          data: {
            userId: users[email].id,
            groupId: group.id,
            role: email === "alice@example.com" ? "LEADER" : "MEMBER"
          }
        });
      }
    });

    when("I get group availability for Team Alpha", async () => {
      lastResult = await availabilityService.getGroupAvailability(groups["Team Alpha"].id);
    });

    then("all time slots should have 0 density", () => {
      for (let day = 0; day <= 6; day++) {
        Object.values(lastResult.densityMap[day]).forEach(slot => {
          expect(slot.density).toBe(0);
          expect(slot.availableCount).toBe(0);
        });
      }
    });

    and("total members should be 3", () => {
      expect(lastResult.totalMembers).toBe(3);
    });
  });
});