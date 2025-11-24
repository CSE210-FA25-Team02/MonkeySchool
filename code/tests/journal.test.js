import { jest } from "@jest/globals";
import supertest from "supertest";

// Mock auth middleware
jest.unstable_mockModule("../src/middleware/auth.js", () => ({
  requireAuth: (req, res, next) => {
    req.user = { id: "user1", name: "Test User" };
    next();
  },
}));

// Mock database
const mockJournalEntry = {
  id: "entry1",
  userId: "user1",
  title: "Test Entry",
  workLog: "Did some work",
  reflection: "Felt good",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  journalEntry: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

jest.unstable_mockModule("../src/lib/prisma.js", () => ({
  prisma: mockPrisma,
}));

const { createApp } = await import("../src/app.js");
const app = createApp();

describe("Journal Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /journal", () => {
    it("should render journal page with list of entries", async () => {
      mockPrisma.journalEntry.findMany.mockResolvedValue([mockJournalEntry]);

      const res = await supertest(app).get("/journal");

      expect(res.status).toBe(200);
      expect(res.text).toContain("My Journal");
      expect(res.text).toContain("Test Entry");
      expect(mockPrisma.journalEntry.findMany).toHaveBeenCalledWith({
        where: { userId: "user1" },
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("POST /journal", () => {
    it("should create a new entry", async () => {
      mockPrisma.journalEntry.create.mockResolvedValue(mockJournalEntry);
      mockPrisma.journalEntry.findMany.mockResolvedValue([mockJournalEntry]);

      const res = await supertest(app)
        .post("/journal")
        .send({ title: "New", workLog: "Work", reflection: "Feel" });

      expect(res.status).toBe(200);
      expect(mockPrisma.journalEntry.create).toHaveBeenCalledWith({
        data: {
          userId: "user1",
          title: "New",
          workLog: "Work",
          reflection: "Feel",
        },
      });
    });
  });

  describe("GET /journal/:id", () => {
    it("should render entry detail", async () => {
      mockPrisma.journalEntry.findUnique.mockResolvedValue(mockJournalEntry);

      const res = await supertest(app).get("/journal/entry1");

      expect(res.status).toBe(200);
      expect(res.text).toContain("Test Entry");
      expect(res.text).toContain("Did some work");
    });

    it("should return 404 if not found", async () => {
      mockPrisma.journalEntry.findUnique.mockResolvedValue(null);

      const res = await supertest(app).get("/journal/entry999");

      expect(res.status).toBe(404);
    });

    it("should return 403 if not owner", async () => {
        mockPrisma.journalEntry.findUnique.mockResolvedValue({ ...mockJournalEntry, userId: "other" });

        const res = await supertest(app).get("/journal/entry1");

        expect(res.status).toBe(403);
      });
  });

  describe("PUT /journal/:id", () => {
    it("should update entry", async () => {
      mockPrisma.journalEntry.findUnique.mockResolvedValue(mockJournalEntry);
      mockPrisma.journalEntry.update.mockResolvedValue({
        ...mockJournalEntry,
        title: "Updated",
      });
      mockPrisma.journalEntry.findMany.mockResolvedValue([]);

      const res = await supertest(app)
        .put("/journal/entry1")
        .send({ title: "Updated", workLog: "Work", reflection: "Reflect" });

      expect(res.status).toBe(200);
      expect(mockPrisma.journalEntry.update).toHaveBeenCalled();
      expect(res.text).toContain("Updated");
    });
  });

  describe("DELETE /journal/:id", () => {
    it("should delete entry", async () => {
      mockPrisma.journalEntry.findUnique.mockResolvedValue(mockJournalEntry);
      mockPrisma.journalEntry.delete.mockResolvedValue(mockJournalEntry);
      mockPrisma.journalEntry.findMany.mockResolvedValue([]);

      const res = await supertest(app).delete("/journal/entry1");

      expect(res.status).toBe(200);
      expect(mockPrisma.journalEntry.delete).toHaveBeenCalledWith({
        where: { id: "entry1" },
      });
    });
  });
});