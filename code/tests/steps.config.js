// code/tests/steps.config.js

import supertest from "supertest";
import { createApp } from "../src/app.js";

export const app = createApp();
export const request = supertest(app);
