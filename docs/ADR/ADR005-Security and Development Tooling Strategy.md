# ADR-005: Security and Development Tooling Strategy

**Status:** Accepted  
**Date:** 2025-11-23  
**Authors:** Lillian Liu, Team Members  
**Version:** 1.0  

## Context

Our backend server handles user interactions, potentially sensitive data, and cross-origin requests.  
We need to mitigate common vulnerabilities, reduce attack surfaces, ensure code quality, and maintain a consistent code style across contributors.

Constraints and goals include:  
- Secure default HTTP headers.  
- Protection against DOS and brute-force attacks.  
- Control over which domains may access API resources.  
- Automated formatting to reduce merge conflicts.  
- Linting to enforce consistent, error-free JavaScript code.

## Decision

The project will use the following security and development tools:

### Security
- **Helmet** for secure HTTP headers.  
- **CORS** for managing cross-origin access.  
- **Express Rate Limit** to protect against repeated or abusive requests.

### Development Tooling
- **ESLint** for JavaScript linting and error detection.  
- **Prettier** for automatic code formatting.  

## Alternatives Considered

### Security Tools

| Alternative | Pros | Cons |
|------------|------|------|
| Helmet (chosen) | Simple, strong defaults, Express-friendly | Must configure overrides for certain headers |
| Manual header setup | Fine-grained control | Higher risk of mistakes, more maintenance |
| OWASP security middleware packages | High security coverage | More complex to integrate |

### Rate Limiting

| Alternative | Pros | Cons |
|------------|------|------|
| Express Rate Limit (chosen) | Easy setup, widely used | Not suitable for distributed rate limiting |
| Nginx rate limiting | Very strong, high performance | Requires infrastructure-level configuration |
| Custom middleware | Fully customizable | Harder to maintain and test |

### Linting & Formatting

| Alternative | Pros | Cons |
|------------|------|------|
| ESLint + Prettier (chosen) | Best JS ecosystem support, catches errors, ensures consistency | Requires config files and plugin setup |
| StandardJS | Zero configuration | Less flexible, opinionated ruleset |
| No linting/formatting tools | Zero setup | Inconsistent code quality, more bugs |

## Consequences

### Positive
- Improved security posture with minimal effort using well-established middleware.  
- CORS allows controlled exposure of the API to frontend clients.  
- Rate limiting reduces risk of abuse.  
- ESLint and Prettier improve developer experience and prevent style-related merge conflicts.

### Negative
- Additional configuration overhead.  
- Strict linting may initially slow down contributors unfamiliar with the rules.  
- Rate limiting must be tuned to avoid blocking legitimate traffic.

### System-wide Impact
- Increases overall reliability and consistency of the codebase.  
- Reduces vulnerabilities and hardens server behavior.  
- Improves maintainability across the team.

## Related Decisions
- ADR-004: Testing and Validation Tools

## References
- [Helmet Documentation](https://helmetjs.github.io)  
- [Express Rate Limit](https://www.npmjs.com/package/express-rate-limit)  
- [CORS Middleware](https://www.npmjs.com/package/cors)  
- [ESLint](https://eslint.org)  
- [Prettier](https://prettier.io)
