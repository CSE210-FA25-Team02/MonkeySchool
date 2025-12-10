
## Stress Test Results

**Target:** http://monkeyschool.indresh.me
**Concurrency:** 1000
**Duration:** 20.49s

| Metric | Value |
| :--- | :--- |
| **Total Requests** | 2627 |
| **Requests/sec** | 131.35 |
| **Latency (avg)** | 246.97 ms |
| **Latency (p99)** | 867 ms |
| **Throughput (avg)** | 0.08 MB/s |
| **Errors** | 1811 |
| **Timeouts** | 1811 |

### Detailed Latency Distribution
- p50: 238 ms
- p90: 243 ms
- p99: 867 ms

## RAIL Performance Test Results

| Page Name | Path | Response Time (ms) | Load Event (ms) | Status |
| :--- | :--- | :--- | :--- | :--- |
| Home | / | 1213 | 2396 | 200 |
| Attendance | /attendance | 1210 | 2317 | 200 |
| Schedule | /schedule | 1208 | 2278 | 404 |
| My Classes | /classes/my-classes | 1213 | 2320 | 200 |
| Profile | /users/profile | 1225 | 2339 | 200 |