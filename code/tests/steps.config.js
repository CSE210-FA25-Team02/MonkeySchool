// code/tests/steps.config.js

import supertest from "supertest";
import { createApp } from "../src/app.js";

export const app = createApp();
export const request = supertest(app);
export const context = {
    student: undefined,
    response: undefined,
    // Add these for classRole tests
    user: undefined,
    klass: undefined,
    professor: undefined,
    ta: undefined,
    students: [],
    users: [],
    error: undefined,
    targetUser: undefined,
    student1: undefined,
    student2: undefined,
    professor1: undefined,
    professor2: undefined,
    nonExistentClassId: undefined
  };
