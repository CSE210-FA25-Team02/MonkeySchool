# ADR-004: Application Quality & Developer Workflow Tooling (Validation, Testing, Linting, Formatting)

**Status:** Accepted  
**Date:** 2025-11-23  
**Authors:** Lillian Liu, Team Members  
**Version:** 1.0  

## Context

Our project requires reliable backend behavior, predictable data handling, and confidence that new changes do not break existing functionality.  
We also need input data validation to prevent malformed requests and ensure consistent API behavior.  

Constraints and goals include:  
- Automated testing that integrates well with Node.js and Express.  
- Support for behavior-driven development (BDD) for readable test cases.  
- Ability to test HTTP endpoints directly.  
- A validation library that is lightweight, widely used, and easy to integrate with Express.

## Decision

The project will use the following tools:

### Validation
- **Zod** as the runtime validation library for form data, API request bodies, and internal schema checks.

### Testing
- **Jest** as the test runner  
- **Supertest** for HTTP integration testing of Express routes  
- **Jest-Cucumber** for BDD-style scenario testing

### Development Workflow
- **ESLint** (with recommended rules) to enforce code quality and detect common errors  
- **Prettier** for automatic code formatting, integrated with ESLint where possible

## Alternatives Considered

### Testing Frameworks

| Alternative | Pros | Cons |
|------------|------|------|
| Jest | Fast, widely used, built-in mocks, great ecosystem | Slight overhead for non-React projects |
| Mocha + Chai | Flexible, customizable | Requires more setup, multiple libraries needed |
| Vitest | Fast, modern, Jest-compatible | Less tested in large Node backend environments |

### Validation Libraries

| Alternative | Pros | Cons |
|------------|------|------|
| Zod | Lightweight, functional, expressive schemas, works well in JS | Smaller ecosystem than Joi |
| Joi | Mature, widely used | Verbose syntax, heavier dependency |
| Yup | Familiar pattern for frontend devs | Less suited for backend validation cases |

## Consequences

### Positive
- Automated testing ensures API reliability and reduces regression risk.  
- BDD tests improve clarity for feature behavior.  
- Supertest enables full request–response validation without spinning up the server.  
- Zod provides strict runtime validation with minimal setup.

### Negative
- Jest-Cucumber adds extra structure to maintain.  
- Zod’s functional style may be unfamiliar to beginners.  
- API tests increase test execution time.

### System Impact
- Strengthens API robustness and reliability.  
- Improves code quality by enforcing validation at boundaries.  
- Slightly increases development setup complexity.

## Related Decisions
- ADR-005: Security and Development Tooling Strategy

## References
- [Jest Documentation](https://jestjs.io)  
- [Jest-Cucumber](https://github.com/bencompton/jest-cucumber)  
- [Supertest](https://github.com/visionmedia/supertest)  
- [Zod Documentation](https://zod.dev)
