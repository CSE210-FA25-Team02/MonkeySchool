# MonkeySchool

```
 __  __                    _               _  _    ___            _                         _   
|  \/  |   ___    _ _     | |__    ___    | || |  / __|    __    | |_      ___     ___     | |  
| |\/| |  / _ \  | ' \    | / /   / -_)    \_, |  \__ \   / _|   | ' \    / _ \   / _ \    | |  
|_|__|_|  \___/  |_||_|   |_\_\   \___|   _|__/   |___/   \__|_  |_||_|   \___/   \___/   _|_|_ 
_|"""""|_|"""""|_|"""""|_|"""""|_|"""""|_| """"|_|"""""|_|"""""|_|"""""|_|"""""|_|"""""|_|"""""|
"`-0-0-'"`-0-0-'"`-0-0-'"`-0-0-'"`-0-0-'"`-0-0-'"`-0-0-'"`-0-0-'"`-0-0-'"`-0-0-'"`-0-0-'"`-0-0-'
```

A production-grade web application built with Express, Prisma, and HTMX, focusing on accessibility and internationalization.

## Features

- **Modern Stack**: Express.js with HTMX for dynamic, hypermedia-driven interactions
- **Database**: PostgreSQL with Prisma ORM for type-safe database access
- **Clean Architecture**: Separation of concerns with controllers, services, and validators
- **Security**: Helmet, CORS, rate limiting, and environment-based configuration
- **Accessibility (a11y)**: Built with web accessibility standards in mind
- **Internationalization (i18n)**: Multi-language support ready
- **BDD Testing**: Behavior-Driven Development with Gherkin and Jest-Cucumber
- **Code Quality**: ESLint, Prettier, and comprehensive test coverage
- **CI/CD**: Automated testing and deployment pipelines

## Tech Stack

- **Runtime**: Node.js (>=24.11.0)
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Frontend**: HTMX, EJS templating
- **Validation**: Zod
- **Testing**: Jest, Jest-Cucumber, Supertest
- **Security**: Helmet, CORS, Express Rate Limit
- **Development**: ESLint, Prettier

## Prerequisites

- Node.js >= 24.11.0
- PostgreSQL database
- npm or yarn package manager

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd MonkeySchool
```

2. Install dependencies:

```bash
cd code
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

4. Configure your `.env` file with your database credentials and other settings.

5. Generate Prisma client:

```bash
npm run db:generate
```

6. Run database migrations:

```bash
npm run db:migrate
```

## Configuration

The application uses environment variables for configuration. Copy `.env.example` to `.env` and configure the following:

- `DATABASE_URL`: PostgreSQL connection string
- Other application-specific settings

Refer to `.env.example` for all available configuration options.

## Usage

### Development Mode

Start the development server:

```bash
npm run dev
```

### Production Mode

Start the production server:

```bash
npm start
```

### Database Commands

- **Generate Prisma Client**: `npm run db:generate`
- **Push schema changes**: `npm run db:push`
- **Run migrations**: `npm run db:migrate`
- **Open Prisma Studio**: `npm run db:studio`

### Code Quality

- **Lint code**: `npm run lint`
- **Format code**: `npm run format`

### Testing

Run all tests with coverage:

```bash
npm test
```
#### Performance Testing

We support RAIL performance testing and Stress testing.

1.  **Configure Environment**:
    Create a `.env` file (or set variables) with:
    ```bash
    PERF_TEST_URL=http://monkeyschool.indresh.me
    PERF_TEST_AUTH_TOKEN=<your_jwt_token>
    ```

2.  **Run RAIL Tests** (Playwright):
    Measures navigation performance for key pages.
    ```bash
    cd code && npm run test:perf:rail
    ```

3.  **Run Stress Tests** (Autocannon):
    Simulates 1000 concurrent users.
    ```bash
    cd code && npm run test:perf:stress
    ```


## Project Structure

```
code/
	src/
		app.js              # Express application setup
		server.js           # Server entry point
		config/             # Configuration files
		controllers/        # Request handlers
		services/           # Business logic layer
		routes/             # API routes
		middleware/         # Custom middleware
		validators/         # Input validation schemas
		lib/                # Shared libraries
		utils/              # Utility functions
		public/             # Static assets
	tests/                  # Test files
	features/               # BDD Gherkin feature files
	prisma/                 # Prisma schema and migrations
	package.json
```

