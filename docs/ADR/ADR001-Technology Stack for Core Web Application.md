# ADR-001: Technology Stack for Core Web Application

**Status:** Accepted  
**Date:** 2025-11-16  
**Authors:** Team  
**Version:** 1.1

---

## Context
We need to select the foundational technologies for building our web application.  
The application requires:

- A reliable, scalable relational database
- A backend capable of handling API routes, authentication, and dynamic server-rendered content
- A frontend approach that supports dynamic interactions without a heavy JavaScript framework
- A type-safe ORM for clean and maintainable database access
- Technologies compatible with team experience and future scalability

We intend to build a server-driven application where most rendering and logic lives on the backend, while still supporting dynamic updates and modern UI behavior. HTMX was considered to avoid large frontend frameworks like React.

---

## Decision
We will use the following technologies as the foundation of our application:

- **Database:** PostgreSQL  
- **Backend:** Node.js  
- **ORM:** Prisma  
- **Frontend:** HTML, CSS, JavaScript, and **HTMX**

HTMX will be used to enable dynamic content loading, partial page updates, form interactions, and modal-style UX patterns — all without adopting a full SPA framework.

This stack allows us to maintain a simple server-rendered architecture while still supporting interactive behavior.

---

## Alternatives Considered

### **Alternative Backend: PHP**
| Pros | Cons |
|------|-------|
| Mature language with widespread support | Less alignment with team’s JavaScript experience |
| Good for server-rendered architectures | Harder to share code with frontend JS |
| Simple hosting | We have more expertise with Node.js |

### **Alternative Frontend Approaches**
**React, Vue, Angular** were considered.

- Pros: Full component systems and SPA capabilities  
- Cons: Increased complexity, bundlers, state management, larger learning curve  
- HTMX provides dynamic behavior **without building an SPA**, which matches our simpler server-driven architecture.

### **Alternative ORM / Data Access**
Considered **Knex.js**, **TypeORM**, and **Sequelize**.

- Prisma provides a better developer experience, strict typing, easier migrations, and predictable query building.

### **Alternative Databases**
**MySQL**, **MariaDB**, and **MongoDB** were considered.

- PostgreSQL was chosen for its reliability, ACID compliance, relational strength, and JSONB flexibility.

---

## Consequences

### **Positive Consequences**
- Unified language (JavaScript) across backend and frontend scripting.
- HTMX enables dynamic interactions with **minimal JavaScript**, reducing frontend complexity.
- HTMX allows the team to stay server-driven and avoid SPA overhead.
- PostgreSQL provides reliable transactions, strong relational features, and future scalability.
- Prisma guarantees type-safe data access and easy CRUD workflows.
- Easy deployment on platforms like Render, Railway, Fly.io, Docker, etc.
- Smaller bundle sizes and improved performance due to avoiding heavy frameworks.

### **Negative Consequences**
- HTMX is powerful but may require more backend endpoints for granular interactions.
- Complex interactive UI may eventually require additional JavaScript.
- Node.js async patterns require careful error handling.
- Prisma abstracts SQL, which may limit extreme performance tuning.
- PostgreSQL has more memory overhead than lighter alternatives.

---

## Related Decisions
- ADR-002: Database schema and migration strategy with Prisma  

---

## References
- https://www.postgresql.org/  
- https://nodejs.org/  
- https://htmx.org/  
- https://www.prisma.io/  
- Internal stack discussion (November 2025)
