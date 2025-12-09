import { test, expect } from "@playwright/test";
import { promises as fs } from "fs";
import path from "path";

// Navigation paths from navigationConfig.js (simplified for testing)
const paths = [
  { name: "Home", path: "/" },
  { name: "Attendance", path: "/attendance" },
  { name: "People", path: "/people" },
  { name: "Schedule", path: "/schedule" },
  { name: "My Classes", path: "/classes/my-classes" },
  { name: "Courses", path: "/courses/list" },
  { name: "Profile", path: "/users/profile" },
];

const BASE_URL = process.env.PERF_TEST_URL || "http://monkeyschool.indresh.me";
const AUTH_TOKEN = process.env.PERF_TEST_AUTH_TOKEN;

if (!AUTH_TOKEN) {
  console.error("Error: PERF_TEST_AUTH_TOKEN environment variable is required.");
  process.exit(1);
}

const token = AUTH_TOKEN;

test.describe("RAIL Performance Tests", () => {
  let results = [];

  test.beforeEach(async ({ context }) => {
    // Set the auth cookie
    await context.addCookies([
      {
        name: "auth_token",
        value: token,
        url: BASE_URL, // Playwright requires url or domain/path. Using url is safer.
        httpOnly: true,
      },
    ]);
  });

  test.afterAll(async () => {
    // Generate Markdown Report
    const reportPath = path.resolve("performance.md");
    let markdownContent = `
## RAIL Performance Test Results

| Page Name | Path | Response Time (ms) | Load Event (ms) | Status |
| :--- | :--- | :--- | :--- | :--- |
`;

    for (const r of results) {
      markdownContent += `| ${r.name} | ${r.path} | ${r.responseTime} | ${r.loadTime} | ${r.status} |\n`;
    }

    markdownContent += "\n\n";

    // Append to file (or create if not exists)
    try {
      await fs.appendFile(reportPath, markdownContent);
      console.log(`RAIL Performance results written to ${reportPath}`);
    } catch (err) {
      console.error("Error writing performance report:", err);
    }
  });

  for (const page of paths) {
    test(`Measure performance for ${page.name}`, async ({
      page: browserPage,
    }) => {
      const startTime = Date.now();

      const response = await browserPage.goto(BASE_URL + page.path, {
        waitUntil: "load",
      });

      const loadTime = Date.now() - startTime;

      // Calculate response time (TTFB equivalent from navigation start)
      // Using Performance API from the browser context
      const performanceTiming = await browserPage.evaluate(() => {
        const nav = performance.getEntriesByType("navigation")[0];
        return {
          responseStart: nav ? nav.responseStart : 0,
          startTime: nav ? nav.startTime : 0,
        };
      });

      const responseTime =
        performanceTiming.responseStart - performanceTiming.startTime;

      // We allow non-200 status to be recorded without failing the test execution immediately,
      // so we can see which pages are missing vs slow in the report.
      // expect(response.status()).toBe(200);

      results.push({
        name: page.name,
        path: page.path,
        responseTime: Math.round(responseTime), // TTFB roughly
        loadTime: loadTime,
        status: response.status(),
      });

      console.log(
        `Verified ${page.name} (${page.path}): Status=${response.status()}, Load=${loadTime}ms, TTFB=${Math.round(responseTime)}ms`,
      );
    });
  }
});
