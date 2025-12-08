/**
 * Work Journal Tests
 * code/tests/workJournal/work-journal.steps.js
 */

import { loadFeature, defineFeature } from "jest-cucumber";
import { prisma } from "../../src/lib/prisma.js";
import { context } from "../steps.context.js";
import { request } from "../steps.config.js";
import { resetDatabase } from "../utils/reset-db.js";
import { generateToken } from "../utils/auth.test.helper.js";
import * as workJournalService from "../../src/services/workJournal.service.js";

const feature = loadFeature("./features/work-journal.feature");

defineFeature(feature, (test) => {
  beforeEach(async () => {
    await resetDatabase();
    context.user = undefined;
    context.user2 = undefined;
    context.token = undefined;
    context.token2 = undefined;
    context.response = undefined;
    context.journal = undefined;
  });

  test("Create a work journal entry with content only", ({
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
      }
    );

    when(
      /^the user creates a work journal with content "(.*)"$/,
      async (content) => {
        context.response = await request
          .post("/work-journals")
          .send({ content })
          .set("Cookie", `auth_token=${context.token}`);
      }
    );

    then(/^the work journal should be created successfully$/, () => {
      expect(context.response.status).toBe(201);
      expect(context.response.body).toHaveProperty("id");
      expect(context.response.body).toHaveProperty("content");
      expect(context.response.body.userId).toBe(context.user.id);
    });

    and(/^the journal should have content "(.*)"$/, (content) => {
      expect(context.response.body.content).toBe(content);
    });

    and(/^the journal should not have a mood$/, () => {
      expect(context.response.body.mood).toBeNull();
    });
  });

  test("Create a work journal entry with content and mood", ({
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
      }
    );

    when(
      /^the user creates a work journal with content "(.*)" and mood "(.*)"$/,
      async (content, mood) => {
        context.response = await request
          .post("/work-journals")
          .send({ content, mood })
          .set("Cookie", `auth_token=${context.token}`);
      }
    );

    then(/^the work journal should be created successfully$/, () => {
      expect(context.response.status).toBe(201);
      expect(context.response.body).toHaveProperty("id");
    });

    and(/^the journal should have content "(.*)"$/, (content) => {
      expect(context.response.body.content).toBe(content);
    });

    and(/^the journal should have mood "(.*)"$/, (mood) => {
      expect(context.response.body.mood).toBe(mood);
    });
  });

  test("Create a work journal entry with empty mood", ({
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
      }
    );

    when(
      /^the user creates a work journal with content "(.*)" and mood ""$/,
      async (content) => {
        context.response = await request
          .post("/work-journals")
          .send({ content, mood: "" })
          .set("Cookie", `auth_token=${context.token}`);
      }
    );

    then(/^the work journal should be created successfully$/, () => {
      expect(context.response.status).toBe(201);
    });

    and(/^the journal should have content "(.*)"$/, (content) => {
      expect(context.response.body.content).toBe(content);
    });

    and(/^the journal should not have a mood$/, () => {
      expect(context.response.body.mood).toBeNull();
    });
  });

  test("Cannot create work journal with empty content", ({
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
      }
    );

    when(
      /^the user attempts to create a work journal with content ""$/,
      async () => {
        context.response = await request
          .post("/work-journals")
          .send({ content: "" })
          .set("Cookie", `auth_token=${context.token}`);
      }
    );

    then(/^the user should receive an error response with status 400$/, () => {
      expect(context.response.status).toBe(400);
    });

    and(/^the error message should contain "(.*)"$/, (errorMessage) => {
      const responseText =
        context.response.body?.error ||
        context.response.text ||
        context.response.body?.message ||
        "";
      expect(responseText).toContain(errorMessage);
    });
  });

  test("Cannot create work journal with whitespace-only content", ({
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
      }
    );

    when(
      /^the user attempts to create a work journal with content "   "$/,
      async () => {
        context.response = await request
          .post("/work-journals")
          .send({ content: "   " })
          .set("Cookie", `auth_token=${context.token}`);
      }
    );

    then(/^the user should receive an error response with status 400$/, () => {
      expect(context.response.status).toBe(400);
    });

    and(/^the error message should contain "(.*)"$/, (errorMessage) => {
      const responseText =
        context.response.body?.error ||
        context.response.text ||
        context.response.body?.message ||
        "";
      expect(responseText).toContain(errorMessage);
    });
  });

  test("Get all work journals for the current user", ({
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
      }
    );

    and(
      /^(a )?work journal with content "(.*)" exists for user "(.*)"$/,
      async (_, content, userName) => {
        await workJournalService.createWorkJournal({
          userId: context.user.id,
          content,
        });
      }
    );

    and(
      /^(a )?work journal with content "(.*)" exists for user "(.*)"$/,
      async (_, content, userName) => {
        // Wait a bit to ensure different timestamps
        await new Promise((resolve) => setTimeout(resolve, 10));
        await workJournalService.createWorkJournal({
          userId: context.user.id,
          content,
        });
      }
    );

    when(/^the user retrieves all their work journals$/, async () => {
      context.response = await request
        .get("/work-journals")
        .set("Cookie", `auth_token=${context.token}`);
    });

    then(/^the response should contain (\d+) work journals$/, (count) => {
      expect(context.response.status).toBe(200);
      expect(Array.isArray(context.response.body)).toBe(true);
      expect(context.response.body.length).toBe(parseInt(count));
    });

    and(/^the journals should be ordered by most recent first$/, () => {
      const journals = context.response.body;
      for (let i = 0; i < journals.length - 1; i++) {
        const current = new Date(journals[i].createdAt);
        const next = new Date(journals[i + 1].createdAt);
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
      }
    });

    and(/^the first journal should have content "(.*)"$/, (content) => {
      expect(context.response.body[0].content).toBe(content);
    });
  });

  test("Get all work journals when user has none", ({ given, when, then }) => {
    given(
      /^a logged-in user "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.user = await prisma.user.create({
          data: { email, name, isProf: false },
        });
        context.token = generateToken(context.user);
      }
    );

    when(/^the user retrieves all their work journals$/, async () => {
      context.response = await request
        .get("/work-journals")
        .set("Cookie", `auth_token=${context.token}`);
    });

    then(/^the response should contain 0 work journals$/, () => {
      expect(context.response.status).toBe(200);
      expect(Array.isArray(context.response.body)).toBe(true);
      expect(context.response.body.length).toBe(0);
    });
  });

  test("Get a specific work journal by ID", ({ given, when, then, and }) => {
    given(
      /^a logged-in user "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.user = await prisma.user.create({
          data: { email, name, isProf: false },
        });
        context.token = generateToken(context.user);
      }
    );

    and(
      /^a work journal with content "(.*)" and mood "(.*)" exists for user "(.*)"$/,
      async (content, mood, userName) => {
        context.journal = await workJournalService.createWorkJournal({
          userId: context.user.id,
          content,
          mood,
        });
      }
    );

    when(/^the user retrieves the work journal by ID$/, async () => {
      context.response = await request
        .get(`/work-journals/${context.journal.id}`)
        .set("Cookie", `auth_token=${context.token}`);
    });

    then(/^the response should contain the work journal$/, () => {
      expect(context.response.status).toBe(200);
      expect(context.response.body).toHaveProperty("id");
      expect(context.response.body.id).toBe(context.journal.id);
    });

    and(/^the journal should have content "(.*)"$/, (content) => {
      expect(context.response.body.content).toBe(content);
    });

    and(/^the journal should have mood "(.*)"$/, (mood) => {
      expect(context.response.body.mood).toBe(mood);
    });
  });

  test("Cannot get a work journal that doesn't exist", ({
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
      }
    );

    when(
      /^the user attempts to retrieve a work journal with invalid ID "(.*)"$/,
      async (invalidId) => {
        context.response = await request
          .get(`/work-journals/${invalidId}`)
          .set("Cookie", `auth_token=${context.token}`);
      }
    );

    then(/^the user should receive an error response with status 404$/, () => {
      expect(context.response.status).toBe(404);
    });

    and(/^the error message should contain "(.*)"$/, (errorMessage) => {
      const responseText =
        context.response.body?.error ||
        context.response.text ||
        context.response.body?.message ||
        "";
      expect(responseText).toContain(errorMessage);
    });
  });

  test("Cannot get another user's work journal", ({
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
      }
    );

    and(
      /^a logged-in user "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.user2 = await prisma.user.create({
          data: { email, name, isProf: false },
        });
        context.token2 = generateToken(context.user2);
      }
    );

    and(
      /^(a )?work journal with content "(.*)" exists for user "(.*)"$/,
      async (_, content, userName) => {
        context.journal = await workJournalService.createWorkJournal({
          userId: context.user2.id,
          content,
        });
      }
    );

    when(
      /^user "(.*)" attempts to retrieve user "(.*)"'s work journal$/,
      async (userName1, userName2) => {
        context.response = await request
          .get(`/work-journals/${context.journal.id}`)
          .set("Cookie", `auth_token=${context.token}`);
      }
    );

    then(
      /^user "(.*)" should receive an error response with status 404$/,
      () => {
        expect(context.response.status).toBe(404);
      }
    );

    and(/^the error message should contain "(.*)"$/, (errorMessage) => {
      const responseText =
        context.response.body?.error ||
        context.response.text ||
        context.response.body?.message ||
        "";
      expect(responseText).toContain(errorMessage);
    });
  });

  test("Update work journal content", ({ given, when, then, and }) => {
    given(
      /^a logged-in user "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.user = await prisma.user.create({
          data: { email, name, isProf: false },
        });
        context.token = generateToken(context.user);
      }
    );

    and(
      /^(a )?work journal with content "(.*)" exists for user "(.*)"$/,
      async (_, content, userName) => {
        context.journal = await workJournalService.createWorkJournal({
          userId: context.user.id,
          content,
        });
      }
    );

    when(
      /^the user updates the work journal with content "(.*)"$/,
      async (newContent) => {
        context.response = await request
          .put(`/work-journals/${context.journal.id}`)
          .send({ content: newContent })
          .set("Cookie", `auth_token=${context.token}`);
      }
    );

    then(/^the work journal should be updated successfully$/, () => {
      expect(context.response.status).toBe(200);
      expect(context.response.body).toHaveProperty("id");
    });

    and(/^the journal should have content "(.*)"$/, (content) => {
      expect(context.response.body.content).toBe(content);
    });
  });

  test("Update work journal mood", ({ given, when, then, and }) => {
    given(
      /^a logged-in user "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.user = await prisma.user.create({
          data: { email, name, isProf: false },
        });
        context.token = generateToken(context.user);
      }
    );

    and(
      /^a work journal with content "(.*)" and mood "(.*)" exists for user "(.*)"$/,
      async (content, mood, userName) => {
        context.journal = await workJournalService.createWorkJournal({
          userId: context.user.id,
          content,
          mood,
        });
      }
    );

    when(
      /^the user updates the work journal with mood "(.*)"$/,
      async (newMood) => {
        context.response = await request
          .put(`/work-journals/${context.journal.id}`)
          .send({ mood: newMood })
          .set("Cookie", `auth_token=${context.token}`);
      }
    );

    then(/^the work journal should be updated successfully$/, () => {
      expect(context.response.status).toBe(200);
    });

    and(/^the journal should have mood "(.*)"$/, (mood) => {
      expect(context.response.body.mood).toBe(mood);
    });

    and(/^the journal should still have content "(.*)"$/, (content) => {
      expect(context.response.body.content).toBe(content);
    });
  });

  test("Update both work journal content and mood", ({
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
      }
    );

    and(
      /^a work journal with content "(.*)" and mood "(.*)" exists for user "(.*)"$/,
      async (content, mood, userName) => {
        context.journal = await workJournalService.createWorkJournal({
          userId: context.user.id,
          content,
          mood,
        });
      }
    );

    when(
      /^the user updates the work journal with content "(.*)" and mood "(.*)"$/,
      async (newContent, newMood) => {
        context.response = await request
          .put(`/work-journals/${context.journal.id}`)
          .send({ content: newContent, mood: newMood })
          .set("Cookie", `auth_token=${context.token}`);
      }
    );

    then(/^the work journal should be updated successfully$/, () => {
      expect(context.response.status).toBe(200);
    });

    and(/^the journal should have content "(.*)"$/, (content) => {
      expect(context.response.body.content).toBe(content);
    });

    and(/^the journal should have mood "(.*)"$/, (mood) => {
      expect(context.response.body.mood).toBe(mood);
    });
  });

  test("Remove mood from work journal", ({ given, when, then, and }) => {
    given(
      /^a logged-in user "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.user = await prisma.user.create({
          data: { email, name, isProf: false },
        });
        context.token = generateToken(context.user);
      }
    );

    and(
      /^a work journal with content "(.*)" and mood "(.*)" exists for user "(.*)"$/,
      async (content, mood, userName) => {
        context.journal = await workJournalService.createWorkJournal({
          userId: context.user.id,
          content,
          mood,
        });
      }
    );

    when(/^the user updates the work journal with mood ""$/, async () => {
      context.response = await request
        .put(`/work-journals/${context.journal.id}`)
        .send({ mood: "" })
        .set("Cookie", `auth_token=${context.token}`);
    });

    then(/^the work journal should be updated successfully$/, () => {
      expect(context.response.status).toBe(200);
    });

    and(/^the journal should not have a mood$/, () => {
      expect(context.response.body.mood).toBeNull();
    });
  });

  test("Cannot update work journal with empty content", ({
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
      }
    );

    and(
      /^(a )?work journal with content "(.*)" exists for user "(.*)"$/,
      async (_, content, userName) => {
        context.journal = await workJournalService.createWorkJournal({
          userId: context.user.id,
          content,
        });
      }
    );

    when(
      /^the user attempts to update the work journal with content ""$/,
      async () => {
        context.response = await request
          .put(`/work-journals/${context.journal.id}`)
          .send({ content: "" })
          .set("Cookie", `auth_token=${context.token}`);
      }
    );

    then(/^the user should receive an error response with status 400$/, () => {
      expect(context.response.status).toBe(400);
    });

    and(/^the error message should contain "(.*)"$/, (errorMessage) => {
      const responseText =
        context.response.body?.error ||
        context.response.text ||
        context.response.body?.message ||
        "";
      expect(responseText).toContain(errorMessage);
    });
  });

  test("Cannot update another user's work journal", ({
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
      }
    );

    and(
      /^a logged-in user "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.user2 = await prisma.user.create({
          data: { email, name, isProf: false },
        });
        context.token2 = generateToken(context.user2);
      }
    );

    and(
      /^(a )?work journal with content "(.*)" exists for user "(.*)"$/,
      async (_, content, userName) => {
        context.journal = await workJournalService.createWorkJournal({
          userId: context.user2.id,
          content,
        });
      }
    );

    when(
      /^user "(.*)" attempts to update user "(.*)"'s work journal$/,
      async (userName1, userName2) => {
        context.response = await request
          .put(`/work-journals/${context.journal.id}`)
          .send({ content: "Hacked content" })
          .set("Cookie", `auth_token=${context.token}`);
      }
    );

    then(
      /^user "(.*)" should receive an error response with status 404$/,
      () => {
        expect(context.response.status).toBe(404);
      }
    );

    and(/^the error message should contain "(.*)"$/, (errorMessage) => {
      const responseText =
        context.response.body?.error ||
        context.response.text ||
        context.response.body?.message ||
        "";
      expect(responseText).toContain(errorMessage);
    });
  });

  test("Delete a work journal entry", ({ given, when, then, and }) => {
    given(
      /^a logged-in user "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.user = await prisma.user.create({
          data: { email, name, isProf: false },
        });
        context.token = generateToken(context.user);
      }
    );

    and(
      /^(a )?work journal with content "(.*)" exists for user "(.*)"$/,
      async (_, content, userName) => {
        context.journal = await workJournalService.createWorkJournal({
          userId: context.user.id,
          content,
        });
      }
    );

    when(/^the user deletes the work journal$/, async () => {
      context.response = await request
        .delete(`/work-journals/${context.journal.id}`)
        .set("Cookie", `auth_token=${context.token}`);
    });

    then(/^the work journal should be deleted successfully$/, () => {
      expect(context.response.status).toBe(204);
    });

    and(/^the work journal should no longer exist$/, async () => {
      const journal = await prisma.workJournal.findUnique({
        where: { id: context.journal.id },
      });
      expect(journal).toBeNull();
    });
  });

  test("Cannot delete a work journal that doesn't exist", ({
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
      }
    );

    when(
      /^the user attempts to delete a work journal with invalid ID "(.*)"$/,
      async (invalidId) => {
        context.response = await request
          .delete(`/work-journals/${invalidId}`)
          .set("Cookie", `auth_token=${context.token}`);
      }
    );

    then(/^the user should receive an error response with status 404$/, () => {
      expect(context.response.status).toBe(404);
    });

    and(/^the error message should contain "(.*)"$/, (errorMessage) => {
      const responseText =
        context.response.body?.error ||
        context.response.text ||
        context.response.body?.message ||
        "";
      expect(responseText).toContain(errorMessage);
    });
  });

  test("Cannot delete another user's work journal", ({
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
      }
    );

    and(
      /^a logged-in user "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.user2 = await prisma.user.create({
          data: { email, name, isProf: false },
        });
        context.token2 = generateToken(context.user2);
      }
    );

    and(
      /^(a )?work journal with content "(.*)" exists for user "(.*)"$/,
      async (_, content, userName) => {
        context.journal = await workJournalService.createWorkJournal({
          userId: context.user2.id,
          content,
        });
      }
    );

    when(
      /^user "(.*)" attempts to delete user "(.*)"'s work journal$/,
      async (userName1, userName2) => {
        context.response = await request
          .delete(`/work-journals/${context.journal.id}`)
          .set("Cookie", `auth_token=${context.token}`);
      }
    );

    then(
      /^user "(.*)" should receive an error response with status 404$/,
      () => {
        expect(context.response.status).toBe(404);
      }
    );

    and(/^the error message should contain "(.*)"$/, (errorMessage) => {
      const responseText =
        context.response.body?.error ||
        context.response.text ||
        context.response.body?.message ||
        "";
      expect(responseText).toContain(errorMessage);
    });
  });

  test("Work journal content is trimmed", ({ given, when, then, and }) => {
    given(
      /^a logged-in user "(.*)" with email "(.*)" exists$/,
      async (name, email) => {
        context.user = await prisma.user.create({
          data: { email, name, isProf: false },
        });
        context.token = generateToken(context.user);
      }
    );

    when(
      /^the user creates a work journal with content "  Trimmed content  "$/,
      async () => {
        context.response = await request
          .post("/work-journals")
          .send({ content: "  Trimmed content  " })
          .set("Cookie", `auth_token=${context.token}`);
      }
    );

    then(/^the work journal should be created successfully$/, () => {
      expect(context.response.status).toBe(201);
    });

    and(/^the journal should have content "(.*)"$/, (content) => {
      expect(context.response.body.content).toBe(content);
    });
  });

  test("Update work journal content is trimmed", ({
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
      }
    );

    and(
      /^(a )?work journal with content "(.*)" exists for user "(.*)"$/,
      async (_, content, userName) => {
        context.journal = await workJournalService.createWorkJournal({
          userId: context.user.id,
          content,
        });
      }
    );

    when(
      /^the user updates the work journal with content "  Updated content  "$/,
      async () => {
        context.response = await request
          .put(`/work-journals/${context.journal.id}`)
          .send({ content: "  Updated content  " })
          .set("Cookie", `auth_token=${context.token}`);
      }
    );

    then(/^the work journal should be updated successfully$/, () => {
      expect(context.response.status).toBe(200);
    });

    and(/^the journal should have content "(.*)"$/, (content) => {
      expect(context.response.body.content).toBe(content);
    });
  });
});
