// code/tests/event/event.steps.js

import { loadFeature, defineFeature } from "jest-cucumber";
import { prisma } from "../../src/lib/prisma.js";
import { context } from "../steps.context.js";
import { request } from "../steps.config.js";
import { resetDatabase } from "../utils/reset-db.js";
import * as classService from "../../src/services/class.service.js";
import * as eventService from "../../src/services/event.service.js";
import * as classRoleService from "../../src/services/classRole.service.js";
import { generateToken } from "../utils/auth.test.helper.js";

const feature = loadFeature("./features/event-calendar.feature");

defineFeature(feature, (test) => {
  beforeEach(async () => {
    await resetDatabase();
    context.professor = undefined;
    context.student = undefined;
    context.klass = undefined;
    context.event = undefined;
    context.group = undefined;
    context.response = undefined;
    context.token = undefined;
    context.token2 = undefined;
    context.newTitle = undefined;
    context.formData = undefined;
  });

  // Helper function to define Background steps (reusable across all tests)
  const defineBackgroundSteps = (test) => {
    test.given(/^the database is reset$/, async () => {
      // Already done in beforeEach, but step needs to be defined
    });

    test.given(
      /^a logged-in professor "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.professor = await prisma.user.create({
          data: { email, name, isProf: true },
        });
        context.token = generateToken(context.professor);
      }
    );

    test.given(
      /^a logged-in student "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.student = await prisma.user.create({
          data: { email, name, isProf: false },
        });
        context.token2 = generateToken(context.student);
      }
    );

    test.given(
      /^a class named "(.*)" exists and includes "(.*)" as a professor$/,
      async (className, userName) => {
        context.klass = await classService.createClass({ name: className });
        await prisma.classRole.create({
          data: {
            userId: context.professor.id,
            classId: context.klass.id,
            role: "PROFESSOR",
          },
        });
      }
    );

    test.and(
      /^"(.*)" is enrolled in "(.*)" as a student$/,
      async (userName, className) => {
        await prisma.classRole.create({
          data: {
            userId: context.student.id,
            classId: context.klass.id,
            role: "STUDENT",
          },
        });
      }
    );
  };

  test("View event details in modal", ({ given, when, then, and }) => {
    // Include Background step definitions
    defineBackgroundSteps({ given, and });

    given(
      /^an event "(.*)" of type "(.*)" exists for class "(.*)" created by "(.*)"$/,
      async (eventTitle, eventType, className, creatorName) => {
        const user =
          creatorName === "Dr. Smith" ? context.professor : context.student;
        context.event = await prisma.event.create({
          data: {
            title: eventTitle,
            type: eventType,
            classId: context.klass.id,
            userId: user.id,
            startTime: new Date("2025-12-02T10:00:00Z"),
            endTime: new Date("2025-12-02T11:30:00Z"),
            isRecurring: false,
          },
        });
      }
    );

    when(/^I click on the event "(.*)"$/, async (eventTitle) => {
      context.response = await request
        .get(`/events/${context.event.id}`)
        .set("Cookie", `auth_token=${context.token}`)
        .set("HX-Request", "true");
    });

    then(/^I should see a modal with event details$/, () => {
      expect(context.response.status).toBe(200);
      expect(context.response.text).toContain("modal-event-detail");
      expect(context.response.text).toContain("modal-card");
    });

    and(/^the modal should display the event title "(.*)"$/, (title) => {
      expect(context.response.text).toContain(title);
    });

    and(/^the modal should display the event type "(.*)"$/, (typeLabel) => {
      // Check for the type label (e.g., "Lecture" for COURSE_LECTURE)
      expect(context.response.text).toMatch(new RegExp(typeLabel, "i"));
    });

    and(/^the modal should have an "(.*)" button$/, (buttonText) => {
      expect(context.response.text).toContain(buttonText);
    });

    and(/^the modal should have a "(.*)" button$/, (buttonText) => {
      expect(context.response.text).toContain(buttonText);
    });
  });

  test("View event details as student (read-only)", ({
    given,
    when,
    and,
    then,
  }) => {
    // Include Background step definitions
    defineBackgroundSteps({ given, and });
    given(
      /^an event "(.*)" of type "(.*)" exists for class "(.*)" created by "(.*)"$/,
      async (eventTitle, eventType, className, creatorName) => {
        const user =
          creatorName === "Dr. Smith" ? context.professor : context.student;
        context.event = await prisma.event.create({
          data: {
            title: eventTitle,
            type: eventType,
            classId: context.klass.id,
            userId: user.id,
            startTime: new Date("2025-12-02T10:00:00Z"),
            endTime: new Date("2025-12-02T11:30:00Z"),
            isRecurring: false,
          },
        });
      }
    );

    when(/^I am logged in as "(.*)"$/, async (userName) => {
      context.token2 = generateToken(context.student);
    });

    when(/^I click on the event "(.*)"$/, async (eventTitle) => {
      context.response = await request
        .get(`/events/${context.event.id}`)
        .set("Cookie", `auth_token=${context.token2}`)
        .set("HX-Request", "true");
    });

    then(/^I should see a modal with event details$/, () => {
      expect(context.response.status).toBe(200);
      expect(context.response.text).toContain("modal-event-detail");
    });

    and(/^the modal should not have an "(.*)" button$/, (buttonText) => {
      // Student should not see edit/delete buttons for events they can't modify
      const hasEditButton = context.response.text.includes(
        'onclick="openEditEventModal'
      );
      expect(hasEditButton).toBe(false);
    });

    and(/^the modal should not have a "(.*)" button$/, (buttonText) => {
      const hasDeleteButton = context.response.text.includes(
        'onclick="deleteEvent'
      );
      expect(hasDeleteButton).toBe(false);
    });
  });

  test("Edit an event", ({ given, when, and, then }) => {
    // Include Background step definitions
    defineBackgroundSteps({ given, and });
    given(
      /^an event "(.*)" of type "(.*)" exists for class "(.*)" created by "(.*)"$/,
      async (eventTitle, eventType, className, creatorName) => {
        const user =
          creatorName === "Dr. Smith" ? context.professor : context.student;
        context.event = await prisma.event.create({
          data: {
            title: eventTitle,
            type: eventType,
            classId: context.klass.id,
            userId: user.id,
            startTime: new Date("2025-12-02T10:00:00Z"),
            endTime: new Date("2025-12-02T11:30:00Z"),
            isRecurring: false,
          },
        });
      }
    );

    when(/^I click on the event "(.*)"$/, async (eventTitle) => {
      context.response = await request
        .get(`/events/${context.event.id}`)
        .set("Cookie", `auth_token=${context.token}`)
        .set("HX-Request", "true");
    });

    when(/^I click the "(.*)" button$/, async (buttonText) => {
      if (buttonText === "Edit") {
        context.response = await request
          .get(`/events/${context.event.id}/edit`)
          .set("Cookie", `auth_token=${context.token}`)
          .set("HX-Request", "true");
      }
    });

    then(
      /^I should see an edit form with the event details pre-filled$/,
      () => {
        expect(context.response.status).toBe(200);
        expect(context.response.text).toContain("Edit Event");
        expect(context.response.text).toContain('id="edit-event-form"');
        expect(context.response.text).toContain(context.event.title);
      }
    );

    when(/^I update the event title to "(.*)"$/, async (newTitle) => {
      context.newTitle = newTitle;
    });

    when(/^I submit the edit form$/, async () => {
      const eventDate = new Date(context.event.startTime);
      const dateStr = eventDate.toISOString().split("T")[0];
      const startTimeStr = eventDate
        .toTimeString()
        .split(" ")[0]
        .substring(0, 5);
      const endTimeStr = new Date(context.event.endTime)
        .toTimeString()
        .split(" ")[0]
        .substring(0, 5);

      context.response = await request
        .put(`/events/${context.event.id}`)
        .send({
          title: context.newTitle,
          type: context.event.type,
          date: dateStr,
          startTime: startTimeStr,
          endTime: endTimeStr,
          classId: context.klass.id,
        })
        .set("Cookie", `auth_token=${context.token}`)
        .set("HX-Request", "true");
    });

    then(
      /^the event should be updated with title "(.*)"$/,
      async (newTitle) => {
        const updatedEvent = await prisma.event.findUnique({
          where: { id: context.event.id },
        });
        expect(updatedEvent.title).toBe(newTitle);
      }
    );

    and(/^the calendar should refresh to show the updated event$/, () => {
      expect(context.response.status).toBe(200);
      expect(context.response.text).toContain("schedule-wrapper");
      expect(context.response.text).toContain(context.newTitle);
    });
  });

  test("Delete an event", ({ given, when, and, then }) => {
    // Include Background step definitions
    defineBackgroundSteps({ given, and });
    given(
      /^an event "(.*)" of type "(.*)" exists for class "(.*)" created by "(.*)"$/,
      async (eventTitle, eventType, className, creatorName) => {
        const user =
          creatorName === "Dr. Smith" ? context.professor : context.student;
        context.event = await prisma.event.create({
          data: {
            title: eventTitle,
            type: eventType,
            classId: context.klass.id,
            userId: user.id,
            startTime: new Date("2025-12-02T10:00:00Z"),
            endTime: new Date("2025-12-02T11:30:00Z"),
            isRecurring: false,
          },
        });
      }
    );

    when(/^I click on the event "(.*)"$/, async (eventTitle) => {
      context.response = await request
        .get(`/events/${context.event.id}`)
        .set("Cookie", `auth_token=${context.token}`)
        .set("HX-Request", "true");
    });

    when(/^I click the "(.*)" button$/, async (buttonText) => {
      // Delete button click - actual deletion happens in next step
    });

    when(/^I confirm the deletion$/, async () => {
      context.response = await request
        .delete(`/events/${context.event.id}`)
        .set("Cookie", `auth_token=${context.token}`)
        .set("HX-Request", "true");
    });

    then(/^the event "(.*)" should be deleted$/, async (eventTitle) => {
      const deletedEvent = await prisma.event.findUnique({
        where: { id: context.event.id },
      });
      expect(deletedEvent).toBeNull();
    });

    and(/^the calendar should refresh without the deleted event$/, () => {
      expect(context.response.status).toBe(200);
      expect(context.response.text).toContain("schedule-wrapper");
      // The deleted event title should not appear in the calendar content (check schedule-day-events, not scripts)
      const calendarContent =
        context.response.text.match(/schedule-day-events[\s\S]*?<\/div>/g) ||
        [];
      const hasEvent = calendarContent.some((content) =>
        content.includes("Lecture 1")
      );
      expect(hasEvent).toBe(false);
    });
  });

  test("Student cannot edit professor's event", ({
    given,
    when,
    and,
    then,
  }) => {
    // Include Background step definitions
    defineBackgroundSteps({ given, and });
    given(
      /^an event "(.*)" of type "(.*)" exists for class "(.*)" created by "(.*)"$/,
      async (eventTitle, eventType, className, creatorName) => {
        const user =
          creatorName === "Dr. Smith" ? context.professor : context.student;
        context.event = await prisma.event.create({
          data: {
            title: eventTitle,
            type: eventType,
            classId: context.klass.id,
            userId: user.id,
            startTime: new Date("2025-12-02T10:00:00Z"),
            endTime: new Date("2025-12-02T11:30:00Z"),
            isRecurring: false,
          },
        });
      }
    );

    when(/^I am logged in as "(.*)"$/, async (userName) => {
      context.token2 = generateToken(context.student);
    });

    when(/^I try to edit the event "(.*)"$/, async (eventTitle) => {
      context.response = await request
        .get(`/events/${context.event.id}/edit`)
        .set("Cookie", `auth_token=${context.token2}`);
    });

    then(/^I should receive a permission error$/, () => {
      expect(context.response.status).toBe(400);
      expect(context.response.text).toContain("permission");
    });

    and(/^the event should not be modified$/, async () => {
      const unchangedEvent = await prisma.event.findUnique({
        where: { id: context.event.id },
      });
      expect(unchangedEvent.title).toBe(context.event.title);
    });
  });

  test("Student cannot delete professor's event", ({
    given,
    when,
    and,
    then,
  }) => {
    // Include Background step definitions
    defineBackgroundSteps({ given, and });
    given(
      /^an event "(.*)" of type "(.*)" exists for class "(.*)" created by "(.*)"$/,
      async (eventTitle, eventType, className, creatorName) => {
        const user =
          creatorName === "Dr. Smith" ? context.professor : context.student;
        context.event = await prisma.event.create({
          data: {
            title: eventTitle,
            type: eventType,
            classId: context.klass.id,
            userId: user.id,
            startTime: new Date("2025-12-02T10:00:00Z"),
            endTime: new Date("2025-12-02T11:30:00Z"),
            isRecurring: false,
          },
        });
      }
    );

    when(/^I am logged in as "(.*)"$/, async (userName) => {
      context.token2 = generateToken(context.student);
    });

    when(/^I try to delete the event "(.*)"$/, async (eventTitle) => {
      context.response = await request
        .delete(`/events/${context.event.id}`)
        .set("Cookie", `auth_token=${context.token2}`)
        .set("HX-Request", "true");
    });

    then(/^I should receive a permission error$/, () => {
      expect(context.response.status).toBe(400);
      expect(context.response.text).toContain("permission");
    });

    and(/^the event should not be deleted$/, async () => {
      const stillExists = await prisma.event.findUnique({
        where: { id: context.event.id },
      });
      expect(stillExists).not.toBeNull();
    });
  });

  test("Group leader can edit group meeting", ({ given, and, when, then }) => {
    // Include Background step definitions
    defineBackgroundSteps({ given, and });
    given(
      /^a group "(.*)" exists for class "(.*)"$/,
      async (groupName, className) => {
        context.group = await prisma.group.create({
          data: {
            name: groupName,
            classId: context.klass.id,
          },
        });
      }
    );

    and(/^"(.*)" is a leader of "(.*)"$/, async (userName, groupName) => {
      await prisma.groupRole.create({
        data: {
          userId: context.student.id,
          groupId: context.group.id,
          role: "LEADER",
        },
      });
    });

    and(
      /^an event "(.*)" of type "(.*)" exists for class "(.*)" and group "(.*)" created by "(.*)"$/,
      async (eventTitle, eventType, className, groupName, creatorName) => {
        const user =
          creatorName === "Dr. Smith" ? context.professor : context.student;
        context.event = await prisma.event.create({
          data: {
            title: eventTitle,
            type: eventType,
            classId: context.klass.id,
            groupId: context.group.id,
            userId: user.id,
            startTime: new Date("2025-12-02T10:00:00Z"),
            endTime: new Date("2025-12-02T11:30:00Z"),
            isRecurring: false,
          },
        });
      }
    );

    when(/^I am logged in as "(.*)"$/, async (userName) => {
      context.token2 = generateToken(context.student);
    });

    when(/^I click on the event "(.*)"$/, async (eventTitle) => {
      context.response = await request
        .get(`/events/${context.event.id}`)
        .set("Cookie", `auth_token=${context.token2}`)
        .set("HX-Request", "true");
    });

    then(/^I should see a modal with event details$/, () => {
      expect(context.response.status).toBe(200);
      expect(context.response.text).toContain("modal-event-detail");
    });

    and(/^the modal should have an "(.*)" button$/, (buttonText) => {
      expect(context.response.text).toContain('onclick="openEditEventModal');
    });

    when(/^I click the "(.*)" button$/, async (buttonText) => {
      if (buttonText === "Edit") {
        context.response = await request
          .get(`/events/${context.event.id}/edit`)
          .set("Cookie", `auth_token=${context.token2}`);
      }
    });

    when(/^I update the event title to "(.*)"$/, async (newTitle) => {
      context.newTitle = newTitle;
    });

    when(/^I submit the edit form$/, async () => {
      const eventDate = new Date(context.event.startTime);
      const dateStr = eventDate.toISOString().split("T")[0];
      const startTimeStr = eventDate
        .toTimeString()
        .split(" ")[0]
        .substring(0, 5);
      const endTimeStr = new Date(context.event.endTime)
        .toTimeString()
        .split(" ")[0]
        .substring(0, 5);

      context.response = await request
        .put(`/events/${context.event.id}`)
        .send({
          title: context.newTitle,
          type: context.event.type,
          date: dateStr,
          startTime: startTimeStr,
          endTime: endTimeStr,
          classId: context.klass.id,
          group: context.group.id,
        })
        .set("Cookie", `auth_token=${context.token2}`)
        .set("HX-Request", "true");
    });

    then(
      /^the event should be updated with title "(.*)"$/,
      async (newTitle) => {
        const updatedEvent = await prisma.event.findUnique({
          where: { id: context.event.id },
        });
        expect(updatedEvent.title).toBe(newTitle);
      }
    );
  });

  test("Calendar displays events for current week", ({
    given,
    and,
    when,
    then,
  }) => {
    // Include Background step definitions
    defineBackgroundSteps({ given, and });
    given(
      /^an event "(.*)" of type "(.*)" exists for class "(.*)" created by "(.*)" on "(.*)"$/,
      async (eventTitle, eventType, className, creatorName, dateStr) => {
        const user =
          creatorName === "Dr. Smith" ? context.professor : context.student;
        const eventDate = new Date(dateStr + "T10:00:00Z");
        context.event = await prisma.event.create({
          data: {
            title: eventTitle,
            type: eventType,
            classId: context.klass.id,
            userId: user.id,
            startTime: eventDate,
            endTime: new Date(eventDate.getTime() + 90 * 60 * 1000), // 90 minutes later
            isRecurring: false,
          },
        });
      }
    );

    and(
      /^an event "(.*)" of type "(.*)" exists for class "(.*)" created by "(.*)" on "(.*)"$/,
      async (eventTitle, eventType, className, creatorName, dateStr) => {
        const user =
          creatorName === "Dr. Smith" ? context.professor : context.student;
        const eventDate = new Date(dateStr + "T10:00:00Z");
        await prisma.event.create({
          data: {
            title: eventTitle,
            type: eventType,
            classId: context.klass.id,
            userId: user.id,
            startTime: eventDate,
            endTime: new Date(eventDate.getTime() + 90 * 60 * 1000), // 90 minutes later
            isRecurring: false,
          },
        });
      }
    );

    when(
      /^I view the calendar for class "(.*)" for the week starting "(.*)"$/,
      async (className, weekStartStr) => {
        context.response = await request
          .get(
            `/classes/${context.klass.id}/schedule?view=week&date=${weekStartStr}`
          )
          .set("Cookie", `auth_token=${context.token}`);
      }
    );

    then(/^I should see "(.*)" in the calendar$/, (eventTitle) => {
      expect(context.response.status).toBe(200);
      expect(context.response.text).toContain(eventTitle);
    });

    and(/^I should see "(.*)" in the calendar$/, (eventTitle) => {
      expect(context.response.status).toBe(200);
      expect(context.response.text).toContain(eventTitle);
    });
  });

  test("Calendar shows correct day names", ({ given, when, then, and }) => {
    // Include Background step definitions
    defineBackgroundSteps({ given, and });
    when(
      /^I view the calendar for class "(.*)" for the week starting "(.*)"$/,
      async (className, weekStartStr) => {
        context.response = await request
          .get(
            `/classes/${context.klass.id}/schedule?view=week&date=${weekStartStr}`
          )
          .set("Cookie", `auth_token=${context.token}`);
      }
    );

    then(/^"(.*)" should be displayed as "(.*)"$/, (dateStr, dayName) => {
      expect(context.response.status).toBe(200);
      // Calendar shows abbreviations (MON, TUE) but we can check the full day name appears somewhere
      // or check that the date corresponds to the correct day abbreviation
      const date = new Date(dateStr);
      const dayIndex = date.getDay();
      const dayAbbrs = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      const expectedAbbr = dayAbbrs[dayIndex];
      expect(context.response.text).toContain(expectedAbbr);
    });

    and(/^"(.*)" should be displayed as "(.*)"$/, (dateStr, dayName) => {
      expect(context.response.status).toBe(200);
      const date = new Date(dateStr);
      const dayIndex = date.getDay();
      const dayAbbrs = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      const expectedAbbr = dayAbbrs[dayIndex];
      expect(context.response.text).toContain(expectedAbbr);
    });

    and(/^"(.*)" should be displayed as "(.*)"$/, (dateStr, dayName) => {
      expect(context.response.status).toBe(200);
      const date = new Date(dateStr);
      const dayIndex = date.getDay();
      const dayAbbrs = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      const expectedAbbr = dayAbbrs[dayIndex];
      expect(context.response.text).toContain(expectedAbbr);
    });
  });

  test("Create event via calendar", ({ given, when, then, and }) => {
    // Include Background step definitions
    defineBackgroundSteps({ given, and });
    when(
      /^I click "Create Event" on the calendar for class "(.*)"$/,
      async (className) => {
        // This would typically be a frontend action, but we can test the form rendering
        context.response = await request
          .get(`/classes/${context.klass.id}/schedule`)
          .set("Cookie", `auth_token=${context.token}`);
      }
    );

    then(/^I should see a create event form$/, () => {
      expect(context.response.status).toBe(200);
      expect(context.response.text).toContain("modal-create-event");
      expect(context.response.text).toContain("create-event-form");
    });

    when(/^I fill in the event form with:$/, async (dataTable) => {
      context.formData = {};
      // jest-cucumber passes dataTable as an array of objects: [{Field: "Title", Value: "New Lecture"}, ...]
      const rows = Array.isArray(dataTable)
        ? dataTable
        : dataTable.rawTable || [];

      const fieldMap = {
        title: "title",
        type: "type",
        date: "date",
        starttime: "startTime",
        endtime: "endTime",
        location: "location",
        description: "description",
      };

      rows.forEach((row) => {
        // Handle object format {Field: "...", Value: "..."}
        if (typeof row === "object" && row !== null && !Array.isArray(row)) {
          const fieldKey = (row.Field || "").toLowerCase().replace(/\s+/g, "");
          const value = row.Value;
          if (fieldKey && value !== undefined) {
            const mappedField = fieldMap[fieldKey] || fieldKey;
            context.formData[mappedField] = value;
          }
        } else if (Array.isArray(row) && row.length >= 2) {
          // Handle array format ["Field", "Value"] or ["Title", "New Lecture"]
          const fieldKey = row[0].toLowerCase().replace(/\s+/g, "");
          const value = row[1];
          if (fieldKey && value !== undefined && fieldKey !== "field") {
            const mappedField = fieldMap[fieldKey] || fieldKey;
            context.formData[mappedField] = value;
          }
        }
      });
    });

    when(/^I submit the create event form$/, async () => {
      const formData = {
        title: context.formData.title,
        type: context.formData.type,
        date: context.formData.date,
        startTime: context.formData.startTime,
        endTime: context.formData.endTime,
        classId: context.klass.id,
        description: context.formData.description || null,
        location: context.formData.location || null,
      };
      context.response = await request
        .post("/events/create")
        .send(formData)
        .set("Cookie", `auth_token=${context.token}`)
        .set("HX-Request", "true");
    });

    then(/^a new event "(.*)" should be created$/, async (eventTitle) => {
      const newEvent = await prisma.event.findFirst({
        where: {
          title: eventTitle,
          classId: context.klass.id,
        },
      });
      expect(newEvent).not.toBeNull();
      expect(newEvent.title).toBe(eventTitle);
    });

    and(/^the calendar should refresh to show the new event$/, () => {
      expect(context.response.status).toBe(200);
      expect(context.response.text).toContain("schedule-wrapper");
      expect(context.response.text).toContain(context.formData.title);
    });
  });
});
