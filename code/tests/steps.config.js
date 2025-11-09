/**
 * Test Configuration
 *
 * Sets up the test application and request client
 */

import supertest from "supertest";
import { createApp } from "../src/app.js";

export const app = createApp();
export const request = supertest(app);