## Development Workflow

This project follows clean architecture principles and BDD practices. Please review the [Contributing Guide](Contributing.md) for:

- Code structure and standards
- Naming conventions
- Frontend (HTMX/CSS) best practices
- BDD testing requirements
- Version control and CI/CD guidelines

## Telemetry & Monitoring

MonkeySchool includes a comprehensive telemetry pipeline using Fluent Bit, Loki, and Grafana for real-time log collection, storage, and visualization. This enables improved application observability and debugging capabilities.

### Pre-Deploy Setup (Local Development)

#### Prerequisites
- Docker and Docker Compose installed
- Ports available: 3001, 3100, 24224, 5140, 2020, 5672, 15672

#### Step 1: Start the Application
```bash
# Navigate to MonkeySchool project directory
cd code

# Ensure the application is running
docker-compose up -d

# Verify application container is running
docker-compose ps
```

#### Step 2: Start Telemetry Pipeline
```bash
# Navigate to telemetry directory
cd ../telemetry/docker

# Start telemetry services
docker-compose up -d

# Verify all telemetry services are running
docker-compose ps
```

Expected services:
- `monkeyschool-loki` (port 3100) - Log storage
- `monkeyschool-fluent-bit` (ports 24224, 5140, 2020) - Log processing
- `monkeyschool-grafana` (port 3001) - Visualization
- `monkeyschool-rabbitmq` (ports 5672, 15672) - Message queue

#### Step 3: Access Grafana Dashboard
1. **Open Grafana UI:**
   - URL: `http://localhost:3001`

2. **Configure Loki Data Source:**
   - Go to **Configuration** → **Data Sources**
   - Click **"Add data source"**
   - Search for and select **"Loki"**
   - Set **URL** to: `http://loki:3100`
   - Click **"Save & Test"** (should show green success)

#### Step 4: View Application Logs
1. **Navigate to Explore:**
   - Click **Explore** in the left sidebar
   - Ensure **Loki** is selected as data source

2. **Query Logs:**
   - In **Label filters**, select **"app"**
   - Choose **"monkeyschool"** as the value
   - Click the **blue "Run query"** button (top-right)
   - View real-time application logs

### 🌐 Post-Deploy Setup (Production)

For production deployments, access the hosted Grafana instance:

- **Production Grafana URL:** https://grafana.monkeyschool.indresh.me/

The production environment has Loki pre-configured and ready for log exploration using the same query methods as local development.

### 📊 Log Query Examples

```logql
# View all application logs
{app="monkeyschool"}

# Filter HTTP access logs only
{app="monkeyschool"} |= "HTTP"

# Search for errors
{app="monkeyschool"} |= "ERROR"

# Filter specific API endpoints
{app="monkeyschool"} |= "/api/users"
```

### 🔧 Troubleshooting

**Services not starting:**
```bash
# Check service logs
docker-compose logs grafana
docker-compose logs loki
docker-compose logs fluent-bit
```

**Grafana connection issues:**
- Verify Loki is running: `docker-compose ps`
- Check Loki health: `curl http://localhost:3100/ready`
- Ensure data source URL is exactly: `http://loki:3100`

**No logs appearing:**
```bash
# Test log generation
echo '<14>Test log message' | nc -u localhost 5140

# Monitor Fluent Bit logs
docker-compose logs -f fluent-bit
```

### 📋 Service Health Checks

- **Grafana:** http://localhost:3001/api/health
- **Loki:** http://localhost:3100/ready
- **Fluent Bit:** http://localhost:2020
- **RabbitMQ Management:** http://localhost:15672

## Contributing

Please read [Contributing.md](Contributing.md) for details on our development standards, code of conduct, and the process for submitting pull requests.

### Key Standards

- **Clean Architecture**: Controllers handle HTTP, services contain business logic
- **Async/Await**: All async operations properly handled
- **Security**: No hardcoded secrets, all config via environment variables
- **BDD**: Gherkin feature files for all user-facing behavior
- **CSS**: BEM naming convention
- **Testing**: Full stack testing with edge cases covered

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Team

CSE210-FA25-Team02

---

For questions or support, please open an issue in the repository.
