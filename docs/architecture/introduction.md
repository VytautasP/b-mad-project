# Introduction

This document outlines the complete fullstack architecture for TaskFlow, a lightweight hierarchical task management application with integrated time tracking. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack from frontend UI components to backend services and database design.

TaskFlow targets freelancers and small teams (3-7 people) who need professional-grade project management capabilities�specifically unlimited task nesting and built-in time tracking�without the complexity overhead of enterprise tools like Jira or Monday.com. This unified architecture document combines traditional backend and frontend concerns into a cohesive fullstack blueprint optimized for rapid AI-assisted development.

**Architectural Philosophy:** The system embraces simplicity through elegant design�a single recursive Task entity replaces rigid project/epic/story hierarchies, and native time tracking eliminates tool fragmentation. The architecture supports progressive disclosure: solo features work immediately with zero configuration, while team collaboration capabilities activate naturally as users invite others.

## Starter Template or Existing Project

**Status:** Greenfield project with Angular frontend pre-initialized

**Pre-configured Choices:**
- Angular CLI standard project structure
- TypeScript for type safety
- Component-based architecture

**Architecture Decisions Required:**
- Backend platform and framework
- Database selection (considering Firebase free tier requirements from NFR18)
- API communication pattern
- Authentication implementation (JWT-based per FR1)
- Hosting and deployment infrastructure

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-01-13 | v1.0 | Initial architecture document creation | Winston (Architect) |

