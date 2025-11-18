# 🚀 MonkeySchool Backend Ramp-Up Guide (RAW Markdown Version)

This document explains how to set up, run, inspect, and test the backend locally.

---

## 1) Environment Variables (.env)

Create a `.env` file inside the `code/` directory:

Below is the .env I used, you can use whatever you like.

```
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}?schema=public"

PORT=3000
NODE_ENV=development

CORS_ORIGIN=http://localhost:3000

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=dbname

PGADMIN_DEFAULT_EMAIL=admin@admin.com
PGADMIN_DEFAULT_PASSWORD=admin
```

---

## 2) Start Database + PgAdmin (Docker Compose)

From inside the `code/` directory:

```
docker compose up -d
```

Check services:

```
docker ps
```

You should see:

| Service  | Purpose              |
| -------- | -------------------- |
| postgres | PostgreSQL database  |
| pgadmin  | Browser DB dashboard |

---

## 3) Initialize Database (First-Time Only)

Apply migrations:

```
npm run db:migrate
```

### (Optional) Seed Mock Example Data

You can pre-populate the database with a realistic **CSE 210 class** including roles and project groups:

```
node scripts/mock/db-seed.js
```

This will insert:

| Entity                | Count                                | Notes                         |
| --------------------- | ------------------------------------ | ----------------------------- |
| **1 Professor**       | `Prof. Powell`                       | Assigned role: `PROFESSOR`    |
| **1 Class**           | `CSE 210 (FA25)`                     | Auto inviteCode generated     |
| **14 Users**          | `user1@ucsd.edu` → `user14@ucsd.edu` | All have pronouns `they/them` |
| **2 TAs**             | Users 1–2                            | ClassRole: `TA`               |
| **2 Tutors**          | Users 3–4                            | ClassRole: `TUTOR`            |
| **10 Students**       | Users 5–14                           | ClassRole: `STUDENT`          |
| **2 Groups**          | `Team Alpha`, `Team Beta`            | Belong to CSE 210             |
| **Group Leaders**     | 1 per group                          | Assigned via `GroupRole`      |
| **Group Members**     | Remaining students auto-balanced     | Alternating assignment        |
| **Group Supervisors** | Each TA supervises one group         | Stored in `GroupSupervisor`   |

Example result summary printed in terminal:

```
✅ Seed complete!
Professor: tpowell@ucsd.edu
Class: CSE 210
Groups: [ 'Team Alpha', 'Team Beta' ]
```

---

## 4) View Database in PgAdmin

Open in browser:

```
http://localhost:5050
```

Login:

| Field    | Value           |
| -------- | --------------- |
| Email    | admin@admin.com |
| Password | admin           |

Add DB connection:

| Setting  | Value    |
| -------- | -------- |
| Host     | postgres |
| Username | user     |
| Password | password |

Now you can browse tables and run queries.

---

## 5) Running Tests (⚠ Warning About Data Reset)

Running automated test suite **will wipe the database**.

```
npm run test:coverage
```

If you want to avoid wiping your dev data, create a separate `.env.test`:

```
POSTGRES_DB=dbname_test
```

Re-run:

```
docker compose up -d
npm run db:migrate
npm run test:coverage
```

---

## 6) Running the Server

Development mode:

```
npm run dev
```

Production equivalent:

```
npm start
```

Server is available at:

```
http://localhost:3000
```

---

## 7) API Surface (Current)

### Class

| Method | Endpoint              | Description                    |
| ------ | --------------------- | ------------------------------ |
| POST   | /classes              | Create class (inviteCode auto) |
| GET    | /classes/:id          | Class info + members + groups  |
| GET    | /classes/invite/:code | Fetch class by invite code     |
| PUT    | /classes/:id          | Update class name/quarter      |
| DELETE | /classes/:id          | Delete class                   |

### ClassRole (User ↔ Class Membership)

| Method | Endpoint                    | Description              |
| ------ | --------------------------- | ------------------------ |
| POST   | /classRoles/assign          | Add or update class role |
| POST   | /classRoles/remove          | Remove membership        |
| GET    | /classRoles/:classId/roster | Return full roster       |

### User

| Method | Endpoint   | Description                       |
| ------ | ---------- | --------------------------------- |
| GET    | /users/:id | Get user + class/group membership |
| POST   | /users     | Create user                       |
| PUT    | /users/:id | Update user profile               |
| DELETE | /users/:id | Delete (cascades member records)  |

---

## 8) Service Layer Behaviors

| File                 | Responsibility                                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| class.service.js     | createClass() generates **8-char friendly invite code**, getClassById(), getClassByInviteCode(), updateClass(), deleteClass() |
| classRole.service.js | Validates roles (PROFESSOR / TA / TUTOR / STUDENT), ensures uniqueness, upserts, removes                                      |
| user.service.js      | CRUD with relationship includes; delete cascades via FK `onDelete: Cascade`                                                   |
