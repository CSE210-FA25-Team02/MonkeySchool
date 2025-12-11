# Installation Guide

This guide will walk you through setting up the MonkeySchool application on your local machine.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation Methods](#installation-methods)
  - [Method 1: Local Development Setup (Recommended)](#method-1-local-development-setup-recommended)
  - [Method 2: Docker Setup](#method-2-docker-setup)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** >= 20.0.0 (recommended: >= 24.11.0)
  - Check your version: `node --version`
  - Download from [nodejs.org](https://nodejs.org/) if needed
- **npm** (comes with Node.js) or **yarn**
  - Check your version: `npm --version`
- **PostgreSQL** >= 12.0 (if not using Docker)
  - Check your version: `psql --version`
  - Download from [postgresql.org](https://www.postgresql.org/download/)
- **Docker** and **Docker Compose** (optional, for containerized setup)
  - Check Docker: `docker --version`
  - Check Docker Compose: `docker compose version`
  - Download from [docker.com](https://www.docker.com/get-started)
- **Git** (for cloning the repository)
  - Check your version: `git --version`

## Installation Methods

### Method 1: Local Development Setup (Recommended)

This method is ideal for active development and provides the best debugging experience.

#### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd MonkeySchool
```

#### Step 2: Install Root Dependencies

```bash
npm install
```

This installs Husky for Git hooks.

#### Step 3: Install Application Dependencies

```bash
cd code
npm install
```

#### Step 4: Set Up Environment Variables

Create a `.env` file in the `code/` directory:

```bash
cd code
cp .env.example .env  # If .env.example exists
# OR create .env manually
```

Edit the `.env` file with your configuration. See [Environment Variables](#environment-variables) section for details.

#### Step 5: Set Up Database

**Option A: Using Docker Compose (Recommended for Development)**

From the `code/` directory:

```bash
docker compose up -d
```

This starts PostgreSQL and pgAdmin services. The database will be available at `localhost:5432`.

**Option B: Using Local PostgreSQL**

1. Create a PostgreSQL database:

   ```bash
   createdb monkeyschool_dev
   # OR using psql:
   psql -U postgres
   CREATE DATABASE monkeyschool_dev;
   \q
   ```

2. Update your `DATABASE_URL` in `.env`:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/monkeyschool_dev?schema=public"
   ```

#### Step 6: Initialize Database Schema

Generate Prisma client and run migrations:

```bash
npm run db:generate
npm run db:migrate
```

#### Step 7: (Optional) Seed Database with Sample Data

To populate the database with example data for testing:

```bash
npm run db:seed
```

This creates:

- 3 Professors
- 12 Classes
- 20 Users
- Multiple TAs, Tutors, and Students distributed across different classes
- Several Project Groups (see seed script for details)

#### Step 8: Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000` (or the port specified in your `.env` file).

### Method 2: Docker Setup

This method runs the entire application stack in containers, ideal for production-like environments.

#### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd MonkeySchool
```

#### Step 2: Navigate to Code Directory

```bash
cd code
```

#### Step 3: Set Up Environment Variables

Create a `.env` file in the `code/` directory with all required variables (see [Environment Variables](#environment-variables)).

#### Step 4: Build and Start Services

```bash
docker compose up -d
```

This will:

- Build the application Docker image
- Start PostgreSQL database
- Start pgAdmin (database management UI)
- Start the application server

#### Step 5: Access the Application

- **Application**: `http://localhost:3000` (or your configured PORT)
- **pgAdmin**: `http://localhost:5050`
  - Login with `PGADMIN_DEFAULT_EMAIL` and `PGADMIN_DEFAULT_PASSWORD` from your `.env`

#### Step 6: View Logs

```bash
docker compose logs -f app
```

## Environment Variables

Create a `.env` file in the `code/` directory with the following variables:

### Required Variables

```env
# Database Connection
DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"

# Google OAuth (for authentication)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# JWT Secret (generate a secure random string)
JWT_SECRET="your-secure-random-jwt-secret-key"
```

### Optional Variables (with defaults)

```env
# Server Configuration
NODE_ENV="development"                    # Options: development, production, test
PORT=3000                                  # Server port (1-65535)

# CORS Configuration
CORS_ORIGIN="http://localhost:3000"       # Allowed CORS origin

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000               # Time window in milliseconds (15 minutes)
RATE_LIMIT_MAX_REQUESTS=100               # Max requests per window

# Authentication
AUTH_BASE_URL="http://localhost:3000"     # Base URL for auth callbacks

# Attendance Settings
ATTENDANCE_DEFAULT_DURATION=10            # Default attendance duration in minutes (max 1440)
```

### Docker-Specific Variables

If using Docker Compose, also include:

```env
# PostgreSQL Configuration
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="your-secure-password"
POSTGRES_DB="monkeyschool"

# pgAdmin Configuration
PGADMIN_DEFAULT_EMAIL="admin@admin.com"
PGADMIN_DEFAULT_PASSWORD="admin"
```

### Example `.env` File

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/monkeyschool_dev?schema=public"

# Server
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:3000

# Security
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Auth
AUTH_BASE_URL=http://localhost:3000

# Attendance
ATTENDANCE_DEFAULT_DURATION=10

# Docker (if using Docker Compose)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=monkeyschool
PGADMIN_DEFAULT_EMAIL=admin@admin.com
PGADMIN_DEFAULT_PASSWORD=admin
```

## Database Setup

### Using Prisma Migrations

The application uses Prisma for database management. After setting up your database connection:

1. **Generate Prisma Client**:

   ```bash
   npm run db:generate
   ```

2. **Run Migrations**:

   ```bash
   npm run db:migrate
   ```

3. **View Database (Prisma Studio)**:
   ```bash
   npm run db:studio
   ```
   Opens a browser-based database viewer at `http://localhost:5555`

### Database Commands Reference

| Command               | Description                                   |
| --------------------- | --------------------------------------------- |
| `npm run db:generate` | Generate Prisma Client from schema            |
| `npm run db:push`     | Push schema changes to database (development) |
| `npm run db:migrate`  | Create and apply migrations                   |
| `npm run db:seed`     | Seed database with sample data                |
| `npm run db:studio`   | Open Prisma Studio (database GUI)             |

## Running the Application

### Development Mode

Starts the server with hot-reload (nodemon):

```bash
npm run dev
```

### Production Mode

Starts the server in production mode:

```bash
npm start
```

### Accessing the Application

Once running, access the application at:

- **Local**: `http://localhost:3000` (or your configured PORT)
- **Network**: `http://your-ip-address:3000`

## Verification

### Check Server Status

1. **Health Check**: Visit `http://localhost:3000` in your browser
2. **Check Logs**: Look for startup messages in the terminal
3. **Database Connection**: Verify no database connection errors in logs

### Test Database Connection

```bash
# Using Prisma Studio
npm run db:studio

# OR using psql (if PostgreSQL is installed locally)
psql $DATABASE_URL
```

### Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3000`

**Solution**:

- Change the `PORT` in your `.env` file
- Or stop the process using port 3000:

  ```bash
  # macOS/Linux
  lsof -ti:3000 | xargs kill -9

  # Windows
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  ```

#### 2. Database Connection Failed

**Error**: `Can't reach database server`

**Solutions**:

- Verify PostgreSQL is running:

  ```bash
  # Docker
  docker compose ps

  # Local
  pg_isready
  ```

- Check `DATABASE_URL` in `.env` matches your database configuration
- Ensure database exists:
  ```bash
  psql -U postgres -l
  ```

#### 3. Prisma Client Not Generated

**Error**: `@prisma/client did not initialize yet`

**Solution**:

```bash
npm run db:generate
```

#### 4. Migration Errors

**Error**: Migration conflicts or failures

**Solutions**:

- Reset database (⚠️ **WARNING**: This deletes all data):
  ```bash
  npx prisma migrate reset
  ```
- Check migration status:
  ```bash
  npx prisma migrate status
  ```

#### 5. Environment Variables Not Loading

**Error**: `Invalid environment variables`

**Solutions**:

- Ensure `.env` file is in the `code/` directory
- Check all required variables are set (see [Environment Variables](#environment-variables))
- Verify no syntax errors (no spaces around `=`, proper quotes)
- Restart the server after changing `.env`

#### 6. Google OAuth Not Working

**Error**: Authentication redirects fail

**Solutions**:

- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Ensure `AUTH_BASE_URL` matches your application URL
- Check Google Cloud Console OAuth redirect URIs include your `AUTH_BASE_URL`

#### 7. Docker Issues

**Error**: Container fails to start

**Solutions**:

- Check Docker is running: `docker ps`
- View container logs: `docker compose logs`
- Rebuild containers: `docker compose up -d --build`
- Check port conflicts (3000, 5432, 5050)

### Getting Help

If you encounter issues not covered here:

1. Check the [README.md](README.md) for additional information
2. Review [Contributing.md](Contributing.md) for development guidelines
3. Check existing [GitHub Issues](https://github.com/your-repo/issues)
4. Create a new issue with:
   - Your operating system and Node.js version
   - Error messages and logs
   - Steps to reproduce the issue

## Next Steps

After successful installation:

1. **Read the Documentation**:

   - [README.md](README.md) - Project overview
   - [Contributing.md](Contributing.md) - Development guidelines

2. **Explore the Codebase**:

   - Review the project structure in [README.md](README.md)
   - Check out feature files in `code/features/`
   - Examine ADRs in `docs/ADR/`

3. **Run Tests**:

   ```bash
   npm test
   ```

4. **Start Developing**:
   - Follow the coding standards in [Contributing.md](Contributing.md)
   - Write BDD feature files for new functionality
   - Ensure all tests pass before committing

---

**Happy Coding! 🐵📚**
