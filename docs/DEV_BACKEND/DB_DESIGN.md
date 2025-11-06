# 📚 Database Design – MonkeySchool Collaboration Platform

This document explains the **database schema** implemented using **Prisma ORM + PostgreSQL**, including how foreign keys and role-based relationships are represented.

---

## 🧬 Entity Relationship Diagram (ERD)

![ERD](./ERD.png)

---

## 🗂 Overview

| Entity              | Description                                                |
| ------------------- | ---------------------------------------------------------- |
| **User**            | A person in the system (student / TA / professor / tutor)  |
| **Class**           | Represents a course section (e.g., "CSE 210 - Fall 2025")  |
| **ClassRole**       | A user's **role inside a class** (Professor, TA, Student…) |
| **Group**           | A project group inside a class                             |
| **GroupRole**       | A user's **role inside a group** (Leader / Member)         |
| **GroupSupervisor** | Assigns supervisors (e.g., TA supervising multiple groups) |

The core idea is **one user can belong to many classes and many groups**, each with **independent roles**.

---

## 🔗 How Foreign Keys Work in Prisma

Prisma uses **relation annotations** to generate foreign keys.

A foreign key relationship is defined using:

```
@relation(fields: [localField], references: [targetField], onDelete: Cascade)
```

Example:

```
user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
```

| Column   | References | Behavior                                                                 |
| -------- | ---------- | ------------------------------------------------------------------------ |
| `userId` | `User.id`  | When a User is deleted, related class/group memberships are also deleted |

---

## 🔗 Foreign Key Relationship Summary

| Table | Foreign Key | References | Description | Cascade Behavior |
|------|------------|------------|-------------|----------------|
| `class_roles.userId` | → `users.id` | Links a user to a class role | **Delete user → remove class memberships** |
| `class_roles.classId` | → `classes.id` | Links a class to user roles | **Delete class → remove all enrolled roles** |
| `groups.classId` | → `classes.id` | Groups belong to a class | **Delete class → delete its groups** |
| `group_roles.userId` | → `users.id` | A user’s membership in group | **Delete user → remove from groups** |
| `group_roles.groupId` | → `groups.id` | Links group to its members | **Delete group → remove group memberships** |
| `group_supervisors.userId` | → `users.id` | A supervisor user | **Delete user → supervisor link removed** |
| `group_supervisors.groupId` | → `groups.id` | Group being supervised | **Delete group → remove supervision link** |

---

## 🗄 Full Prisma Schema (Raw Code)

```
enum ClassRoleType {
  PROFESSOR
  TA
  TUTOR
  STUDENT
}

enum GroupRoleType {
  LEADER
  MEMBER
}

model User {
  id            String             @id @default(cuid())
  email         String             @unique
  name          String
  pronunciation String?
  pronouns      String?
  phone         String?
  photoUrl      String?
  github        String?
  timezone      String?
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt

  classRoles      ClassRole[]
  groupRoles      GroupRole[]
  groupSupervises GroupSupervisor[]

  @@index([name])
  @@index([email])
  @@map("users")
}

model Class {
  id         String     @id @default(cuid())
  name       String
  inviteCode String     @unique @default(uuid())
  quarter    String?
  createdAt  DateTime   @default(now())

  members ClassRole[]
  groups  Group[]

  @@map("classes")
}

model ClassRole {
  id      String        @id @default(cuid())
  role    ClassRoleType
  userId  String
  classId String

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  class Class @relation(fields: [classId], references: [id], onDelete: Cascade)

  @@unique([userId, classId], name: "user_class_unique")
  @@map("class_roles")
}

model Group {
  id      String    @id @default(cuid())
  name    String
  logoUrl String?
  mantra  String?
  github  String?

  classId String
  class   Class @relation(fields: [classId], references: [id], onDelete: Cascade)

  members     GroupRole[]
  supervisors GroupSupervisor[]

  @@map("groups")
}

model GroupRole {
  id      String        @id @default(cuid())
  role    GroupRoleType @default(MEMBER)
  userId  String
  groupId String

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  group Group @relation(fields: [groupId], references: [id], onDelete: Cascade)

  @@unique([userId, groupId], name: "user_group_unique")
  @@map("group_roles")
}

model GroupSupervisor {
  id      String   @id @default(cuid())
  userId  String
  groupId String

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  group Group @relation(fields: [groupId], references: [id], onDelete: Cascade)

  @@unique([userId, groupId], name: "user_group_supervisor_unique")
  @@map("group_supervisors")
}
```

---
