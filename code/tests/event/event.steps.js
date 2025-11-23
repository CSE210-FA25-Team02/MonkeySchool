// code/tests/event/event.steps.js

import { loadFeature, defineFeature } from "jest-cucumber";
import { prisma } from "../../src/lib/prisma.js";
import { context } from "../steps.context.js";
import { request } from "../steps.config.js";
import { resetDatabase } from "../utils/reset-db.js";
import * as eventService from "../../src/services/event.service.js";

const feature = loadFeature("./features/event.feature");

defineFeature(feature, (test) => {
  beforeEach(async () => {
    await resetDatabase();
    context.users = {};
    context.classes = {};
    context.groups = {};
    context.events = {};
    context.lastEvent = null;
    context.lastError = null;
    context.lastEvents = [];
    context.lastEventsWithPermissions = [];
    context.lastPermissions = {};
  });

  // Helper function to parse jest-cucumber tables
  function parseTableToObject(table) {
    const eventData = {};
    let titleFromColumn = null;

    for (const row of table) {
      const fieldName = row.title; // Gets 'description', 'type', etc.
      const columnHeaders = Object.keys(row).filter((key) => key !== "title");
      const fieldValue = row[columnHeaders[0]]; // Gets the actual value
      eventData[fieldName] = fieldValue;

      // Extract title from the column header (first time only)
      if (!titleFromColumn && columnHeaders.length > 0) {
        titleFromColumn = columnHeaders[0];
      }
    }

    // Add the title from the column header
    if (titleFromColumn) {
      eventData.title = titleFromColumn;
    }

    return eventData;
  }

  // Setup helpers
  async function createTestUser(userData) {
    return await prisma.user.create({
      data: userData,
    });
  }

  async function createTestClass(classData) {
    return await prisma.class.create({
      data: classData,
    });
  }

  async function createTestGroup(groupData, className) {
    const testClass = context.classes[className];
    return await prisma.group.create({
      data: {
        ...groupData,
        classId: testClass.id,
      },
    });
  }

  async function createTestClassRole(userName, className, role) {
    const user = context.users[userName];
    const testClass = context.classes[className];

    return await prisma.classRole.create({
      data: {
        userId: user.id,
        classId: testClass.id,
        role,
      },
    });
  }

  async function createTestGroupRole(userName, groupName, role) {
    const user = context.users[userName];
    const group = context.groups[groupName];

    return await prisma.groupRole.create({
      data: {
        userId: user.id,
        groupId: group.id,
        role,
      },
    });
  }

  test("Professor creates a course lecture", ({ given, when, then }) => {
    given(/^the following users exist:$/, async (table) => {
      for (const row of table) {
        const user = await createTestUser({
          name: row.name,
          email: row.email,
          preferredName: row.preferredName,
        });
        context.users[row.name] = user;
      }
    });

    given(/^the following class exists:$/, async (table) => {
      for (const row of table) {
        const testClass = await createTestClass({
          name: row.name,
          quarter: row.quarter,
          inviteCode: "TEST123",
        });
        context.classes[row.name] = testClass;
      }
    });

    given(/^the following class roles exist:$/, async (table) => {
      for (const row of table) {
        await createTestClassRole(row.user, row.class, row.role);
      }
    });

    given(/^the following group exists:$/, async (table) => {
      for (const row of table) {
        const group = await createTestGroup({ name: row.name }, row.class);
        context.groups[row.name] = group;
      }
    });

    given(/^the following group roles exist:$/, async (table) => {
      for (const row of table) {
        await createTestGroupRole(row.user, row.group, row.role);
      }
    });

    when(/^Alice creates an event:$/, async (table) => {
      const user = context.users["Alice"];
      const eventData = parseTableToObject(table);
      const testClass = context.classes["CSE 210"];

      try {
        const event = await eventService.createEvent({
          title: eventData.title,
          description: eventData.description,
          type: eventData.type,
          startTime: new Date(eventData.startTime),
          endTime: new Date(eventData.endTime),
          location: eventData.location,
          userId: user.id,
          classId: testClass.id,
        });
        context.lastEvent = event;
        context.lastError = null;
      } catch (error) {
        context.lastError = error;
        context.lastEvent = null;
      }
    });

    then("the event should be created successfully", () => {
      if (context.lastError) {
        console.log(
          "Event creation error:",
          context.lastError.message || context.lastError,
        );
      }
      expect(context.lastEvent).not.toBeNull();
      expect(context.lastEvent).toHaveProperty("id");
      expect(context.lastError).toBeNull();
    });

    then(/^the event should have type "([^"]*)"$/, (expectedType) => {
      expect(context.lastEvent.type).toBe(expectedType);
    });

    then(/^the event creator should be "([^"]*)"$/, (expectedCreator) => {
      const expectedUser = context.users[expectedCreator];
      expect(context.lastEvent.userId).toBe(expectedUser.id);
    });
  });

  test("TA creates office hours", ({ given, when, then }) => {
    given(/^the following users exist:$/, async (table) => {
      for (const row of table) {
        const user = await createTestUser({
          name: row.name,
          email: row.email,
          preferredName: row.preferredName,
        });
        context.users[row.name] = user;
      }
    });

    given(/^the following class exists:$/, async (table) => {
      for (const row of table) {
        const testClass = await createTestClass({
          name: row.name,
          quarter: row.quarter,
          inviteCode: "TEST123",
        });
        context.classes[row.name] = testClass;
      }
    });

    given(/^the following class roles exist:$/, async (table) => {
      for (const row of table) {
        await createTestClassRole(row.user, row.class, row.role);
      }
    });

    given(/^the following group exists:$/, async (table) => {
      for (const row of table) {
        const group = await createTestGroup({ name: row.name }, row.class);
        context.groups[row.name] = group;
      }
    });

    given(/^the following group roles exist:$/, async (table) => {
      for (const row of table) {
        await createTestGroupRole(row.user, row.group, row.role);
      }
    });

    when(/^Charlie creates an event:$/, async (table) => {
      const user = context.users["Charlie"];
      const eventData = parseTableToObject(table);
      const testClass = context.classes["CSE 210"];

      try {
        const event = await eventService.createEvent({
          title: eventData.title,
          description: eventData.description,
          type: eventData.type,
          startTime: new Date(eventData.startTime),
          endTime: new Date(eventData.endTime),
          location: eventData.location,
          userId: user.id,
          classId: testClass.id,
        });
        context.lastEvent = event;
        context.lastError = null;
      } catch (error) {
        context.lastError = error;
        context.lastEvent = null;
      }
    });

    then("the event should be created successfully", () => {
      if (context.lastError) {
        console.log(
          "Event creation error:",
          context.lastError.message || context.lastError,
        );
      }
      expect(context.lastEvent).not.toBeNull();
      expect(context.lastEvent).toHaveProperty("id");
      expect(context.lastError).toBeNull();
    });

    then(/^the event should have type "([^"]*)"$/, (expectedType) => {
      expect(context.lastEvent.type).toBe(expectedType);
    });

    then(/^the event creator should be "([^"]*)"$/, (expectedCreator) => {
      const expectedUser = context.users[expectedCreator];
      expect(context.lastEvent.userId).toBe(expectedUser.id);
    });
  });

  test("Student cannot create course lecture", ({ given, when, then }) => {
    given(/^the following users exist:$/, async (table) => {
      for (const row of table) {
        const user = await createTestUser({
          name: row.name,
          email: row.email,
          preferredName: row.preferredName,
        });
        context.users[row.name] = user;
      }
    });

    given(/^the following class exists:$/, async (table) => {
      for (const row of table) {
        const testClass = await createTestClass({
          name: row.name,
          quarter: row.quarter,
          inviteCode: "TEST123",
        });
        context.classes[row.name] = testClass;
      }
    });

    given(/^the following class roles exist:$/, async (table) => {
      for (const row of table) {
        await createTestClassRole(row.user, row.class, row.role);
      }
    });

    given(/^the following group exists:$/, async (table) => {
      for (const row of table) {
        const group = await createTestGroup({ name: row.name }, row.class);
        context.groups[row.name] = group;
      }
    });

    given(/^the following group roles exist:$/, async (table) => {
      for (const row of table) {
        await createTestGroupRole(row.user, row.group, row.role);
      }
    });

    when(/^Bob attempts to create an event:$/, async (table) => {
      const user = context.users["Bob"];
      const eventData = parseTableToObject(table);
      const testClass = context.classes["CSE 210"];

      try {
        const event = await eventService.createEvent({
          title: eventData.title,
          description: eventData.description,
          type: eventData.type,
          startTime: new Date(eventData.startTime),
          endTime: new Date(eventData.endTime),
          location: eventData.location,
          userId: user.id,
          classId: testClass.id,
        });
        context.lastEvent = event;
        context.lastError = null;
      } catch (error) {
        context.lastError = error;
        context.lastEvent = null;
      }
    });

    then("the event creation should fail", () => {
      expect(context.lastEvent).toBeNull();
      expect(context.lastError).not.toBeNull();
    });

    then(/^the error should contain "([^"]*)"$/, (expectedMessage) => {
      expect(context.lastError).not.toBeNull();
      expect(context.lastError.message).toContain(expectedMessage);
    });
  });

  test("Group leader creates group meeting", ({ given, when, then }) => {
    given(/^the following users exist:$/, async (table) => {
      for (const row of table) {
        const user = await createTestUser({
          name: row.name,
          email: row.email,
          preferredName: row.preferredName,
        });
        context.users[row.name] = user;
      }
    });

    given(/^the following class exists:$/, async (table) => {
      for (const row of table) {
        const testClass = await createTestClass({
          name: row.name,
          quarter: row.quarter,
          inviteCode: "TEST123",
        });
        context.classes[row.name] = testClass;
      }
    });

    given(/^the following class roles exist:$/, async (table) => {
      for (const row of table) {
        await createTestClassRole(row.user, row.class, row.role);
      }
    });

    given(/^the following group exists:$/, async (table) => {
      for (const row of table) {
        const group = await createTestGroup({ name: row.name }, row.class);
        context.groups[row.name] = group;
      }
    });

    given(/^the following group roles exist:$/, async (table) => {
      for (const row of table) {
        await createTestGroupRole(row.user, row.group, row.role);
      }
    });

    when(/^Bob creates an event:$/, async (table) => {
      const user = context.users["Bob"];
      const eventData = parseTableToObject(table);
      const testClass = context.classes["CSE 210"];
      const group = context.groups["Team Alpha"];

      try {
        const event = await eventService.createEvent({
          title: eventData.title,
          description: eventData.description,
          type: eventData.type,
          startTime: new Date(eventData.startTime),
          endTime: new Date(eventData.endTime),
          location: eventData.location,
          userId: user.id,
          classId: testClass.id,
          groupId: group.id,
        });
        context.lastEvent = event;
        context.lastError = null;
      } catch (error) {
        context.lastError = error;
        context.lastEvent = null;
      }
    });

    then("the event should be created successfully", () => {
      if (context.lastError) {
        console.log(
          "Event creation error:",
          context.lastError.message || context.lastError,
        );
      }
      expect(context.lastEvent).not.toBeNull();
      expect(context.lastEvent).toHaveProperty("id");
      expect(context.lastError).toBeNull();
    });

    then(/^the event should have type "([^"]*)"$/, (expectedType) => {
      expect(context.lastEvent.type).toBe(expectedType);
    });

    then(
      /^the event should be associated with group "([^"]*)"$/,
      (groupName) => {
        const expectedGroup = context.groups[groupName];
        expect(context.lastEvent.groupId).toBe(expectedGroup.id);
      },
    );
  });

  test("Student creates general event", ({ given, when, then }) => {
    given(/^the following users exist:$/, async (table) => {
      for (const row of table) {
        const user = await createTestUser({
          name: row.name,
          email: row.email,
          preferredName: row.preferredName,
        });
        context.users[row.name] = user;
      }
    });

    given(/^the following class exists:$/, async (table) => {
      for (const row of table) {
        const testClass = await createTestClass({
          name: row.name,
          quarter: row.quarter,
          inviteCode: "TEST123",
        });
        context.classes[row.name] = testClass;
      }
    });

    given(/^the following class roles exist:$/, async (table) => {
      for (const row of table) {
        await createTestClassRole(row.user, row.class, row.role);
      }
    });

    given(/^the following group exists:$/, async (table) => {
      for (const row of table) {
        const group = await createTestGroup({ name: row.name }, row.class);
        context.groups[row.name] = group;
      }
    });

    given(/^the following group roles exist:$/, async (table) => {
      for (const row of table) {
        await createTestGroupRole(row.user, row.group, row.role);
      }
    });

    when(/^Bob creates an event:$/, async (table) => {
      const user = context.users["Bob"];
      const eventData = parseTableToObject(table);
      const testClass = context.classes["CSE 210"];

      try {
        const event = await eventService.createEvent({
          title: eventData.title,
          description: eventData.description,
          type: eventData.type,
          startTime: new Date(eventData.startTime),
          endTime: new Date(eventData.endTime),
          location: eventData.location,
          userId: user.id,
          classId: testClass.id,
        });
        context.lastEvent = event;
        context.lastError = null;
      } catch (error) {
        context.lastError = error;
        context.lastEvent = null;
      }
    });

    then("the event should be created successfully", () => {
      if (context.lastError) {
        console.log(
          "Event creation error:",
          context.lastError.message || context.lastError,
        );
      }
      expect(context.lastEvent).not.toBeNull();
      expect(context.lastEvent).toHaveProperty("id");
      expect(context.lastError).toBeNull();
    });

    then(/^the event should have type "([^"]*)"$/, (expectedType) => {
      expect(context.lastEvent.type).toBe(expectedType);
    });
  });

  test("Get user event permissions", ({ given, and, when, then }) => {
    given(/^the following users exist:$/, async (table) => {
      for (const row of table) {
        const user = await createTestUser({
          name: row.name,
          email: row.email,
          preferredName: row.preferredName,
        });
        context.users[row.name] = user;
      }
    });

    and(/^the following class exists:$/, async (table) => {
      for (const row of table) {
        const testClass = await createTestClass({
          name: row.name,
          quarter: row.quarter,
          inviteCode: "TEST123",
        });
        context.classes[row.name] = testClass;
      }
    });

    and(/^the following class roles exist:$/, async (table) => {
      for (const row of table) {
        await createTestClassRole(row.user, row.class, row.role);
      }
    });

    and(/^the following group exists:$/, async (table) => {
      for (const row of table) {
        const group = await createTestGroup({ name: row.name }, row.class);
        context.groups[row.name] = group;
      }
    });

    and(/^the following group roles exist:$/, async (table) => {
      for (const row of table) {
        await createTestGroupRole(row.user, row.group, row.role);
      }
    });

    when(
      /^I check Bob's event permissions for class "([^"]*)"$/,
      async (className) => {
        const user = context.users["Bob"];
        const testClass = context.classes[className];
        context.lastPermissions = await eventService.getUserEventPermissions(
          user.id,
          testClass.id,
        );
      },
    );

    then(/^Bob should be able to create "([^"]*)" events$/, (eventType) => {
      expect(context.lastPermissions[eventType]).toBe(true);
    });

    and(/^Bob should be able to create "([^"]*)" events$/, (eventType) => {
      expect(context.lastPermissions[eventType]).toBe(true);
    });

    and(/^Bob should not be able to create "([^"]*)" events$/, (eventType) => {
      expect(context.lastPermissions[eventType]).toBe(false);
    });

    // Additional 'and' steps to match the feature file exactly
    and(/^Bob should not be able to create "([^"]*)" events$/, (eventType) => {
      expect(context.lastPermissions[eventType]).toBe(false);
    });

    and(/^Bob should not be able to create "([^"]*)" events$/, (eventType) => {
      expect(context.lastPermissions[eventType]).toBe(false);
    });
  });
});
