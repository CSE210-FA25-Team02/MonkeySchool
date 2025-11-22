export default {
  testEnvironment: "node",
  transform: {},
  moduleFileExtensions: ["js", "json", "node"],
  testMatch: ["**/*.steps.js", "**/*.test.js"],
  collectCoverage: true,
  coverageReporters: ["text-summary", "lcov"],
  coverageDirectory: "coverage",
};
