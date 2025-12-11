# ADR-007: Oracle Cloud Infrastructure VM Hosting

**Status:** Accepted  
**Date:** 2025-12-11  
**Authors:** Team  
**Version:** 1.0

---

## Context

We needed a hosting solution for our MonkeySchool application that would support:

- Web server hosting (Apache already installed)
- Database deployment (PostgreSQL)
- Telemetry and observability tools (Grafana)
- Custom domain integration (\*.indresh.me already configured)
- Cost-effective solution suitable for early-stage development
- Single-server deployment to simplify operations

Key constraints and goals include:

- Zero-cost infrastructure for development and initial deployment
- Ability to deploy multiple services (web server, database, telemetry) on a single server
- Simplicity in deployment and maintenance
- Alignment with traditional corporate server deployment patterns

The application requires hosting that can accommodate a monolithic deployment where the web server, database, and observability tools all run on the same instance. This approach is practical for early development stages but must be documented as a trade-off.

---

## Decision

We will use **Oracle Cloud Infrastructure (OCI) Free Tier** with a single ARM-based virtual machine instance for hosting our application stack.

### Infrastructure Details

The deployed instance has the following specifications:

- **Provider:** Oracle Cloud Infrastructure (OCI)
- **Operating System:** Ubuntu 22.04.5 LTS (Jammy)
- **Kernel:** Linux 6.5.0-1026-oracle
- **Architecture:** ARM64 (aarch64) - ARM Neoverse-N1
- **Virtualization:** KVM
- **CPU:** 4 cores
- **Memory:** 23 GiB RAM
- **Network:** Single network interface (enp0s6) with IP 10.0.0.121/24, MTU 9000 (Jumbo frames enabled)
- **Services Deployed:**
  - Apache web server
  - PostgreSQL database
  - Grafana (for telemetry visualization)
  - Docker containers for application services
  - Tailscale VPN for secure access

### Deployment Model

This follows a **single-server monolithic deployment** where all application components run on one virtual machine. This mimics traditional corporate server deployments where services are co-located on a single physical or virtual machine.

---

## Alternatives Considered

| Alternative                                         | Pros                                                                                                                                                                | Cons                                                                                                                           |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Oracle Cloud Infrastructure VM (chosen)**         | Zero cost on free tier, ARM instances provide good performance, sufficient resources (4 CPU, 23GB RAM), Apache pre-installed, flexible for single-server deployment | Single point of failure, scalability limitations, potential latency if server location is not optimal, manual scaling required |
| **AWS EC2 Free Tier**                               | Extensive ecosystem, many learning resources, auto-scaling capabilities                                                                                             | Limited to 1-year free tier (vs OCI's permanent free tier), less generous free tier resources, may have ongoing costs          |
| **Google Cloud Platform (GCP) Free Tier**           | Good free tier, strong container support, global infrastructure                                                                                                     | Free tier is time-limited, less generous compute resources, more complex pricing                                               |
| **Azure Free Tier**                                 | Microsoft ecosystem integration, good for .NET applications                                                                                                         | Limited free tier duration, less suitable for Linux-based stack, complex pricing model                                         |
| **Platform-as-a-Service (Heroku, Render, Railway)** | Simple deployment, automatic scaling, managed databases                                                                                                             | Ongoing costs, less control over infrastructure, vendor lock-in, may not support all required services                         |
| **Dedicated Server / Colocation**                   | Full control, high performance                                                                                                                                      | High upfront and ongoing costs, requires physical access, maintenance overhead, not suitable for early-stage development       |
| **Multi-VM Cloud Architecture**                     | Better scalability, separation of concerns, fault tolerance                                                                                                         | Increased complexity, higher costs, more operational overhead, overkill for current needs                                      |

---

## Consequences

### Positive Consequences

- **Zero Cost:** Oracle Cloud Infrastructure's Always Free tier provides substantial resources at no cost, making it ideal for development and early production deployment.
- **Unified Deployment:** Single-server architecture simplifies deployment, debugging, and maintenance. All services are co-located, reducing network latency between components.
- **Resource Efficiency:** The ARM-based Neoverse-N1 processor with 4 cores and 23GB RAM provides sufficient resources for current application needs, including web server, database, and telemetry tools.
- **Existing Infrastructure:** Apache web server was already installed and configured, reducing setup time.
- **Domain Integration:** Free domain (\*.indresh.me) was already pointing to the server, enabling immediate custom domain usage.
- **Traditional Architecture:** Single-server deployment mirrors what many enterprises use with their own on-premises servers, providing a realistic deployment model.
- **Cost vs. Features:** Excellent balance between cost (zero) and available features (compute, storage, networking).
- **Docker Support:** Full Docker support enables containerized application deployment alongside traditional services.
- **Network Configuration:** Jumbo frames (MTU 9000) enabled for better network performance in cloud environments.

### Negative Consequences

- **Single Point of Failure:** All services depend on a single VM. If the instance fails, the entire application becomes unavailable. No built-in redundancy or high availability.
- **Scalability Limitations:** Scaling requires manual intervention (vertical scaling by upgrading instance, or horizontal scaling by adding VMs). Cannot automatically handle traffic spikes.
- **Geographic Latency:** Server location may not be optimal for all users. If the server is not closely located to the target user base, latency issues may arise, affecting user experience.
- **Resource Contention:** All services (web server, database, telemetry) compete for the same CPU and memory resources, which could lead to performance degradation under load.
- **Deployment Complexity:** Single-server model means database migrations, application updates, and service restarts affect the entire stack simultaneously.
- **Security Concerns:** All services exposed on a single machine increase attack surface. A compromise of one service could affect all services.
- **Backup and Recovery:** Requires manual backup strategies. No automatic database backups or disaster recovery built into the single-VM model.
- **Limited Monitoring:** While Grafana provides telemetry, monitoring a single server requires less sophisticated alerting compared to distributed systems.
- **Migration Challenges:** Moving to a distributed architecture later will require significant refactoring of deployment and configuration.

### System-wide Impact

- **Telemetry Deployment:** Co-locating Grafana with the application (as per ADR-006) is straightforward in a single-server model, but network metrics may not reflect true production conditions in a distributed system.
- **Database Performance:** PostgreSQL runs on the same machine as the application, reducing network latency but potentially competing for resources during high load.
- **Development Workflow:** Developers can deploy and test on the same infrastructure used for production, providing consistent environments.
- **Operational Simplicity:** System administrators only need to manage one server, reducing operational overhead and complexity.

### Future Considerations

When the application grows or requires better availability, we may need to:

- Migrate to a distributed architecture with separate VMs for web server, database, and telemetry
- Implement load balancing across multiple application instances
- Use managed database services (e.g., OCI Autonomous Database or managed PostgreSQL)
- Implement automated backup and disaster recovery solutions
- Consider multi-region deployment for global users
- Evaluate moving to container orchestration (Kubernetes) for better scalability

---

## Related Decisions

- **ADR-006:** Telemetry Pipeline Architecture - Grafana is deployed on this OCI VM instance
- **ADR-001:** Technology Stack for Core Web Application - The selected stack (Node.js, PostgreSQL) is deployed on this infrastructure
- **ADR-002:** Database Schema and Migration Strategy - PostgreSQL is hosted on this single VM

---

## References

- Oracle Cloud Infrastructure Free Tier: https://www.oracle.com/cloud/free/
- Oracle Cloud Infrastructure Documentation: https://docs.oracle.com/en-us/iaas/
- Ubuntu 22.04 LTS Documentation: https://ubuntu.com/server/docs
- Internal infrastructure discussion and server specifications (December 2025)
