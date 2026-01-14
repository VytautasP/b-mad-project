# Technical Assumptions

## Repository Structure: Monorepo

**Structure**: Single Git repository containing both Angular frontend and .NET backend projects as separate folders

**Rationale**: Simplifies version control coordination between frontend and backend changes, enables atomic commits affecting both layers, reduces overhead of managing multiple repos for solo developer. Independent deployment pipelines can still be configured despite shared repository. Shared TypeScript/C# contract models for API DTOs can live in /shared folder for type safety across the stack.

## Service Architecture

**Architecture**: Monolithic .NET 8+ Web API with layered service pattern

**Components**:
- **API Layer**: RESTful endpoints with resource-based routing (/api/tasks, /api/users, /api/timeentries, /api/comments)
- **Service Layer**: Business logic encapsulation (TaskService, UserService, TimeTrackingService, CommentService)
- **Repository Layer**: Data access abstraction via Entity Framework Core with repository pattern
- **Database**: SQL Server or PostgreSQL via EF Core ORM with migrations

**Rationale**: Monolithic architecture avoids microservices complexity for MVP�no need for inter-service communication, distributed transactions, or service discovery. Single deployment unit simplifies CI/CD and debugging. Service layer pattern provides clear separation of concerns while maintaining simplicity. Entity Framework Core handles SQL injection prevention and provides cross-database portability (SQL Server ? PostgreSQL).

## Testing Requirements

**Testing Strategy**: Unit + Integration testing with manual E2E validation

**Coverage**:
- **Unit Tests**: Service layer business logic, utility functions, data transformations (target 80%+ coverage on services)
- **Integration Tests**: API endpoints with in-memory database, authentication flows, EF Core query validation
- **Manual E2E Testing**: Critical user paths (signup ? create task ? start timer ? log time ? complete task) tested manually pre-release
- **Automated E2E**: Deferred to post-MVP due to setup complexity (Playwright/Cypress) and time constraints

**Testing Infrastructure**:
- **Backend**: xUnit test framework, Moq for mocking, ASP.NET Core TestServer for integration tests
- **Frontend**: Jasmine + Karma (Angular defaults), manual testing in Chrome/Firefox/Safari
- **CI/CD**: GitHub Actions running tests on PR merges (free tier)

**Rationale**: Unit + integration tests catch 90% of bugs without E2E complexity. Manual E2E testing suffices for MVP with limited feature surface. Service layer testing provides high ROI�business logic bugs are caught before UI development. Automated E2E deferred until user base validates product-market fit and justifies investment.

## Additional Technical Assumptions and Requests

- **Frontend Framework**: Angular 17+ (latest LTS) with TypeScript for type safety, Angular Material or PrimeNG for UI components, RxJS for reactive state management
- **Gantt Library**: Open-source solution required�candidates include Frappe Gantt (MIT license, lightweight), DHTMLX Gantt free tier, or custom SVG-based solution using D3.js
- **State Management**: Angular services with RxJS BehaviorSubjects (no NgRx/Redux�overkill for MVP complexity)
- **HTTP Communication**: Angular HttpClient with interceptor for JWT token injection, CORS configured for localhost development and production domain
- **Authentication Flow**: JWT bearer tokens issued on login, stored in localStorage (with XSS mitigation via Angular sanitization), HTTP interceptor adds Authorization: Bearer <token> header to all API requests
- **Database Choice**: **PostgreSQL preferred** over SQL Server for recursive CTE performance, free hosting via ElephantSQL/Supabase, and cross-platform development (macOS/Windows/Linux)
- **Hosting Strategy**: 
  - Frontend: Firebase Hosting (free tier) or Netlify (free tier) for static Angular build
  - Backend: Self-hosted VPS (DigitalOcean $6/month droplet if needed) or Azure App Service free tier
  - Database: ElephantSQL free tier (20MB limit�monitor growth) or Supabase free tier (500MB)
- **Security Enhancements**: 
  - HTTPS enforced via Let's Encrypt certificates (free)
  - Rate limiting via ASP.NET Core middleware (IP-based throttling)
  - CORS whitelist for production domain only
  - Refresh token rotation pattern (post-MVP improvement)
- **Real-Time Updates**: Polling mechanism (30-second interval) for MVP�WebSockets/SignalR deferred to post-MVP notifications feature
- **Caching Strategy**: Server-side response caching for frequently accessed data (task lists, user profile), client-side HTTP cache headers, in-memory caching for computed values (parent task rollups)
- **Performance Optimization**: 
  - Lazy loading for Angular modules and components
  - Virtual scrolling for large task lists (Angular CDK)
  - Database indexing on foreign keys, frequently filtered columns (assignee, status, due date)
  - Pagination with 50 items per page default
- **Developer Tooling**: 
  - Visual Studio Code with Angular Language Service and C# extensions
  - Git with GitHub for version control and CI/CD
  - Postman/Insomnia for API testing during development
  - Browser DevTools for frontend debugging
- **Deployment Pipeline**: 
  - GitHub Actions for CI/CD (free tier: test + build on push to main)
  - Automatic frontend deployment to Firebase/Netlify on merge to main
  - Manual or scripted backend deployment initially (Docker containerization post-MVP)

---
