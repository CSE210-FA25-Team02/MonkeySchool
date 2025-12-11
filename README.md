# MonkeySchool

```
 __  __                    _               _  _    ___            _                         _
|  \/  |   ___    _ _     | |__    ___    | || |  / __|    __    | |_      ___     ___     | |
| |\/| |  / _ \  | ' \    | / /   / -_)    \_, |  \__ \   / _|   | ' \    / _ \   / _ \    | |
|_|__|_|  \___/  |_||_|   |_\_\   \___|   _|__/   |___/   \__|_  |_||_|   \___/   \___/   _|_|_
_|"""""|_|"""""|_|"""""|_|"""""|_|"""""|_| """"|_|"""""|_|"""""|_|"""""|_|"""""|_|"""""|_|"""""|
"`-0-0-'"`-0-0-'"`-0-0-'"`-0-0-'"`-0-0-'"`-0-0-'"`-0-0-'"`-0-0-'"`-0-0-'"`-0-0-'"`-0-0-'"`-0-0-'
```

A production-grade collaboration platform for academic courses, built with Express, Prisma, and HTMX. MonkeySchool provides a comprehensive solution for managing classes, tracking attendance, facilitating group work, and fostering student engagement.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Development](#development)
- [Testing](#testing)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)
- [Team](#team)

## 🎯 Overview

MonkeySchool is a modern web application designed to streamline course management and enhance collaboration in academic settings. It supports multiple user roles (Professors, TAs, Tutors, and Students) and provides tools for class management, attendance tracking, group collaboration, scheduling, and student engagement.

### Key Capabilities

- **Class Management**: Create and manage courses with role-based access control
- **Attendance Tracking**: Real-time attendance polls and comprehensive record keeping
- **Group Collaboration**: Project groups with role management and supervision
- **Scheduling**: Calendar views for classes, events, and availability
- **Student Engagement**: Work journals, pulse checks, and activity tracking
- **Communication**: In-app chat and messaging system
- **Accessibility**: Built with WCAG standards and modern UX principles

## ✨ Features

### Core Features

- **🔐 Authentication & Authorization**

  - Google OAuth integration
  - JWT-based session management
  - Role-based access control (Professor, TA, Tutor, Student)

- **📚 Class Management**

  - Create and manage courses
  - Invite codes for class enrollment
  - Class directory and member management
  - Course session tracking

- **👥 Group Management**

  - Create project groups within classes
  - Assign group leaders and members
  - Supervisor assignment (TAs supervising groups)
  - Group-specific calendars and chat

- **✅ Attendance System**

  - Real-time attendance polls
  - Session-based attendance tracking
  - Comprehensive attendance records
  - Student and course-level analytics

- **📅 Scheduling & Calendar**

  - Week and day calendar views
  - Event creation (lectures, office hours, group meetings)
  - Availability management
  - Role-based event permissions

- **📝 Work Journals**

  - Daily work tracking
  - Mood tracking
  - Personal journal entries

- **💬 Communication**

  - In-app chat system
  - Group conversations
  - Direct messaging

- **📊 Engagement Tools**

  - Pulse checks (quick mood/status updates)
  - Activity tracking
  - Activity categories and punch cards

- **🎨 Modern UI/UX**
  - HTMX for dynamic interactions
  - Responsive design
  - Modern Eco-Tech design language
  - Accessibility-first approach

## 🛠 Tech Stack

### Backend

- **Runtime**: Node.js >= 20.0.0 (recommended: >= 24.11.0)
- **Framework**: Express.js 5.x
- **Database**: PostgreSQL
- **ORM**: Prisma 6.x
- **Authentication**: @auth/express, Google OAuth
- **Validation**: Zod
- **Security**: Helmet, CORS, Express Rate Limit

### Frontend

- **Templating**: EJS
- **Dynamic Interactions**: HTMX
- **Styling**: CSS with BEM methodology
- **Design System**: Modern Eco-Tech (see [ADR003](docs/ADR/ADR003-Brand_Specifications_and_UI_Standards.md))

### Development & Testing

- **Testing**: Jest, Jest-Cucumber, Supertest
- **BDD**: Gherkin feature files
- **Code Quality**: ESLint, Prettier
- **Documentation**: JSDoc
- **Performance**: Playwright, Autocannon

### DevOps

- **CI/CD**: GitHub Actions
- **Containerization**: Docker, Docker Compose
- **Security Scanning**: CodeQL

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20.0.0
- PostgreSQL (or Docker for containerized setup)
- npm or yarn

### Installation

For detailed installation instructions, see [INSTALLATION.md](INSTALLATION.md).

**Quick setup:**

```bash
# Clone the repository
git clone <repository-url>
cd MonkeySchool

# Install dependencies
cd code
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start database (using Docker)
docker compose up -d

# Initialize database
npm run db:generate
npm run db:migrate

# (Optional) Seed with sample data
npm run db:seed

# Start development server
npm run dev
```

Visit `http://localhost:3000` to access the application.

## ⚙️ Configuration

The application uses environment variables for configuration. Create a `.env` file in the `code/` directory with the following variables:

### Required Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/database?schema=public"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
JWT_SECRET="your-secure-jwt-secret"
```

### Optional Variables

```env
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_BASE_URL=http://localhost:3000
ATTENDANCE_DEFAULT_DURATION=10
```

For complete configuration details, see [INSTALLATION.md](INSTALLATION.md#environment-variables).

## 📖 Usage

### Development Mode

Start the development server with hot-reload:

```bash
npm run dev
```

### Production Mode

Start the production server:

```bash
npm start
```

### Database Commands

| Command               | Description                                   |
| --------------------- | --------------------------------------------- |
| `npm run db:generate` | Generate Prisma Client from schema            |
| `npm run db:push`     | Push schema changes to database (development) |
| `npm run db:migrate`  | Create and apply migrations                   |
| `npm run db:seed`     | Seed database with sample data                |
| `npm run db:studio`   | Open Prisma Studio (database GUI)             |

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Generate documentation
npm run docs
```

## 🧪 Testing

### Run All Tests

```bash
npm test
```

This runs all tests with coverage reporting.

### Performance Testing

**RAIL Performance Tests** (Playwright):
Measures navigation performance for key pages.

```bash
npm run test:perf:rail
```

**Stress Tests** (Autocannon):
Simulates 1000 concurrent users.

```bash
npm run test:perf:stress
```

For performance testing, configure these environment variables:

```env
PERF_TEST_URL=http://your-app-url
PERF_TEST_AUTH_TOKEN=your-jwt-token
```

### Test Coverage

Test coverage reports are generated automatically and posted to pull requests via CI.

## 📁 Project Structure

```
MonkeySchool/
├── code/                          # Main application code
│   ├── src/
│   │   ├── app.js                 # Express application setup
│   │   ├── server.js              # Server entry point
│   │   ├── config/                # Configuration files
│   │   ├── controllers/           # Request handlers (HTTP layer)
│   │   ├── services/              # Business logic layer
│   │   ├── routes/                # API routes
│   │   ├── middleware/            # Custom middleware
│   │   ├── validators/            # Input validation schemas
│   │   ├── lib/                   # Shared libraries
│   │   ├── utils/                 # Utility functions
│   │   └── public/                # Static assets (CSS, JS, images)
│   ├── tests/                     # Test files
│   ├── features/                  # BDD Gherkin feature files
│   ├── prisma/                    # Prisma schema and migrations
│   │   ├── models/                # Prisma model definitions
│   │   └── migrations/            # Database migrations
│   ├── scripts/                   # Utility scripts
│   └── package.json
├── docs/                          # Documentation
│   ├── ADR/                       # Architecture Decision Records
│   └── DEV_BACKEND/               # Backend development guides
├── admin/                         # Administrative documents
│   ├── meetings/                  # Meeting notes and retrospectives
│   ├── feedback/                  # Stakeholder feedback
│   └── cipipeline/                # CI/CD documentation
├── INSTALLATION.md                # Detailed installation guide
├── Contributing.md                # Contribution guidelines
├── CODE_OF_CONDUCT.md            # Code of conduct
└── README.md                      # This file
```

## 💻 Development

### Architecture

MonkeySchool follows **clean architecture** principles:

- **Controllers**: Handle HTTP concerns (request/response, status codes)
- **Services**: Contain all business logic (decoupled from Express)
- **Validators**: Input validation using Zod schemas
- **Middleware**: Authentication, authorization, error handling

### Development Workflow

1. **Create Feature Branch**: `git checkout -b feature/your-feature-name`
2. **Write BDD Tests**: Create Gherkin feature files in `code/features/`
3. **Implement Feature**: Follow clean architecture principles
4. **Run Tests**: Ensure all tests pass
5. **Code Quality**: Run linter and formatter
6. **Create Pull Request**: CI will run tests and checks automatically

### Coding Standards

Please review [Contributing.md](Contributing.md) for:

- Code structure and standards
- Naming conventions (camelCase, PascalCase, BEM)
- BDD testing requirements
- Git workflow and commit messages
- CSS/HTMX best practices

### Key Development Principles

- **Clean Architecture**: Separation of concerns between layers
- **BDD First**: Write Gherkin scenarios before implementation
- **Security**: No hardcoded secrets, environment-based configuration
- **Accessibility**: WCAG AA compliance
- **Testing**: Full stack testing with edge cases

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


## 📚 Documentation

### Getting Started

- [INSTALLATION.md](INSTALLATION.md) - Complete installation guide
- [Contributing.md](Contributing.md) - Development standards and guidelines

### Architecture

- [docs/ADR/](docs/ADR/) - Architecture Decision Records
  - [ADR001](docs/ADR/ADR001-Technology%20Stack%20for%20Core%20Web%20Application.md) - Technology Stack
  - [ADR002](docs/ADR/ADR002-Database%20Schema%20and%20Migration%20Strategy%20with%20Prisma.md) - Database Schema
  - [ADR003](docs/ADR/ADR003-Brand_Specifications_and_UI_Standards.md) - UI Standards
  - [ADR004](docs/ADR/ADR004-Application%20Quality%20%26%20Developer%20Workflow%20Tooling.md) - Quality & Workflow
  - [ADR005](docs/ADR/ADR005-Security%20and%20Development%20Tooling%20Strategy.md) - Security Strategy
  - [ADR006](docs/ADR/ADR006-Telemetry%20Pipeline%20Architecture.md) - Telemetry Pipeline
  - [ADR007](docs/ADR/ADR007-Oracle%20Cloud%20Infrastructure%20VM%20Hosting.md) - Deployment Strategy

### Database

- [docs/DEV_BACKEND/DB_DESIGN.md](docs/DEV_BACKEND/DB_DESIGN.md) - Database design and ERD

### CI/CD

- [admin/cipipeline/cicd.md](admin/cipipeline/cicd.md) - CI/CD pipeline documentation
- [admin/cipipeline/MonkeySchool_CICD_Report.md](admin/cipipeline/MonkeySchool_CICD_Report.md) - CI/CD status report

## 🤝 Contributing

We welcome contributions! Please read [Contributing.md](Contributing.md) before submitting pull requests.

### Quick Contribution Checklist

- [ ] Read [Contributing.md](Contributing.md)
- [ ] Follow clean architecture principles
- [ ] Write BDD feature files for new functionality
- [ ] Ensure all tests pass (`npm test`)
- [ ] Run linter and formatter (`npm run lint`, `npm run format`)
- [ ] Update documentation as needed
- [ ] Create descriptive commit messages

### Reporting Issues

If you encounter a bug or have a feature request, please open an issue on GitHub with:

- Clear description of the issue
- Steps to reproduce (for bugs)
- Expected vs. actual behavior
- Environment details (OS, Node.js version, etc.)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

**CSE210-FA25-Team02**

MonkeySchool is developed as part of CSE 210 (Software Engineering) at UC San Diego.

---

## 🔗 Quick Links

- **Installation**: [INSTALLATION.md](INSTALLATION.md)
- **Contributing**: [Contributing.md](Contributing.md)
- **Code of Conduct**: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- **Architecture Decisions**: [docs/ADR/](docs/ADR/)
- **Backend Guide**: [docs/DEV_BACKEND/RAMP_UP.md](docs/DEV_BACKEND/RAMP_UP.md)

For questions or support, please open an issue in the repository.

---

**Built with ❤️ by CSE210-FA25-Team02**
