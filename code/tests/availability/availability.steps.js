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

  test("User's availability update reflects immediately in group calendar", ({ given, and, when, then }) => {
    let testClass, testGroup, groupAvailability;

    given(/^a user with email "alice@example.com" exists$/, async () => {
      if (users["alice@example.com"]) return;
      const user = await prisma.user.create({
        data: {
          email: "alice@example.com",
          name: "alice",
          preferredName: "alice"
        }
      });
      users["alice@example.com"] = user;
    });

    and(/^a user with email "bob@example.com" exists$/, async () => {
      if (users["bob@example.com"]) return;
      const user = await prisma.user.create({
        data: {
          email: "bob@example.com",
          name: "bob",
          preferredName: "bob"
        }
      });
      users["bob@example.com"] = user;
    });

    and(/^a class named "CSE 210" exists$/, async () => {
      testClass = await prisma.class.create({
        data: {
          name: "CSE 210"
        }
      });
    });

    and(/^a group named "Team Alpha" exists in class "CSE 210"$/, async () => {
      testGroup = await prisma.group.create({
        data: {
          name: "Team Alpha",
          classId: testClass.id
        }
      });
    });

    and(/^Alice is a member of group "Team Alpha"$/, async () => {
      await prisma.groupRole.create({
        data: {
          userId: users["alice@example.com"].id,
          groupId: testGroup.id,
          role: "MEMBER"
        }
      });
    });

    and(/^Bob is a member of group "Team Alpha"$/, async () => {
      await prisma.groupRole.create({
        data: {
          userId: users["bob@example.com"].id,
          groupId: testGroup.id,
          role: "MEMBER"
        }
      });
    });

    and(/^Alice has availability for Monday from "09:00" to "12:00"$/, async () => {
      await availabilityService.addUserAvailability(
        users["alice@example.com"].id,
        getDayNumber("Monday"),
        "09:00",
        "12:00"
      );
    });

    and(/^Bob has availability for Monday from "10:00" to "14:00"$/, async () => {
      await availabilityService.addUserAvailability(
        users["bob@example.com"].id,
        getDayNumber("Monday"),
        "10:00",
        "14:00"
      );
    });

    when(/^Alice requests group "Team Alpha" availability$/, async () => {
      groupAvailability = await availabilityService.getGroupAvailability(testGroup.id);
    });

    then(/^Alice should be shown as available on Monday from "09:00" to "12:00"$/, () => {
      const aliceMember = groupAvailability.members.find(m => m.name === 'alice');
      expect(aliceMember).toBeDefined();
      const dayAvail = aliceMember.availability.filter(a => a.dayOfWeek === getDayNumber("Monday"));
      expect(dayAvail).toHaveLength(1);
      expect(dayAvail[0].startTime).toBe("09:00");
      expect(dayAvail[0].endTime).toBe("12:00");
    });

    when(/^Alice updates her availability for Monday from "11:00" to "15:00"$/, async () => {
      // Delete existing availability and add new one (simulating update)
      await prisma.availability.deleteMany({
        where: {
          userId: users["alice@example.com"].id,
          dayOfWeek: getDayNumber("Monday")
        }
      });
      
      await availabilityService.addUserAvailability(
        users["alice@example.com"].id,
        getDayNumber("Monday"),
        "11:00",
        "15:00"
      );
    });

    and(/^Alice requests group "Team Alpha" availability again$/, async () => {
      groupAvailability = await availabilityService.getGroupAvailability(testGroup.id);
    });

    then(/^Alice should be shown as available on Monday from "11:00" to "15:00"$/, () => {
      const aliceMember = groupAvailability.members.find(m => m.name === 'alice');
      expect(aliceMember).toBeDefined();
      const dayAvail = aliceMember.availability.filter(a => a.dayOfWeek === getDayNumber("Monday"));
      expect(dayAvail).toHaveLength(1);
      expect(dayAvail[0].startTime).toBe("11:00");
      expect(dayAvail[0].endTime).toBe("15:00");
    });

    and(/^Bob should still be available on Monday from "10:00" to "14:00"$/, () => {
      const bobMember = groupAvailability.members.find(m => m.name === 'bob');
      expect(bobMember).toBeDefined();
      const dayAvail = bobMember.availability.filter(a => a.dayOfWeek === getDayNumber("Monday"));
      expect(dayAvail).toHaveLength(1);
      expect(dayAvail[0].startTime).toBe("10:00");
      expect(dayAvail[0].endTime).toBe("14:00");
    });
  });

  test("User can view multiple groups they belong to", ({ given, and, when, then }) => {
    let testClass, testGroups = {}, allGroupsAvailability;

    given(/^a user with email "alice@example.com" exists$/, async () => {
      if (users["alice@example.com"]) return;
      const user = await prisma.user.create({
        data: {
          email: "alice@example.com",
          name: "alice",
          preferredName: "alice"
        }
      });
      users["alice@example.com"] = user;
    });

    and(/^a user with email "bob@example.com" exists$/, async () => {
      if (users["bob@example.com"]) return;
      const user = await prisma.user.create({
        data: {
          email: "bob@example.com",
          name: "bob",
          preferredName: "bob"
        }
      });
      users["bob@example.com"] = user;
    });

    and(/^a user with email "charlie@example.com" exists$/, async () => {
      if (users["charlie@example.com"]) return;
      const user = await prisma.user.create({
        data: {
          email: "charlie@example.com",
          name: "charlie",
          preferredName: "charlie"
        }
      });
      users["charlie@example.com"] = user;
    });

    and(/^a class named "CSE 210" exists$/, async () => {
      testClass = await prisma.class.create({
        data: {
          name: "CSE 210"
        }
      });
    });

    and(/^a group named "Team Alpha" exists in class "CSE 210"$/, async () => {
      testGroups["Team Alpha"] = await prisma.group.create({
        data: {
          name: "Team Alpha",
          classId: testClass.id
        }
      });
    });

    and(/^a group named "Team Beta" exists in class "CSE 210"$/, async () => {
      testGroups["Team Beta"] = await prisma.group.create({
        data: {
          name: "Team Beta",
          classId: testClass.id
        }
      });
    });

    and(/^Alice is a member of group "Team Alpha"$/, async () => {
      await prisma.groupRole.create({
        data: {
          userId: users["alice@example.com"].id,
          groupId: testGroups["Team Alpha"].id,
          role: "MEMBER"
        }
      });
    });

    and(/^Alice is a member of group "Team Beta"$/, async () => {
      await prisma.groupRole.create({
        data: {
          userId: users["alice@example.com"].id,
          groupId: testGroups["Team Beta"].id,
          role: "MEMBER"
        }
      });
    });

    and(/^Bob is a member of group "Team Alpha"$/, async () => {
      await prisma.groupRole.create({
        data: {
          userId: users["bob@example.com"].id,
          groupId: testGroups["Team Alpha"].id,
          role: "MEMBER"
        }
      });
    });

    and(/^Charlie is a member of group "Team Beta"$/, async () => {
      await prisma.groupRole.create({
        data: {
          userId: users["charlie@example.com"].id,
          groupId: testGroups["Team Beta"].id,
          role: "MEMBER"
        }
      });
    });

    and(/^Alice has availability for Monday from "09:00" to "12:00"$/, async () => {
      await availabilityService.addUserAvailability(
        users["alice@example.com"].id,
        getDayNumber("Monday"),
        "09:00",
        "12:00"
      );
    });

    and(/^Bob has availability for Tuesday from "10:00" to "14:00"$/, async () => {
      await availabilityService.addUserAvailability(
        users["bob@example.com"].id,
        getDayNumber("Tuesday"),
        "10:00",
        "14:00"
      );
    });

    and(/^Charlie has availability for Wednesday from "13:00" to "17:00"$/, async () => {
      await availabilityService.addUserAvailability(
        users["charlie@example.com"].id,
        getDayNumber("Wednesday"),
        "13:00",
        "17:00"
      );
    });

    when(/^Alice requests all her group availability$/, async () => {
      allGroupsAvailability = await availabilityService.getUserGroupsAvailability(users["alice@example.com"].id);
    });

    then(/^she should see 2 groups$/, () => {
      expect(allGroupsAvailability).toHaveLength(2);
    });

    and(/^group "Team Alpha" should have 2 members$/, () => {
      const group = allGroupsAvailability.find(g => g.name === "Team Alpha");
      expect(group).toBeDefined();
      expect(group.members).toHaveLength(2);
    });

    and(/^group "Team Beta" should have 2 members$/, () => {
      const group = allGroupsAvailability.find(g => g.name === "Team Beta");
      expect(group).toBeDefined();
      expect(group.members).toHaveLength(2);
    });
  });

  test("Group availability shows correct overlap counts", ({ given, and, when, then }) => {
    let testClass, testGroup, groupAvailability;

    given(/^a user with email "alice@example.com" exists$/, async () => {
      if (users["alice@example.com"]) return;
      const user = await prisma.user.create({
        data: {
          email: "alice@example.com",
          name: "alice",
          preferredName: "alice"
        }
      });
      users["alice@example.com"] = user;
    });

    and(/^a user with email "bob@example.com" exists$/, async () => {
      if (users["bob@example.com"]) return;
      const user = await prisma.user.create({
        data: {
          email: "bob@example.com",
          name: "bob",
          preferredName: "bob"
        }
      });
      users["bob@example.com"] = user;
    });

    and(/^a user with email "charlie@example.com" exists$/, async () => {
      if (users["charlie@example.com"]) return;
      const user = await prisma.user.create({
        data: {
          email: "charlie@example.com",
          name: "charlie",
          preferredName: "charlie"
        }
      });
      users["charlie@example.com"] = user;
    });

    and(/^a class named "CSE 210" exists$/, async () => {
      testClass = await prisma.class.create({
        data: {
          name: "CSE 210"
        }
      });
    });

    and(/^a group named "Team Alpha" exists in class "CSE 210"$/, async () => {
      testGroup = await prisma.group.create({
        data: {
          name: "Team Alpha",
          classId: testClass.id
        }
      });
    });

    and(/^Alice is a member of group "Team Alpha"$/, async () => {
      await prisma.groupRole.create({
        data: {
          userId: users["alice@example.com"].id,
          groupId: testGroup.id,
          role: "MEMBER"
        }
      });
    });

    and(/^Bob is a member of group "Team Alpha"$/, async () => {
      await prisma.groupRole.create({
        data: {
          userId: users["bob@example.com"].id,
          groupId: testGroup.id,
          role: "MEMBER"
        }
      });
    });

    and(/^Charlie is a member of group "Team Alpha"$/, async () => {
      await prisma.groupRole.create({
        data: {
          userId: users["charlie@example.com"].id,
          groupId: testGroup.id,
          role: "MEMBER"
        }
      });
    });

    and(/^Alice has availability for Monday from "09:00" to "13:00"$/, async () => {
      await availabilityService.addUserAvailability(
        users["alice@example.com"].id,
        getDayNumber("Monday"),
        "09:00",
        "13:00"
      );
    });

    and(/^Bob has availability for Monday from "10:00" to "14:00"$/, async () => {
      await availabilityService.addUserAvailability(
        users["bob@example.com"].id,
        getDayNumber("Monday"),
        "10:00",
        "14:00"
      );
    });

    and(/^Charlie has availability for Monday from "11:00" to "15:00"$/, async () => {
      await availabilityService.addUserAvailability(
        users["charlie@example.com"].id,
        getDayNumber("Monday"),
        "11:00",
        "15:00"
      );
    });

    when(/^Alice checks group availability for Monday at "10:30"$/, async () => {
      groupAvailability = await availabilityService.getGroupAvailability(testGroup.id);
      
      // Convert time to 24h format and count available members
      const time24h = "10:30";
      let availableCount = 0;
      groupAvailability.members.forEach(member => {
        const isAvailable = member.availability.some(avail => {
          if (avail.dayOfWeek !== getDayNumber("Monday")) return false;
          return time24h >= avail.startTime && time24h < avail.endTime;
        });
        if (isAvailable) availableCount++;
      });
      
      lastResult = availableCount;
    });

    then(/^2 members should be available at that time$/, () => {
      expect(lastResult).toBe(2);
    });

    when(/^Alice checks group availability for Monday at "11:30"$/, async () => {
      // Re-fetch to ensure fresh data (though not needed in this test case)
      groupAvailability = await availabilityService.getGroupAvailability(testGroup.id);
      
      const time24h = "11:30";
      let availableCount = 0;
      groupAvailability.members.forEach(member => {
        const isAvailable = member.availability.some(avail => {
          if (avail.dayOfWeek !== getDayNumber("Monday")) return false;
          return time24h >= avail.startTime && time24h < avail.endTime;
        });
        if (isAvailable) availableCount++;
      });
      
      lastResult = availableCount;
    });

    then(/^3 members should be available at that time$/, () => {
      expect(lastResult).toBe(3);
    });

    when(/^Alice checks group availability for Monday at "08:30"$/, async () => {
      groupAvailability = await availabilityService.getGroupAvailability(testGroup.id);
      
      const time24h = "08:30";
      let availableCount = 0;
      groupAvailability.members.forEach(member => {
        const isAvailable = member.availability.some(avail => {
          if (avail.dayOfWeek !== getDayNumber("Monday")) return false;
          return time24h >= avail.startTime && time24h < avail.endTime;
        });
        if (isAvailable) availableCount++;
      });
      
      lastResult = availableCount;
    });

    then(/^0 members should be available at that time$/, () => {
      expect(lastResult).toBe(0);
    });
  });

});