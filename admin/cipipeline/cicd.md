# MonkeySchool CI/CD Pipeline Status Report

**CSE210-FA25-Team02**

---

## Continuous Integration Overview

The CI pipeline is triggered automatically for pushes and pull requests targeting the `main` and `develop` branches. Key tasks include:

- **Dependency Installation:** Runs in an isolated environment.
- **Database Provisioning:** Uses a PostgreSQL service container for integration tests.
- **Validation and Testing:** Executes linting, formatting checks, unit tests, and documentation generation.
- **Code Scanning:** Uses GitHub's CodeQL to identify potential security vulnerabilities and coding errors.

### Configuration File

- **Location:** `.github/workflows/ci.yml`

### Components

- **Formatting Validation:** Enforced with Prettier.

- **Linting Analysis:** Performed using ESLint.
  - **Configuration File:** [`code/eslint.config.js`](https://github.com/CSE210-FA25-Team02/MonkeySchool/blob/main/code/eslint.config.js)
- **Documentation Generation:** Automated with JSDoc.
  - **Configuration File:** [`code/jsdoc.config.json`](https://github.com/CSE210-FA25-Team02/MonkeySchool/blob/main/code/jsdoc.config.json)
- **Testing Framework:** Jest with Prisma for database interactions.
  - **Configuration File:** [`code/jest.config.js`](https://github.com/CSE210-FA25-Team02/MonkeySchool/blob/main/code/jest.config.js)
- **Code Scanning with CodeQL:** Analyzes the codebase for security vulnerabilities and coding errors. This runs as a different job.

- **Coverage Reports:** Automatically posted on pull requests to `develop`.

### Environment Variables

The following environment variables are used in the CI pipeline:

- `DATABASE_URL`: Connection string for the test database.
- `NODE_ENV`: Specifies the environment (e.g., `test`).

### Observations

- Workflow runtime averages **51 seconds**.
- Temporary warnings occur due to test database initialization but do not impact overall functionality.

---

## Continuous Deployment Overview

The CD pipeline is triggered for changes pushed to the `main` branch. It automates the deployment process to the production environment, ensuring the latest stable code is live.

### Configuration File

- **Location:** `.github/workflows/deploy.yml`

### Components

- **Secure Deployment:** Uses SSH to connect to a remote Ubuntu server.
- **Repository Synchronization:** Pulls the latest code and loads environment variables.
- **Service Orchestration:** Restarts the system using Docker Compose.

### Environment Variables

The following environment variables are used in the CD pipeline:

- `SSH_HOST`: The hostname or IP address of the remote server.
- `SSH_USER`: The username for the SSH connection.
- `SSH_PRIVATE_KEY`: The private key for secure SSH authentication.
- `ENV_FILE`: Path to the `.env` file containing environment variables for the application.

### Observations

- Deployment completes in approximately **20 seconds**.
- Logs confirm successful execution of all deployment steps.

---

## Flow Diagram

![CI/CD Pipeline Diagram](./CICD-diagram-V1.png)
