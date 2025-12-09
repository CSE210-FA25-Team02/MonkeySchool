import autocannon from "autocannon";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.PERF_TEST_URL || "http://monkeyschool.indresh.me";
const AUTH_TOKEN = process.env.PERF_TEST_AUTH_TOKEN;

// Default token if env var is missing
const DEFAULT_TOKEN ="";

const token = AUTH_TOKEN || DEFAULT_TOKEN;

console.log(
  `Starting stress test against ${BASE_URL} with 1000 concurrent connections...`,
);

const instance = autocannon(
  {
    url: BASE_URL,
    connections: 1000, // 1000 concurrent connections
    duration: 20, // 20 seconds
    headers: {
      Cookie: `auth_token=${token}`,
    },
    requests: [
      {
        method: "GET",
        path: "/", // Targeting the home page
      },
      {
        method: "GET",
        path: "/courses/list", // Also hitting another page to simulate some mix
      },
    ],
  },
  (err, result) => {
    if (err) {
      console.error("Error running stress test:", err);
      process.exit(1);
    }

    const reportPath = path.resolve("performance.md");

    const markdownContent = `
## Stress Test Results

**Target:** ${BASE_URL}
**Concurrency:** ${result.connections}
**Duration:** ${result.duration}s

| Metric | Value |
| :--- | :--- |
| **Total Requests** | ${result.requests.total} |
| **Requests/sec** | ${result.requests.average} |
| **Latency (avg)** | ${result.latency.average} ms |
| **Latency (p99)** | ${result.latency.p99} ms |
| **Throughput (avg)** | ${(result.throughput.average / 1024 / 1024).toFixed(2)} MB/s |
| **Errors** | ${result.errors} |
| **Timeouts** | ${result.timeouts} |

### Detailed Latency Distribution
- p50: ${result.latency.p50} ms
- p90: ${result.latency.p90} ms
- p99: ${result.latency.p99} ms

`;

    fs.appendFile(reportPath, markdownContent, (writeErr) => {
      if (writeErr) {
        console.error("Error writing report:", writeErr);
      } else {
        console.log(`Stress test results written to ${reportPath}`);
      }
    });
  },
);

autocannon.track(instance, { renderProgressBar: true });
