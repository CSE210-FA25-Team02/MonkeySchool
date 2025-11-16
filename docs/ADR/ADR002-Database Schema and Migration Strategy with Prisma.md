# ADR-002: Database Schema and Migration Strategy with Prisma

**Status:** Accepted  
**Date:** 2025-11-16  
**Authors:** Team  
**Version:** 1.0

---

## Context
Our application requires a relational data model that supports:

- Multiple classes, each with many enrolled users
- Role-based memberships (professor, TA, tutor, student)
- Project groups inside each class
- Group-level roles (leader, member)
- Supervisors assigned to groups (e.g., TAs)
- User profiles with metadata such as pronouns, bio, links, photo, etc.

To maintain long-term consistency and make the database easy for developers to modify, we need:

- A well-defined relational schema  
- Clear rules for relations (unique constraints, cascading deletes, etc.)
- Predictable migrations that can evolve safely
- A type-safe ORM that prevents runtime errors

Prisma was chosen in ADR-001 as our ORM; this ADR defines the actual schema and our migration strategy.

---

## Decision
We will use a **relational data model** implemented in **PostgreSQL**, with **Prisma** as our schema definition and migration tool.  
Key structural decisions include:

### **1. Use `cuid()` primary keys for all models**
- Provides unique, URL-safe, sortable IDs  
- Avoids exposing sequential IDs  
- Works well in distributed systems  

### **2. Use strong relational modeling with explicit join tables**
We define the following relationships:

- **`Class` ↔ `ClassRole` ↔ `User`**  
- **`Group` ↔ `GroupRole` ↔ `User`**  
- **`Group` ↔ `GroupSupervisor` ↔ `User`**

Each join model (ClassRole, GroupRole, GroupSupervisor) stores:

- `userId`
- `classId` or `groupId`
- A unique constraint to prevent duplicate membership rows

### **3. Use `onDelete: Cascade` for dependent relational records**
If a class or group is deleted:

- class roles  
- group roles  
- supervisors  

should be deleted automatically.  
This ensures we do *not* leave orphaned rows in relational tables.

### **4. Keep Users persistent even if classes/groups are deleted**
Users should **not** be deleted automatically.  
Their memberships are removed, but their profiles persist.

### **5. Use Prisma Migrate for schema evolution**
We rely on:

- `prisma migrate dev` during development  
- `prisma migrate deploy` in production  
- Migration folders committed to Git for reproducibility  

This ensures that schema changes are versioned, reviewable, and deterministic.

---

## Schema Summary
Below is a high-level summary of the adopted schema structure:

### **User**
- Profile information  
- One-to-many: `classRoles`, `groupRoles`, `groupSupervises`  
- Indexed by name and email  

### **Class**
- Name, quarter, invite code  
- One-to-many: members, groups  

### **ClassRole**
- Enum role types: PROFESSOR, TA, TUTOR, STUDENT  
- Unique constraint: `(userId, classId)`  
- Cascade on delete for class/user cleanup  

### **Group**
- Name, optional logo/mantra/github fields  
- One-to-many: group members and supervisors  

### **GroupRole**
- Enum role types: LEADER, MEMBER  
- Unique constraint: `(userId, groupId)`  
- Cascade on delete  

### **GroupSupervisor**
- Connects supervisors (e.g., TAs) to groups  
- Unique constraint: `(userId, groupId)`  

This structure supports all required use cases for classes, roles, and group management.

---

## Alternatives Considered

### **Alternative 1: Embedding roles directly on User**
**Rejected** because:
- Users can belong to multiple classes  
- Users can have different roles in different groups  
- This violates normalization  
- Leads to ambiguous state and poor scalability  

### **Alternative 2: Many-to-many relations without explicit join models**
**Rejected** because:
- We need role metadata (role type enum)  
- Explicit join tables provide better clarity and constraints  
- Avoids migration complexity later  
- Better for auditing and future extension  

### **Alternative 3: UUIDs instead of CUIDs**
**Considered but not selected** because:
- Prisma recommends `cuid()` for default IDs  
- Safer for URL usage  
- UUIDs are fine but add overhead and are less readable  

### **Alternative 4: No cascading deletes**
**Rejected** because:  
- Would create orphaned join records after deletions  
- Requires manual cleanup logic  
- More prone to data corruption  

---

## Consequences

### **Positive Consequences**
- Strong, clean relational structure that matches how classes, groups, and roles actually work  
- Enum-based roles prevent invalid states  
- Cascading deletes keep data consistent without custom cleanup logic  
- Prisma’s schema file makes the data model self-documenting  
- Prisma Migrate ensures repeatable, safe schema evolution  
- Developers get full type safety when accessing relations  

### **Negative Consequences**
- Cascading deletes must be used carefully: deleting a class or group will remove many dependent records  
- Prisma Migrate creates one migration file per change, which requires careful PR review  
- Explicit join models mean more tables, but this is necessary for correctness  

---

## Migration Strategy
We adopt the following practices:

1. **Every schema change is done through Prisma Migrate**  
   - No manual changes inside the database  
   - All migrations committed to Git

2. **Developers run**  
   - npx prisma migrate dev to generate new migration files

3. **Production uses**
   - npx prisma migrate deploy

4. **Backward-incompatible changes** require:  
   - A deprecation migration  
   - A follow-up removal migration (e.g., removing a column)

5. **Seed data** lives in `prisma/seed.ts` and runs with:
   - npx prisma db seed OR
   - npm run db:seed

6. **Database resets** during development use:
   - npx prisma migrate reset

---

## References
- Prisma Migrate documentation  
- PostgreSQL relational design guidelines  
- ADR-001: Technology Stack for Core Web Application  

