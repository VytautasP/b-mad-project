1# TaskFlow Fullstack Architecture Document

## Introduction

This document outlines the complete fullstack architecture for TaskFlow, a lightweight hierarchical task management application with integrated time tracking. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack from frontend UI components to backend services and database design.

TaskFlow targets freelancers and small teams (3-7 people) who need professional-grade project management capabilities�specifically unlimited task nesting and built-in time tracking�without the complexity overhead of enterprise tools like Jira or Monday.com. This unified architecture document combines traditional backend and frontend concerns into a cohesive fullstack blueprint optimized for rapid AI-assisted development.

**Architectural Philosophy:** The system embraces simplicity through elegant design�a single recursive Task entity replaces rigid project/epic/story hierarchies, and native time tracking eliminates tool fragmentation. The architecture supports progressive disclosure: solo features work immediately with zero configuration, while team collaboration capabilities activate naturally as users invite others.

### Starter Template or Existing Project

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

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-01-13 | v1.0 | Initial architecture document creation | Winston (Architect) |


## High Level Architecture

### Technical Summary

TaskFlow implements a **traditional three-tier architecture** with an Angular single-page application frontend, ASP.NET Core Web API backend hosted on Fly.io, and Supabase PostgreSQL as the database layer. The architecture leverages **PostgreSQL's relational model** with Entity Framework Core for ORM, recursive Common Table Expressions (CTEs) for hierarchical task queries (NFR19), and ASP.NET Core Identity for authentication (NFR10). Angular's standalone component architecture provides code-splitting and lazy loading for optimal performance, while Vercel delivers the SPA with global edge network distribution and automatic HTTPS.

Key integration points include:
- **Frontend-Backend**: Angular communicates via HTTP REST API with strongly-typed TypeScript interfaces generated from C# models
- **Authentication Flow**: ASP.NET Core Identity with JWT bearer tokens (FR1), bcrypt password hashing (NFR10), refresh token pattern (NFR9)
- **Live Updates**: HTTP polling for activity log updates (FR22), client-side timer for time tracking (FR10)
- **File Storage**: Supabase Storage for user profile images with direct client uploads
- **Data Access**: Entity Framework Core with strongly-typed LINQ queries, migrations, and change tracking

This architecture achieves PRD goals by providing full control over business logic, SQL-based hierarchy queries (NFR19), ASP.NET Core Identity compliance (NFR10), sub-second UI responsiveness (NFR1-4), progressive web app capabilities (NFR7), and true zero-cost hosting within generous free tiers (NFR18, NFR20).

### Platform and Infrastructure Choice

Based on requirements analysis, here are the top platform options:

**Option 1: Vercel + Fly.io + Supabase (Recommended)**
- **Pros**: Full .NET backend control (ASP.NET Core), Entity Framework Core ORM, PostgreSQL with recursive CTEs (NFR19), ASP.NET Core Identity (NFR10), generous free tiers across all platforms, Docker deployment, complete business logic flexibility
- **Cons**: Three separate services to manage, need to write API endpoints manually (no auto-generation), requires backend deployment pipeline
- **Cost**: $0/month for MVP (all free tiers), ~$25-50/month at 10K+ users (Supabase Pro + Fly.io scaling)
- **Best For**: Traditional N-tier applications requiring full backend control and complex business logic

**Option 2: Firebase**
- **Pros**: Integrated services, real-time database, automatic scaling, zero DevOps overhead, excellent Angular integration via AngularFire
- **Cons**: Severe vendor lock-in, per-read billing trap (50K reads/day free = ~5-10 page loads per user), NoSQL requires denormalization, violates NFR19 (no recursive CTEs), costs explode at scale
- **Cost**: $0/month for MVP, ~$500-900/month at 1000 active users (real-time multiplies reads)
- **Best For**: Prototypes and demos where cost/lock-in don't matter

**Option 3: AWS (Amplify + RDS + Cognito)**
- **Pros**: Enterprise-grade scalability, comprehensive service ecosystem, fine-grained control
- **Cons**: Steep learning curve, complex pricing model, significant DevOps overhead, free tier expires after 12 months, RDS minimum ~$15/month
- **Cost**: $30-50/month even at MVP scale
- **Best For**: Enterprise applications with dedicated DevOps resources

**Recommendation: Vercel + Fly.io + Supabase**

**Rationale:** This traditional architecture provides maximum control and explicitly fulfills PRD requirements: NFR19 (recursive CTEs via Entity Framework Core), NFR10 (ASP.NET Core Identity with bcrypt), NFR11 (parameterized queries via EF Core), and NFR20 (zero licensing costs). A .NET backend enables complex business logic for FR6 (recursive time aggregation), FR13 (time rollup calculations), and future features without being constrained by database-generated APIs. Entity Framework Core provides type-safe database access with migrations, LINQ queries, and change tracking. All three platforms offer generous free tiers supporting MVP scale. The architecture follows familiar patterns that accelerate AI-assisted development and developer onboarding. SignalR provides robust real-time capabilities for collaborative features. Docker deployment on Fly.io ensures portability—can migrate to any container host without vendor lock-in.

**Platform:** Vercel (frontend) + Fly.io (backend API) + Supabase (database)

**Key Services:**
- **ASP.NET Core Web API**: RESTful API with controllers, middleware, dependency injection, hosted on Fly.io Docker containers
- **Entity Framework Core**: ORM for type-safe database access, migrations, LINQ queries, change tracking
- **ASP.NET Core Identity**: Authentication with JWT bearer tokens, bcrypt password hashing (NFR10), refresh tokens (NFR9)
- **Supabase PostgreSQL**: Relational database with recursive CTEs, full-text search, ACID transactions
- **Supabase Storage**: User profile image storage with direct client uploads
- **Fly.io**: Docker container hosting with global deployment, persistent volumes, automatic HTTPS
- **Vercel**: Angular SPA hosting with global edge network, automatic deployments from Git

**Deployment Host and Regions:** Vercel (global edge network), Fly.io (multi-region: iad=primary, lax, fra), Supabase (us-east-1)

### Repository Structure

**Structure:** Monorepo with workspace-based organization

**Rationale:** A hybrid repository structure separates frontend (npm/Angular) and backend (.NET/C#) while maintaining clear organization. The Angular app remains in the current workspace, while the .NET API lives as a sibling .NET solution. This approach respects each ecosystem's conventions (package.json vs .csproj) while enabling shared contracts via TypeScript interfaces generated from C# DTOs. Docker Compose orchestrates local development with all services running together.

**Repository Tool:** Polyglot monorepo (npm workspace + .NET solution)

**Repository Organization:**
```
taskflow/
├── frontend/                # Angular workspace
│   ├── src/
│   │   ├── app/
│   │   ├── environments/
│   │   └── assets/
│   ├── angular.json
│   ├── package.json
│   └── tsconfig.json
├── backend/                 # .NET solution
│   ├── TaskFlow.Api/        # ASP.NET Core Web API
│   │   ├── Controllers/
│   │   ├── Middleware/
│   │   ├── Program.cs
│   │   ├── Dockerfile
│   │   └── TaskFlow.Api.csproj
│   ├── TaskFlow.Core/       # Domain models, interfaces
│   │   ├── Entities/        # Task, User, TimeEntry, Comment
│   │   ├── Interfaces/      # ITaskRepository, IUserService
│   │   └── TaskFlow.Core.csproj
│   ├── TaskFlow.Infrastructure/  # EF Core, repositories
│   │   ├── Data/
│   │   │   ├── ApplicationDbContext.cs
│   │   │   └── Migrations/
│   │   ├── Repositories/
│   │   └── TaskFlow.Infrastructure.csproj
│   ├── TaskFlow.Tests/      # Unit and integration tests
│   │   └── TaskFlow.Tests.csproj
│   └── TaskFlow.sln         # Solution file
├── shared/                  # Shared contracts
│   └── models/              # TypeScript interfaces from C# DTOs
├── docker-compose.yml       # Local development orchestration
├── .github/workflows/       # CI/CD pipelines
│   ├── frontend.yml         # Vercel deployment
│   └── backend.yml          # Fly.io deployment
└── README.md
```

**Migration Path:** Create `backend/` directory with new ASP.NET Core Web API solution. Migrate current Angular project into `frontend/` directory. Configure EF Core with Supabase PostgreSQL connection. Generate TypeScript interfaces from C# DTOs using tools like NSwag or TypeScript Generator. Set up Docker for local development and Fly.io deployment. This can be done incrementally—start with auth endpoints, then migrate features progressively.

### High Level Architecture Diagram

```mermaid
graph TB
    User[User Browser]
    
    subgraph "Vercel Platform"
        Vercel[Vercel Edge Network<br/>Global CDN]
    end
    
    subgraph "Fly.io Platform"
        FlyProxy[Fly Proxy<br/>Load Balancer]
        ApiContainer[.NET API Container<br/>ASP.NET Core]
    end
    
    subgraph "Supabase Platform"
        Postgres[(PostgreSQL Database<br/>Tasks, Users, TimeEntries)]
        Storage[Supabase Storage<br/>Profile Images]
    end
    
    subgraph "Angular SPA"
        Router[Angular Router]
        Components[Components]
        HttpClient[HTTP Client Services]
        Guards[Auth Guards]
    end
    
    User -->|HTTPS| Vercel
    Vercel -->|Delivers SPA| Router
    Router --> Components
    Components --> HttpClient
    HttpClient -->|REST API| FlyProxy
    FlyProxy --> ApiContainer
    ApiContainer -->|EF Core| Postgres
    Components -->|Direct Upload| Storage
    Guards -.->|Validates JWT| HttpClient
    
    style Vercel fill:#000000
    style FlyProxy fill:#7c3aed
    style ApiContainer fill:#512bd4
    style Postgres fill:#3ECF8E
    style Storage fill:#3ECF8E
```

### Architectural Patterns

- **Three-Tier Architecture:** Presentation (Angular), Business Logic (.NET API), Data (PostgreSQL) with clear separation - _Rationale:_ Proven architecture pattern, optimal for NFR requirements, enables independent scaling of tiers, familiar to developers

- **Component-Based UI (Standalone Components):** Angular 17+ standalone components with explicit dependency injection - _Rationale:_ Improved tree-shaking, faster build times, and clearer component boundaries for AI-driven development

- **Smart/Container Pattern:** Presentation components (dumb) separated from container components (smart) that handle HTTP service calls - _Rationale:_ Enhanced testability, reusability, and clear separation of concerns

- **Reactive State Management:** RxJS Observables with HttpClient and periodic polling for live updates - _Rationale:_ Handles activity log updates (FR22) via polling intervals, client-side timer for time tracking (FR10), leverages Angular's change detection efficiently

- **API Service Layer (Frontend):** TypeScript services abstract HTTP operations behind domain-specific interfaces - _Rationale:_ Clean separation of concerns, simplifies testing with mock services, provides clear API contracts matching backend DTOs

- **Optimistic UI Updates:** UI updates immediately, synchronizes with .NET API asynchronously - _Rationale:_ Meets NFR4 (<100ms UI latency) for time tracking timer, improves perceived performance

- **Normalized Relational Data Model:** Standard SQL normalization (3NF) with Entity Framework Core navigation properties - _Rationale:_ Eliminates data duplication, ensures referential integrity via ACID transactions, enables powerful LINQ queries and eager/lazy loading

- **Clean Architecture (Onion):** Core domain layer, infrastructure layer, API layer with dependency inversion - _Rationale:_ Testable business logic, framework independence, clear separation of concerns, enables AI-assisted feature development

- **Repository Pattern with Unit of Work:** Abstracted data access via generic repositories and DbContext transactions - _Rationale:_ Enables testing with in-memory databases, encapsulates EF Core complexity, provides clear data access contracts

- **Entity Framework Core ORM:** Code-first migrations, LINQ queries, change tracking, lazy loading - _Rationale:_ Type-safe database access (NFR11), automatic SQL generation, seamless relationship navigation, strongly-typed entities

- **JWT Bearer Authentication:** ASP.NET Core Identity with JWT tokens and refresh token pattern - _Rationale:_ Directly fulfills NFR9 and NFR10, stateless authentication, bcrypt password hashing, industry-standard security

- **HTTP Polling for Live Updates:** Periodic GET requests for activity log changes and task updates - _Rationale:_ Simpler than WebSockets, stateless scaling, sufficient for FR22 (activity logs) given TaskFlow's usage patterns (3-7 person teams, not simultaneous editing)

- **Recursive CTEs via Raw SQL:** EF Core FromSqlRaw with PostgreSQL WITH RECURSIVE queries - _Rationale:_ Directly fulfills NFR19, enables efficient hierarchy traversal in database, map results to strongly-typed entities

- **Progressive Web App (PWA):** Service worker for offline capability and app-like experience - _Rationale:_ Meets NFR7 requirements, enables add-to-home-screen functionality, improves reliability on unstable connections


## Tech Stack

This is the **definitive technology selection** for the entire project. All development must use these exact versions and technologies.

| Category | Technology | Version | Purpose | Rationale |
|----------|-----------|---------|---------|-----------|
| **Frontend Language** | TypeScript | 5.9.3 | Type-safe JavaScript for Angular | Prevents runtime type errors, excellent IDE support, required by Angular, enables shared types with backend DTOs |
| **Frontend Framework** | Angular | 20 | SPA framework with standalone components | Latest Angular version with improved performance, enhanced signals support, standalone components, built-in dependency injection, meets NFR5-7 browser requirements |
| **UI Component Library** | Angular Material | 20 | Material Design component library | Production-ready components, accessibility (WCAG 2.1), theming support, maintained by Angular team, aligned with Angular 20 |
| **State Management** | RxJS + Services | 7.8+ | Reactive state via Observables | Built into Angular, sufficient for app complexity, avoids NgRx overhead, natural for HTTP and polling patterns |
| **Backend Language** | C# | 12.0 (.NET 8) | Strongly-typed OOP language | Type safety, async/await, LINQ, nullable reference types, excellent tooling (Visual Studio/Rider) |
| **Backend Framework** | ASP.NET Core | 8.0 LTS | Cross-platform web API framework | LTS support until Nov 2026, minimal APIs, built-in DI, middleware pipeline, fulfills NFR10 (Identity) |
| **ORM** | Entity Framework Core | 8.0 | Database ORM and migrations | Type-safe LINQ queries (NFR11), code-first migrations, lazy loading, change tracking, PostgreSQL provider |
| **API Style** | REST | OpenAPI 3.1 | RESTful HTTP endpoints | Simple, well-understood, HTTP caching, stateless (easy scaling), Swagger/OpenAPI docs generation |
| **Database** | PostgreSQL | 15+ | Relational database | Recursive CTEs (NFR19), full-text search, JSONB support, ACID transactions, free on Supabase |
| **Cache** | In-Memory | .NET MemoryCache | Server-side response caching | Built-in, zero infrastructure, sufficient for MVP, can upgrade to Redis later if needed |
| **File Storage** | Supabase Storage | Latest | Object storage for images | Free tier (1GB), signed URLs, image transformations, direct client uploads, RLS policies |
| **Authentication** | ASP.NET Core Identity | 8.0 | User authentication system | Fulfills NFR10 (bcrypt), JWT bearer tokens (FR1), refresh tokens (NFR9), password policies, email confirmation |
| **Frontend Testing** | Jasmine + Karma | 5.1+ / 6.4+ | Unit testing for Angular | Default Angular testing stack, component testing, async support, code coverage reports |
| **Backend Testing** | xUnit + Moq | 2.6+ / 4.20+ | Unit/integration testing .NET | Industry standard for .NET, async support, parameterized tests, mock EF Core DbContext |
| **E2E Testing** | Playwright | 1.40+ | Cross-browser end-to-end tests | Fast, reliable, multi-browser, auto-wait, screenshot/video capture, TypeScript support |
| **Build Tool (Frontend)** | Angular CLI | 20 | Build and dev server | Official Angular tooling, Vite-based build system, optimized production builds, tree-shaking, faster dev server |
| **Build Tool (Backend)** | .NET CLI | 8.0 | Build and publish .NET apps | Official Microsoft tooling, MSBuild, NuGet package management, Docker support |
| **Bundler** | Vite + esbuild | via Angular 20 | JavaScript bundling | Vite-based build system in Angular 20 with esbuild, 10-100x faster than webpack, HMR, ESM support, minimal config |
| **CSS Framework** | Tailwind CSS | 3.4+ | Utility-first CSS framework | Rapid UI development, tree-shaking (small bundles), design consistency, works with Angular Material |
| **Container Runtime** | Docker | 24+ | Containerization for deployment | Portable deployment to Fly.io, local dev parity with production, multi-stage builds for .NET |
| **IaC Tool** | Fly.io CLI + Dockerfile | Latest | Infrastructure as code | Simple TOML config (fly.toml), Dockerfile for .NET API, version-controlled infrastructure |
| **CI/CD** | GitHub Actions | Latest | Automated deployment pipeline | Free for public repos, matrix builds (frontend/backend), deploy to Vercel + Fly.io, secrets management |
| **Monitoring** | Fly.io Metrics + Logs | Built-in | Application monitoring | Free tier includes metrics, logs, health checks, alerting via webhook (can integrate Sentry later) |
| **Logging** | Serilog + Seq (local) | 3.1+ / Latest | Structured logging | Structured JSON logs, log levels, enrichers, writes to console (Fly.io captures), local debugging with Seq |
| **API Documentation** | Swashbuckle (Swagger) | 6.5+ | Interactive API documentation | Auto-generates OpenAPI spec from controllers, Swagger UI for testing, NSwag for TS client generation |
| **HTTP Client** | Angular HttpClient | Built-in | Frontend HTTP requests | Built into Angular, interceptors for auth, RxJS integration, automatic JSON serialization |


## Data Models

This section defines the core domain entities that drive TaskFlow's data architecture. These models represent both the Entity Framework Core entities in C# and corresponding TypeScript interfaces shared between frontend and backend. The design emphasizes **normalized relational modeling** to leverage PostgreSQL's strengths while supporting TaskFlow's key features: recursive task hierarchies (FR5), multi-user assignments (FR8), integrated time tracking (FR10-13), and activity logging (FR22).

**Design Principles:**
- **Single Source of Truth:** Each entity has one canonical representation; relationships maintained via foreign keys with referential integrity
- **Self-Referencing Hierarchy:** Task's ParentTaskId enables unlimited nesting (FR5) with PostgreSQL recursive CTEs (NFR19)
- **Many-to-Many via Join Tables:** TaskAssignee and TaskComment enable multi-user relationships without data duplication
- **Audit Trail Built-In:** CreatedDate, ModifiedDate, CreatedByUserId track changes for activity log (FR22)
- **Type Safety:** Enums for Priority, Status, TaskType prevent invalid states; shared TypeScript interfaces ensure frontend-backend contract alignment

### User

**Purpose:** Represents authenticated users who can create tasks, track time, and collaborate with team members. Handles identity, profile information, and serves as the root entity for user-owned data.

**Key Attributes:**
- `Id`: Guid (Primary Key) - Unique user identifier used throughout system
- `Email`: string (unique, indexed) - Login credential, must be unique across system
- `PasswordHash`: string - bcrypt-hashed password via ASP.NET Core Identity (NFR10)
- `Name`: string - Display name shown in UI, task assignments, comments
- `ProfileImageUrl`: string? (nullable) - Supabase Storage URL for avatar image
- `CreatedDate`: DateTime - Account creation timestamp for analytics
- `ModifiedDate`: DateTime - Last profile update for audit trail

**TypeScript Interface:**
```typescript
export interface User {
  id: string;  // Guid as string in TypeScript
  email: string;
  name: string;
  profileImageUrl?: string;
  createdDate: Date;
  modifiedDate: Date;
}

export interface UserCreateDto {
  email: string;
  password: string;
  name: string;
}

export interface UserUpdateDto {
  name?: string;
  profileImageUrl?: string;
}
```

**Relationships:**
- **One-to-Many with Task:** User creates many tasks (Task.CreatedByUserId foreign key)
- **Many-to-Many with Task via TaskAssignee:** Users assigned to multiple tasks, tasks have multiple assignees
- **One-to-Many with TimeEntry:** User logs many time entries across various tasks
- **One-to-Many with Comment:** User authors many comments on tasks
- **One-to-Many with ActivityLog:** User triggers many activity events

**Design Decisions:**
- Password stored as hash only, never plaintext (NFR10 compliance via ASP.NET Core Identity)
- Email used as username for simplicity (single credential to remember)
- ProfileImageUrl nullable allows users without avatars (default avatar generated by initials in UI)
- CreatedDate/ModifiedDate enable "member since" display and profile change tracking

### Task

**Purpose:** Core entity representing work items with unlimited hierarchical nesting. Supports projects, milestones, and individual tasks through Type enumeration and self-referencing ParentTaskId relationship (FR5).

**Key Attributes:**
- `Id`: Guid (Primary Key) - Unique task identifier for API operations
- `Name`: string (required, max 200 chars) - Task title displayed everywhere
- `Description`: string? (nullable, max 5000 chars) - Rich text task details, markdown supported
- `ParentTaskId`: Guid? (nullable, self-referencing FK) - Enables unlimited nesting (FR5), null = root task
- `CreatedByUserId`: Guid (FK to User) - Task owner, establishes data ownership boundary
- `CreatedDate`: DateTime (indexed) - Task creation timestamp for sorting (FR14)
- `ModifiedDate`: DateTime - Last edit timestamp for activity log (FR22)
- `DueDate`: DateTime? (nullable, indexed) - Optional deadline for Gantt view (FR18-20), filtering (FR15)
- `Priority`: Priority enum (Low/Medium/High/Critical) - Urgency indicator for filtering/sorting (FR3, FR14)
- `Status`: Status enum (ToDo/InProgress/Blocked/Waiting/Done) - Workflow state with specific indicators (FR24)
- `Progress`: int (0-100) - Percentage completion, auto-calculated for parent tasks (FR6)
- `Type`: TaskType enum (Project/Milestone/Task) - Semantic categorization for UI rendering (FR3)
- `IsDeleted`: bool (default false) - Soft delete flag preserves referential integrity
- `TotalLoggedTime`: TimeSpan (computed) - Cached rollup of all TimeEntries for performance (FR13)

**TypeScript Interface:**
```typescript
export enum Priority {
  Low = 0,
  Medium = 1,
  High = 2,
  Critical = 3
}

export enum Status {
  ToDo = 0,
  InProgress = 1,
  Blocked = 2,
  Waiting = 3,
  Done = 4
}

export enum TaskType {
  Project = 0,
  Milestone = 1,
  Task = 2
}

export interface Task {
  id: string;
  name: string;
  description?: string;
  parentTaskId?: string;
  createdByUserId: string;
  createdDate: Date;
  modifiedDate: Date;
  dueDate?: Date;
  priority: Priority;
  status: Status;
  progress: number;  // 0-100
  type: TaskType;
  isDeleted: boolean;
  totalLoggedTime: number;  // Seconds for easier calculation
  
  // Navigation properties (loaded on demand)
  parent?: Task;
  children?: Task[];
  assignees?: User[];
  timeEntries?: TimeEntry[];
  comments?: Comment[];
}

export interface TaskCreateDto {
  name: string;
  description?: string;
  parentTaskId?: string;
  dueDate?: Date;
  priority: Priority;
  status: Status;
  type: TaskType;
  assigneeIds?: string[];  // Initial assignees
}

export interface TaskUpdateDto {
  name?: string;
  description?: string;
  parentTaskId?: string;
  dueDate?: Date;
  priority?: Priority;
  status?: Status;
  progress?: number;
  type?: TaskType;
}
```

**Relationships:**
- **Self-Referencing (Parent-Child):** Task.ParentTaskId → Task.Id enables recursive hierarchy (FR5)
- **Many-to-One with User:** Task.CreatedByUserId → User.Id establishes ownership
- **Many-to-Many with User via TaskAssignee:** Multiple users assigned to task (FR8)
- **One-to-Many with TimeEntry:** Task has many time entries from various users (FR12)
- **One-to-Many with Comment:** Task has threaded comment discussions (FR21)
- **One-to-Many with ActivityLog:** Task changes generate activity events (FR22)

**Design Decisions:**
- ParentTaskId nullable enables both root tasks and deeply nested hierarchies without separate tables
- Progress auto-calculated for parents via weighted average of children (FR6) - stored as computed column or application-calculated
- TotalLoggedTime denormalized for performance - updated via EF Core cascade or background job
- IsDeleted soft delete preserves historical data and prevents cascade deletion breaking time tracking reports
- Type enum allows flexible task categorization without rigid "project must contain epic" constraints
- Database indexes on CreatedByUserId, Status, DueDate, ParentTaskId optimize common queries (list view, filtering)

### TaskAssignee

**Purpose:** Join table enabling many-to-many relationship between Tasks and Users for multi-user assignments (FR8, FR9). Supports "My Tasks" filtering and team collaboration features.

**Key Attributes:**
- `TaskId`: Guid (FK to Task, composite PK part 1) - References assigned task
- `UserId`: Guid (FK to User, composite PK part 2) - References assigned user
- `AssignedDate`: DateTime - Timestamp of assignment for activity log (FR22)
- `AssignedByUserId`: Guid (FK to User) - Who made the assignment (team lead tracking)

**TypeScript Interface:**
```typescript
export interface TaskAssignee {
  taskId: string;
  userId: string;
  assignedDate: Date;
  assignedByUserId: string;
}

export interface AssignTaskDto {
  taskId: string;
  userIds: string[];  // Assign multiple users at once
}
```

**Relationships:**
- **Many-to-One with Task:** TaskAssignee.TaskId → Task.Id
- **Many-to-One with User (assignee):** TaskAssignee.UserId → User.Id
- **Many-to-One with User (assigner):** TaskAssignee.AssignedByUserId → User.Id

**Design Decisions:**
- Composite primary key (TaskId, UserId) prevents duplicate assignments
- AssignedDate enables activity log entry "Marcus assigned Sarah to Task X" (FR22)
- AssignedByUserId tracks team lead actions for future permission model
- No additional metadata (role, permission) in MVP - keep simple

### TimeEntry

**Purpose:** Records time tracking events for tasks, supporting both active timer sessions (FR10) and manual time entries (FR11). Enables billable hours tracking and automatic parent task time aggregation (FR13).

**Key Attributes:**
- `Id`: Guid (Primary Key) - Unique time entry identifier
- `TaskId`: Guid (FK to Task, indexed) - Task being tracked, enables fast queries for task time log
- `UserId`: Guid (FK to User, indexed) - User who logged the time
- `StartTime`: DateTime - When timer started or manual entry period begins
- `EndTime`: DateTime? (nullable) - When timer stopped, null = timer still running
- `Duration`: TimeSpan (computed) - Calculated EndTime - StartTime, stored for query performance
- `Notes`: string? (nullable, max 500 chars) - Optional notes for manual entries (e.g., "Client call regarding scope change")
- `IsManual`: bool - Distinguishes timer-tracked (false) vs manual entry (true)
- `CreatedDate`: DateTime - Entry creation timestamp for audit
- `ModifiedDate`: DateTime - Last edit timestamp (manual entries editable)

**TypeScript Interface:**
```typescript
export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration: number;  // Seconds for easier calculation
  notes?: string;
  isManual: boolean;
  createdDate: Date;
  modifiedDate: Date;
  
  // Navigation properties
  task?: Task;
  user?: User;
}

export interface TimeEntryCreateDto {
  taskId: string;
  startTime: Date;
  endTime?: Date;  // Omit for starting active timer
  notes?: string;
  isManual: boolean;
}

export interface TimeEntryUpdateDto {
  endTime?: Date;  // Stop active timer
  notes?: string;
}

export interface ActiveTimerDto {
  timeEntryId: string;
  taskId: string;
  taskName: string;
  startTime: Date;
  elapsedSeconds: number;  // Calculated server-side
}
```

**Relationships:**
- **Many-to-One with Task:** TimeEntry.TaskId → Task.Id enables time log per task (FR12)
- **Many-to-One with User:** TimeEntry.UserId → User.Id attributes time to specific user

**Design Decisions:**
- EndTime nullable enables active timer state (FR10) - null = timer running, client polls for duration
- Duration stored as computed column for performance - avoids calculating on every query
- IsManual flag distinguishes timer (precise to second) vs manual entry (user-entered hours)
- Notes optional for manual entries - timer entries typically have no notes
- StartTime/EndTime stored as UTC, converted to user timezone in frontend
- No cascade delete - if Task deleted, preserve TimeEntries for billing/reporting (soft delete Task instead)

### Comment

**Purpose:** Enables threaded discussions on tasks with user mentions (FR21). Supports activity log integration and edit/delete with author permissions (FR23).

**Key Attributes:**
- `Id`: Guid (Primary Key) - Unique comment identifier
- `TaskId`: Guid (FK to Task, indexed) - Task being discussed
- `UserId`: Guid (FK to User) - Comment author
- `ParentCommentId`: Guid? (nullable, self-referencing FK) - Enables threaded replies (post-MVP nested threads)
- `Content`: string (required, max 2000 chars) - Comment text with markdown support
- `CreatedDate`: DateTime (indexed) - Comment timestamp for sorting
- `ModifiedDate`: DateTime? (nullable) - Last edit timestamp, null = never edited
- `IsDeleted`: bool - Soft delete preserves thread context ("This comment has been deleted")
- `MentionedUserIds`: string (JSON array) - User IDs mentioned with @username for notifications (post-MVP)

**TypeScript Interface:**
```typescript
export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  parentCommentId?: string;
  content: string;
  createdDate: Date;
  modifiedDate?: Date;
  isDeleted: boolean;
  mentionedUserIds: string[];
  
  // Navigation properties
  task?: Task;
  user?: User;
  replies?: Comment[];
}

export interface CommentCreateDto {
  taskId: string;
  content: string;
  parentCommentId?: string;
  mentionedUserIds?: string[];
}

export interface CommentUpdateDto {
  content: string;
}
```

**Relationships:**
- **Many-to-One with Task:** Comment.TaskId → Task.Id creates comment thread per task (FR21)
- **Many-to-One with User:** Comment.UserId → User.Id establishes authorship for permissions (FR23)
- **Self-Referencing (Threaded Replies):** Comment.ParentCommentId → Comment.Id enables reply chains (post-MVP feature)

**Design Decisions:**
- ParentCommentId enables threaded replies but MVP shows flat list (complexity deferred)
- IsDeleted soft delete maintains thread context - show "[deleted]" placeholder in UI
- ModifiedDate nullable distinguishes edited vs original comments - show "edited" badge in UI
- MentionedUserIds stored as JSON array (PostgreSQL JSONB) for future notifications without separate table
- Content max 2000 chars prevents database bloat while allowing detailed discussions
- CreatedDate indexed for efficient chronological sorting in comment threads

### ActivityLog

**Purpose:** Audit trail tracking all significant task changes for activity feed (FR22). Enables "Marcus changed status from In Progress to Done" timeline view and future analytics.

**Key Attributes:**
- `Id`: Guid (Primary Key) - Unique log entry identifier
- `TaskId`: Guid (FK to Task, indexed) - Task that changed
- `UserId`: Guid (FK to User) - User who made the change
- `ActivityType`: ActivityType enum - Categorizes event (Created/StatusChanged/Assigned/TimeLogged/Commented/etc.)
- `Timestamp`: DateTime (indexed) - When event occurred for chronological display
- `Description`: string - Human-readable event summary ("changed status from In Progress to Done")
- `OldValue`: string? (nullable, JSON) - Previous state for undo/history (e.g., "{"status": "InProgress"}")
- `NewValue`: string? (nullable, JSON) - New state after change (e.g., "{"status": "Done"}")
- `Metadata`: string? (nullable, JSON) - Additional context (e.g., assigned user names, time duration)

**TypeScript Interface:**
```typescript
export enum ActivityType {
  TaskCreated = 0,
  TaskUpdated = 1,
  StatusChanged = 2,
  PriorityChanged = 3,
  AssigneeAdded = 4,
  AssigneeRemoved = 5,
  TimeLogged = 6,
  CommentAdded = 7,
  CommentEdited = 8,
  CommentDeleted = 9,
  DueDateChanged = 10,
  ParentChanged = 11
}

export interface ActivityLog {
  id: string;
  taskId: string;
  userId: string;
  activityType: ActivityType;
  timestamp: Date;
  description: string;
  oldValue?: string;  // JSON string
  newValue?: string;  // JSON string
  metadata?: string;  // JSON string
  
  // Navigation properties
  task?: Task;
  user?: User;
}
```

**Relationships:**
- **Many-to-One with Task:** ActivityLog.TaskId → Task.Id creates activity timeline per task (FR22)
- **Many-to-One with User:** ActivityLog.UserId → User.Id attributes action to specific user

**Design Decisions:**
- ActivityType enum enables filtering ("show me only status changes") and icon rendering in UI
- Description pre-formatted on backend - frontend just displays ("Sarah assigned Marcus to QA Testing")
- OldValue/NewValue as JSON enables rich diff views ("Status: To Do → In Progress") without separate columns per field
- Metadata JSON stores contextual info (assignee names, time duration) avoiding complex joins for display
- Timestamp indexed for efficient "recent activity" queries with pagination
- No cascade delete - preserve activity history even if Task/User deleted (audit requirement)
- Background service or EF Core interceptor auto-creates entries on entity changes

---

**Data Model Summary:**

The TaskFlow data model consists of **6 core entities** with **11 relationships** that support all PRD requirements:

- **User** (authentication, profile)
- **Task** (recursive hierarchy with self-referencing ParentTaskId)
- **TaskAssignee** (join table for multi-user assignment)
- **TimeEntry** (timer and manual time tracking)
- **Comment** (task discussions with future threading)
- **ActivityLog** (audit trail for all changes)

**Key Design Features:**
- Recursive CTEs via Task.ParentTaskId fulfill NFR19 for efficient hierarchy queries
- Normalized relational design leverages PostgreSQL's ACID transactions and referential integrity
- Soft deletes (IsDeleted flags) preserve data integrity for reporting while appearing deleted in UI
- Computed/cached columns (TotalLoggedTime, Duration) optimize read-heavy operations
- JSON fields (MentionedUserIds, Metadata) provide flexibility without schema changes for evolving features
- Composite keys (TaskAssignee) and indexes (CreatedByUserId, Status, DueDate) optimize common query patterns

These TypeScript interfaces will be auto-generated from C# entities using NSwag or TypeScript Generator, ensuring frontend-backend contract alignment and preventing API desync bugs.


## API Specification

This section defines the complete RESTful HTTP API surface for TaskFlow, including all endpoints, request/response schemas, authentication requirements, and error handling patterns. The API follows **resource-oriented design** with standard HTTP verbs (GET, POST, PUT, PATCH, DELETE) and RESTful conventions. All endpoints return JSON and require JWT bearer token authentication (except auth endpoints).

**API Design Principles:**
- **Resource-Based URLs:** `/api/tasks`, `/api/users`, `/api/timeentries`, `/api/comments` follow REST conventions
- **HTTP Verbs Semantics:** GET (read), POST (create), PUT (full update), PATCH (partial update), DELETE (remove)
- **Stateless Authentication:** JWT bearer tokens in `Authorization` header enable horizontal scaling
- **Consistent Error Format:** All errors return `{ error: string, details?: object }` with appropriate HTTP status codes
- **Pagination:** List endpoints support `?page=1&pageSize=50` with response metadata
- **Filtering/Sorting:** Query parameters enable complex queries (`?status=InProgress&sortBy=dueDate&sortOrder=asc`)
- **OpenAPI Documentation:** Swashbuckle auto-generates interactive Swagger UI at `/swagger` for testing

### REST API Specification

```yaml
openapi: 3.1.0
info:
  title: TaskFlow API
  version: 1.0.0
  description: |
    RESTful API for TaskFlow task management system with hierarchical tasks, time tracking, 
    and team collaboration features. All authenticated endpoints require JWT bearer token 
    in Authorization header.
  contact:
    name: TaskFlow API Support
    email: api@taskflow.dev

servers:
  - url: https://api.taskflow.dev
    description: Production API (Fly.io)
  - url: http://localhost:5000
    description: Local development

tags:
  - name: Authentication
    description: User registration and login
  - name: Users
    description: User profile management
  - name: Tasks
    description: Task CRUD and hierarchy operations
  - name: TimeEntries
    description: Time tracking and logging
  - name: Comments
    description: Task comments and discussions
  - name: ActivityLogs
    description: Task activity history

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: JWT token obtained from /api/auth/login endpoint
  
  schemas:
    # === Authentication Schemas ===
    RegisterRequest:
      type: object
      required: [email, password, name]
      properties:
        email:
          type: string
          format: email
          example: sarah@example.com
        password:
          type: string
          format: password
          minLength: 8
          pattern: ^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$
          description: Minimum 8 characters with uppercase, lowercase, and number
          example: Password123
        name:
          type: string
          minLength: 2
          maxLength: 100
          example: Sarah Johnson
    
    LoginRequest:
      type: object
      required: [email, password]
      properties:
        email:
          type: string
          format: email
          example: sarah@example.com
        password:
          type: string
          format: password
          example: Password123
    
    AuthResponse:
      type: object
      properties:
        token:
          type: string
          description: JWT bearer token (24 hour expiration)
          example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
        refreshToken:
          type: string
          description: Refresh token for obtaining new JWT
          example: rt_8f3a9c7b2d4e1f6a...
        user:
          $ref: '#/components/schemas/User'
    
    # === User Schemas ===
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
          example: 3fa85f64-5717-4562-b3fc-2c963f66afa6
        email:
          type: string
          format: email
          example: sarah@example.com
        name:
          type: string
          example: Sarah Johnson
        profileImageUrl:
          type: string
          format: uri
          nullable: true
          example: https://supabase.co/storage/v1/object/public/avatars/sarah.jpg
        createdDate:
          type: string
          format: date-time
          example: 2026-01-01T10:30:00Z
        modifiedDate:
          type: string
          format: date-time
          example: 2026-01-13T14:22:00Z
    
    UserUpdateRequest:
      type: object
      properties:
        name:
          type: string
          minLength: 2
          maxLength: 100
        profileImageUrl:
          type: string
          format: uri
          nullable: true
    
    # === Task Schemas ===
    Task:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
          maxLength: 200
          example: Implement authentication backend
        description:
          type: string
          nullable: true
          maxLength: 5000
          example: Set up ASP.NET Core Identity with JWT tokens
        parentTaskId:
          type: string
          format: uuid
          nullable: true
        createdByUserId:
          type: string
          format: uuid
        createdDate:
          type: string
          format: date-time
        modifiedDate:
          type: string
          format: date-time
        dueDate:
          type: string
          format: date-time
          nullable: true
          example: 2026-01-20T23:59:59Z
        priority:
          type: integer
          enum: [0, 1, 2, 3]
          description: 0=Low, 1=Medium, 2=High, 3=Critical
          example: 2
        status:
          type: integer
          enum: [0, 1, 2, 3, 4]
          description: 0=ToDo, 1=InProgress, 2=Blocked, 3=Waiting, 4=Done
          example: 1
        progress:
          type: integer
          minimum: 0
          maximum: 100
          description: Percentage complete (auto-calculated for parents)
          example: 65
        type:
          type: integer
          enum: [0, 1, 2]
          description: 0=Project, 1=Milestone, 2=Task
          example: 2
        isDeleted:
          type: boolean
          default: false
        totalLoggedTime:
          type: integer
          description: Total seconds logged (includes children rollup)
          example: 14400
        assignees:
          type: array
          items:
            $ref: '#/components/schemas/User'
        hasChildren:
          type: boolean
          description: Whether task has child tasks
    
    TaskCreateRequest:
      type: object
      required: [name, priority, status, type]
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 200
        description:
          type: string
          maxLength: 5000
        parentTaskId:
          type: string
          format: uuid
          nullable: true
        dueDate:
          type: string
          format: date-time
          nullable: true
        priority:
          type: integer
          enum: [0, 1, 2, 3]
          default: 1
        status:
          type: integer
          enum: [0, 1, 2, 3, 4]
          default: 0
        type:
          type: integer
          enum: [0, 1, 2]
          default: 2
        assigneeIds:
          type: array
          items:
            type: string
            format: uuid
          description: Initial assignees
    
    TaskUpdateRequest:
      type: object
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 200
        description:
          type: string
          maxLength: 5000
        parentTaskId:
          type: string
          format: uuid
          nullable: true
        dueDate:
          type: string
          format: date-time
          nullable: true
        priority:
          type: integer
          enum: [0, 1, 2, 3]
        status:
          type: integer
          enum: [0, 1, 2, 3, 4]
        progress:
          type: integer
          minimum: 0
          maximum: 100
        type:
          type: integer
          enum: [0, 1, 2]
    
    TaskListResponse:
      type: object
      properties:
        items:
          type: array
          items:
            $ref: '#/components/schemas/Task'
        totalCount:
          type: integer
          example: 234
        page:
          type: integer
          example: 1
        pageSize:
          type: integer
          example: 50
        totalPages:
          type: integer
          example: 5
    
    # === TimeEntry Schemas ===
    TimeEntry:
      type: object
      properties:
        id:
          type: string
          format: uuid
        taskId:
          type: string
          format: uuid
        userId:
          type: string
          format: uuid
        startTime:
          type: string
          format: date-time
        endTime:
          type: string
          format: date-time
          nullable: true
          description: Null indicates active timer
        duration:
          type: integer
          description: Seconds between start and end
          example: 3600
        notes:
          type: string
          nullable: true
          maxLength: 500
        isManual:
          type: boolean
          description: True if manually entered, false if timer-tracked
        createdDate:
          type: string
          format: date-time
        modifiedDate:
          type: string
          format: date-time
        user:
          $ref: '#/components/schemas/User'
    
    TimeEntryCreateRequest:
      type: object
      required: [taskId, startTime, isManual]
      properties:
        taskId:
          type: string
          format: uuid
        startTime:
          type: string
          format: date-time
        endTime:
          type: string
          format: date-time
          nullable: true
          description: Omit for starting active timer
        notes:
          type: string
          maxLength: 500
        isManual:
          type: boolean
    
    TimeEntryUpdateRequest:
      type: object
      properties:
        endTime:
          type: string
          format: date-time
          description: Set to stop active timer
        notes:
          type: string
          maxLength: 500
    
    ActiveTimerResponse:
      type: object
      nullable: true
      properties:
        timeEntryId:
          type: string
          format: uuid
        taskId:
          type: string
          format: uuid
        taskName:
          type: string
        startTime:
          type: string
          format: date-time
        elapsedSeconds:
          type: integer
          description: Calculated server-side
    
    # === Comment Schemas ===
    Comment:
      type: object
      properties:
        id:
          type: string
          format: uuid
        taskId:
          type: string
          format: uuid
        userId:
          type: string
          format: uuid
        parentCommentId:
          type: string
          format: uuid
          nullable: true
        content:
          type: string
          maxLength: 2000
          example: This needs to be done before Friday
        createdDate:
          type: string
          format: date-time
        modifiedDate:
          type: string
          format: date-time
          nullable: true
        isDeleted:
          type: boolean
        mentionedUserIds:
          type: array
          items:
            type: string
            format: uuid
        user:
          $ref: '#/components/schemas/User'
    
    CommentCreateRequest:
      type: object
      required: [taskId, content]
      properties:
        taskId:
          type: string
          format: uuid
        content:
          type: string
          minLength: 1
          maxLength: 2000
        parentCommentId:
          type: string
          format: uuid
          nullable: true
        mentionedUserIds:
          type: array
          items:
            type: string
            format: uuid
    
    CommentUpdateRequest:
      type: object
      required: [content]
      properties:
        content:
          type: string
          minLength: 1
          maxLength: 2000
    
    # === ActivityLog Schemas ===
    ActivityLog:
      type: object
      properties:
        id:
          type: string
          format: uuid
        taskId:
          type: string
          format: uuid
        userId:
          type: string
          format: uuid
        activityType:
          type: integer
          enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
          description: |
            0=TaskCreated, 1=TaskUpdated, 2=StatusChanged, 3=PriorityChanged,
            4=AssigneeAdded, 5=AssigneeRemoved, 6=TimeLogged, 7=CommentAdded,
            8=CommentEdited, 9=CommentDeleted, 10=DueDateChanged, 11=ParentChanged
        timestamp:
          type: string
          format: date-time
        description:
          type: string
          example: Sarah changed status from In Progress to Done
        oldValue:
          type: string
          nullable: true
          description: JSON string of previous state
        newValue:
          type: string
          nullable: true
          description: JSON string of new state
        metadata:
          type: string
          nullable: true
          description: JSON string with additional context
        user:
          $ref: '#/components/schemas/User'
    
    # === Error Schema ===
    ErrorResponse:
      type: object
      required: [error]
      properties:
        error:
          type: string
          example: Invalid credentials
        details:
          type: object
          additionalProperties: true
          example: { "email": ["Email format is invalid"] }

security:
  - BearerAuth: []

paths:
  # === Authentication Endpoints ===
  /api/auth/register:
    post:
      tags: [Authentication]
      summary: Register new user account
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RegisterRequest'
      responses:
        '201':
          description: User registered successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'
        '400':
          description: Validation error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '409':
          description: Email already registered
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
  
  /api/auth/login:
    post:
      tags: [Authentication]
      summary: Login with email and password
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginRequest'
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'
        '401':
          description: Invalid credentials
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
  
  /api/auth/refresh:
    post:
      tags: [Authentication]
      summary: Refresh JWT token using refresh token
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [refreshToken]
              properties:
                refreshToken:
                  type: string
      responses:
        '200':
          description: New tokens issued
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AuthResponse'
        '401':
          description: Invalid or expired refresh token
  
  # === User Endpoints ===
  /api/users/me:
    get:
      tags: [Users]
      summary: Get current user profile
      responses:
        '200':
          description: User profile
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '401':
          description: Unauthorized
    
    put:
      tags: [Users]
      summary: Update current user profile
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UserUpdateRequest'
      responses:
        '200':
          description: Profile updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '400':
          description: Validation error
  
  /api/users/search:
    get:
      tags: [Users]
      summary: Search users by name or email (for assignment picker)
      parameters:
        - name: q
          in: query
          required: true
          schema:
            type: string
          description: Search query (min 2 characters)
          example: sarah
        - name: limit
          in: query
          schema:
            type: integer
            default: 10
            maximum: 50
      responses:
        '200':
          description: Matching users
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
  
  # === Task Endpoints ===
  /api/tasks:
    get:
      tags: [Tasks]
      summary: List tasks with filtering, sorting, pagination
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
            minimum: 1
        - name: pageSize
          in: query
          schema:
            type: integer
            default: 50
            minimum: 1
            maximum: 200
        - name: search
          in: query
          schema:
            type: string
          description: Search in name and description
        - name: status
          in: query
          schema:
            type: array
            items:
              type: integer
          description: Filter by status (comma-separated)
          example: 0,1
        - name: priority
          in: query
          schema:
            type: array
            items:
              type: integer
          description: Filter by priority (comma-separated)
        - name: type
          in: query
          schema:
            type: array
            items:
              type: integer
          description: Filter by type (comma-separated)
        - name: assigneeId
          in: query
          schema:
            type: string
            format: uuid
          description: Filter by assigned user
        - name: dueDateFrom
          in: query
          schema:
            type: string
            format: date
        - name: dueDateTo
          in: query
          schema:
            type: string
            format: date
        - name: sortBy
          in: query
          schema:
            type: string
            enum: [name, createdDate, modifiedDate, dueDate, priority, status, totalLoggedTime]
            default: createdDate
        - name: sortOrder
          in: query
          schema:
            type: string
            enum: [asc, desc]
            default: desc
        - name: includeChildren
          in: query
          schema:
            type: boolean
            default: false
          description: Include child tasks in response
      responses:
        '200':
          description: Task list
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TaskListResponse'
        '400':
          description: Invalid query parameters
    
    post:
      tags: [Tasks]
      summary: Create new task
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TaskCreateRequest'
      responses:
        '201':
          description: Task created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Task'
        '400':
          description: Validation error
        '404':
          description: Parent task not found
  
  /api/tasks/{id}:
    get:
      tags: [Tasks]
      summary: Get task by ID
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Task details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Task'
        '404':
          description: Task not found
    
    put:
      tags: [Tasks]
      summary: Update task (full update)
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TaskUpdateRequest'
      responses:
        '200':
          description: Task updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Task'
        '400':
          description: Validation error (e.g., circular reference)
        '403':
          description: Not authorized to modify this task
        '404':
          description: Task not found
    
    delete:
      tags: [Tasks]
      summary: Delete task (soft delete)
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '204':
          description: Task deleted
        '403':
          description: Not authorized to delete this task
        '404':
          description: Task not found
  
  /api/tasks/{id}/children:
    get:
      tags: [Tasks]
      summary: Get immediate child tasks
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Child tasks
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Task'
  
  /api/tasks/{id}/descendants:
    get:
      tags: [Tasks]
      summary: Get full task subtree (recursive)
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
        - name: maxDepth
          in: query
          schema:
            type: integer
            default: 10
            maximum: 15
      responses:
        '200':
          description: Task subtree
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Task'
  
  /api/tasks/{id}/assignments:
    get:
      tags: [Tasks]
      summary: Get task assignees
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Assigned users
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
    
    post:
      tags: [Tasks]
      summary: Assign user(s) to task
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [userIds]
              properties:
                userIds:
                  type: array
                  items:
                    type: string
                    format: uuid
      responses:
        '200':
          description: Users assigned
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
        '404':
          description: Task or user not found
  
  /api/tasks/{id}/assignments/{userId}:
    delete:
      tags: [Tasks]
      summary: Remove user assignment from task
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
        - name: userId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '204':
          description: Assignment removed
        '404':
          description: Task or assignment not found
  
  # === TimeEntry Endpoints ===
  /api/timeentries:
    post:
      tags: [TimeEntries]
      summary: Create time entry (start timer or manual log)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TimeEntryCreateRequest'
      responses:
        '201':
          description: Time entry created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TimeEntry'
        '400':
          description: Validation error (e.g., another timer running)
        '404':
          description: Task not found
  
  /api/timeentries/{id}:
    get:
      tags: [TimeEntries]
      summary: Get time entry by ID
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Time entry details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TimeEntry'
        '404':
          description: Time entry not found
    
    patch:
      tags: [TimeEntries]
      summary: Update time entry (stop timer or edit notes)
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TimeEntryUpdateRequest'
      responses:
        '200':
          description: Time entry updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TimeEntry'
        '403':
          description: Not authorized to modify this entry
        '404':
          description: Time entry not found
    
    delete:
      tags: [TimeEntries]
      summary: Delete time entry
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '204':
          description: Time entry deleted
        '403':
          description: Not authorized to delete this entry
        '404':
          description: Time entry not found
  
  /api/timeentries/active:
    get:
      tags: [TimeEntries]
      summary: Get current user's active timer (if any)
      responses:
        '200':
          description: Active timer or null
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ActiveTimerResponse'
  
  /api/tasks/{taskId}/timeentries:
    get:
      tags: [TimeEntries]
      summary: Get all time entries for a task
      parameters:
        - name: taskId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Time entries
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/TimeEntry'
        '404':
          description: Task not found
  
  # === Comment Endpoints ===
  /api/comments:
    post:
      tags: [Comments]
      summary: Create comment on task
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CommentCreateRequest'
      responses:
        '201':
          description: Comment created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Comment'
        '400':
          description: Validation error
        '404':
          description: Task not found
  
  /api/comments/{id}:
    get:
      tags: [Comments]
      summary: Get comment by ID
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Comment details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Comment'
        '404':
          description: Comment not found
    
    put:
      tags: [Comments]
      summary: Update comment content
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CommentUpdateRequest'
      responses:
        '200':
          description: Comment updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Comment'
        '403':
          description: Not authorized to edit this comment
        '404':
          description: Comment not found
    
    delete:
      tags: [Comments]
      summary: Delete comment (soft delete)
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '204':
          description: Comment deleted
        '403':
          description: Not authorized to delete this comment
        '404':
          description: Comment not found
  
  /api/tasks/{taskId}/comments:
    get:
      tags: [Comments]
      summary: Get all comments for a task
      parameters:
        - name: taskId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Task comments
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Comment'
        '404':
          description: Task not found
  
  # === ActivityLog Endpoints ===
  /api/tasks/{taskId}/activities:
    get:
      tags: [ActivityLogs]
      summary: Get activity log for a task
      parameters:
        - name: taskId
          in: path
          required: true
          schema:
            type: string
            format: uuid
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: pageSize
          in: query
          schema:
            type: integer
            default: 50
            maximum: 100
      responses:
        '200':
          description: Activity log entries
          content:
            application/json:
              schema:
                type: object
                properties:
                  items:
                    type: array
                    items:
                      $ref: '#/components/schemas/ActivityLog'
                  totalCount:
                    type: integer
                  page:
                    type: integer
                  pageSize:
                    type: integer
        '404':
          description: Task not found
```

### Authentication Flow

All API endpoints except `/api/auth/register` and `/api/auth/login` require JWT authentication:

1. **Registration/Login:** Client sends credentials to `/api/auth/login` or `/api/auth/register`
2. **Token Issuance:** Server validates credentials, issues JWT (24h expiry) + refresh token (30d expiry)
3. **Authenticated Requests:** Client includes JWT in `Authorization: Bearer <token>` header
4. **Token Refresh:** Before JWT expires, client calls `/api/auth/refresh` with refresh token to get new JWT
5. **Token Validation:** API middleware validates JWT signature, expiration, and extracts user ID for authorization

**Security Features:**
- Passwords hashed with bcrypt (cost factor 12) via ASP.NET Core Identity (NFR10)
- JWT signed with HS256 using 256-bit secret key stored in environment variable
- Refresh tokens stored in database with user binding, revocable for logout
- HTTPS enforced in production (Fly.io automatic TLS)
- Rate limiting via ASP.NET Core middleware (100 requests/minute per IP)

### Error Handling

**Standard HTTP Status Codes:**
- `200 OK` - Successful GET/PUT/PATCH
- `201 Created` - Successful POST (returns created resource)
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Validation error, malformed request
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Valid token but insufficient permissions
- `404 Not Found` - Resource does not exist
- `409 Conflict` - Duplicate resource (e.g., email already registered)
- `500 Internal Server Error` - Unexpected server error

**Error Response Format:**
```json
{
  "error": "Validation failed",
  "details": {
    "name": ["Name is required"],
    "dueDate": ["Due date must be in the future"]
  }
}
```

### API Performance Targets

Based on NFR1-4 requirements:

- **Task List (500 tasks):** < 500ms response time (NFR2)
- **Task Create/Update:** < 200ms response time
- **Recursive Hierarchy Query (100 tasks):** < 1s response time (NFR19)
- **Time Entry Operations:** < 100ms response time (NFR4)
- **Search/Filter Queries:** < 500ms response time with proper indexing

**Optimization Strategies:**
- Database indexes on foreign keys, status, dueDate, createdDate
- EF Core query optimization (select projections, eager loading)
- Response caching for read-heavy endpoints (user profile, task details)
- Pagination required for large result sets (max 200 items per page)
- Connection pooling and async/await throughout API layer


## Components

This section identifies the major logical components across the TaskFlow fullstack architecture, defining their responsibilities, interfaces, dependencies, and technology implementations. Components are organized into **Frontend Components** (Angular), **Backend Components** (ASP.NET Core), and **Infrastructure Components** (Supabase, Fly.io, Vercel).

**Component Architecture Principles:**
- **Single Responsibility:** Each component has one clear purpose with well-defined boundaries
- **Dependency Inversion:** Components depend on interfaces/abstractions, not concrete implementations
- **Layered Architecture:** Clear separation between presentation, business logic, and data access layers
- **Loose Coupling:** Components communicate via well-defined contracts (REST APIs, interfaces)
- **High Cohesion:** Related functionality grouped together within component boundaries

### Frontend Components (Angular SPA)

#### AppShell Component

**Responsibility:** Root application component providing layout structure, navigation, authentication state management, and routing configuration. Handles application-wide concerns like error boundaries and global loading states.

**Key Interfaces:**
- `AppComponent` - Root component with router outlet and navigation shell
- `NavigationComponent` - Top navigation bar with user profile, logout, "My Tasks" toggle
- `SidebarComponent` - Left sidebar navigation for views (List, Tree, Timeline)
- `AuthGuard` - Route guard protecting authenticated routes

**Dependencies:**
- `AuthService` for authentication state (`isAuthenticated()`, `getCurrentUser()`)
- `Router` for navigation and route configuration
- Angular Material components for UI (MatToolbar, MatSidenav)

**Technology Stack:** Angular 20 standalone components, Angular Router, Angular Material 20, RxJS for reactive state

#### Authentication Module

**Responsibility:** Handles user authentication flow including registration, login, logout, JWT token management, and HTTP request interception for adding authorization headers.

**Key Interfaces:**
- `LoginComponent` - Login form with email/password fields
- `RegisterComponent` - Registration form with validation
- `AuthService` - Service managing JWT tokens and user session
- `AuthInterceptor` - HTTP interceptor adding `Authorization: Bearer <token>` header
- `AuthGuard` - Prevents unauthenticated access to protected routes

**Dependencies:**
- `HttpClient` for API calls to `/api/auth/login`, `/api/auth/register`, `/api/auth/refresh`
- `Router` for navigation after login/logout
- `LocalStorage` for JWT token persistence

**Technology Stack:** Angular 20 reactive forms, Angular HttpClient with interceptors, RxJS BehaviorSubject for auth state, localStorage API

#### Task Management Module

**Responsibility:** Core task CRUD operations including task list views (table, tree, Gantt), task creation/editing forms, task detail panels, filtering/sorting/searching, and drag-and-drop hierarchy management.

**Key Interfaces:**
- `TaskListComponent` - Data table view with sortable columns, filters, pagination
- `TaskTreeComponent` - Hierarchical tree view with expand/collapse and drag-and-drop
- `TaskGanttComponent` - Timeline/Gantt chart view with date-based rendering
- `TaskDetailComponent` - Slide-out panel showing full task details, comments, time log
- `TaskFormComponent` - Reusable form for create/edit with validation
- `TaskService` - HTTP service for task API operations

**Dependencies:**
- `TaskService` for API calls (`getTasks()`, `createTask()`, `updateTask()`, `deleteTask()`)
- `@circlon/angular-tree-component` or Angular Material Tree for tree view
- Gantt library (Frappe Gantt or custom SVG/D3.js implementation)
- Angular CDK Drag-Drop for reparenting

**Technology Stack:** Angular 20 components, Angular Material 20 (MatTable, MatPaginator, MatSort), Angular CDK, RxJS Observables, Angular Reactive Forms

#### Time Tracking Module

**Responsibility:** Manages time tracking features including active timer UI, manual time entry forms, time log display, and timer state persistence across page refreshes.

**Key Interfaces:**
- `TimerWidgetComponent` - Floating/sticky timer display showing elapsed time
- `ManualTimeEntryComponent` - Form for logging past time with duration and notes
- `TimeLogComponent` - List of time entries for a task with user attribution
- `TimeTrackingService` - Service managing timer state and API operations

**Dependencies:**
- `TimeTrackingService` for API calls (`startTimer()`, `stopTimer()`, `logManualTime()`)
- `TaskService` for task context
- `LocalStorage` for persisting active timer state across refreshes
- Browser `setInterval()` for timer updates every second

**Technology Stack:** Angular 20 components, Angular Material 20 (MatDialog for time entry form), RxJS interval for timer ticks, localStorage for state persistence

#### Collaboration Module

**Responsibility:** Team collaboration features including task assignments (user picker), comment threads with markdown support, activity log display, and user mentions.

**Key Interfaces:**
- `AssignmentPickerComponent` - User search/autocomplete for assigning tasks
- `CommentThreadComponent` - Display comment list with nested replies (post-MVP)
- `CommentFormComponent` - Textarea with markdown support and @mentions
- `ActivityLogComponent` - Timeline view of task changes with user attribution
- `CollaborationService` - HTTP service for comments and assignments

**Dependencies:**
- `CollaborationService` for API calls (`getComments()`, `createComment()`, `assignUser()`)
- `UserService` for user search (`searchUsers()`)
- Markdown library (ngx-markdown or marked.js) for comment rendering
- `AuthService` for current user context

**Technology Stack:** Angular 20 components, Angular Material 20 (MatAutocomplete, MatChip), RxJS, ngx-markdown for markdown rendering

#### Shared Services Layer

**Responsibility:** Centralized HTTP services abstracting backend API communication, providing strongly-typed interfaces matching backend DTOs, handling errors, and managing loading states.

**Key Interfaces:**
- `AuthService` - Authentication operations (`login()`, `register()`, `logout()`, `refreshToken()`)
- `TaskService` - Task CRUD and hierarchy operations
- `TimeTrackingService` - Time entry operations
- `UserService` - User profile and search operations
- `CollaborationService` - Comments and assignments
- `ActivityLogService` - Activity history retrieval
- `HttpErrorInterceptor` - Global error handling for API failures

**Dependencies:**
- `HttpClient` for HTTP requests
- `AuthInterceptor` for adding JWT tokens
- RxJS operators for request transformation and error handling

**Technology Stack:** Angular 20 services (singleton via `providedIn: 'root'`), Angular HttpClient, RxJS Observables, TypeScript interfaces (auto-generated from C# DTOs via NSwag)

---

### Backend Components (ASP.NET Core API)

#### API Controllers Layer

**Responsibility:** Exposes RESTful HTTP endpoints, handles request/response serialization, validates incoming data via model validation, enforces authorization, and delegates business logic to service layer.

**Key Interfaces:**
- `AuthController` - `/api/auth/*` endpoints (register, login, refresh)
- `UsersController` - `/api/users/*` endpoints (profile management, search)
- `TasksController` - `/api/tasks/*` endpoints (CRUD, hierarchy, assignments)
- `TimeEntriesController` - `/api/timeentries/*` endpoints (create, update, delete, active timer)
- `CommentsController` - `/api/comments/*` endpoints (create, update, delete)
- `ActivityLogsController` - `/api/tasks/{id}/activities` endpoint

**Dependencies:**
- Service layer interfaces (`ITaskService`, `IUserService`, `ITimeTrackingService`, `ICommentService`)
- ASP.NET Core Identity for authentication context (`User.FindFirst(ClaimTypes.NameIdentifier)`)
- ASP.NET Core Model Validation for request DTO validation
- Swashbuckle for OpenAPI documentation generation

**Technology Stack:** ASP.NET Core 8.0 Web API controllers, attribute routing, model binding, `[Authorize]` attribute for JWT validation, async/await pattern

#### Business Logic (Service Layer)

**Responsibility:** Encapsulates domain business logic, orchestrates repository operations, enforces business rules (circular reference prevention, depth limits), calculates derived values (parent progress, time rollup), and manages transactions.

**Key Interfaces:**
- `IUserService` / `UserService` - User management, password hashing, profile updates
- `ITaskService` / `TaskService` - Task CRUD, hierarchy validation, assignment management
- `ITimeTrackingService` / `TimeTrackingService` - Time entry logic, duration calculations, rollup aggregation
- `ICommentService` / `CommentService` - Comment creation, edit permissions, soft delete
- `IActivityLogService` / `ActivityLogService` - Activity event creation, description formatting

**Dependencies:**
- Repository interfaces (`ITaskRepository`, `IUserRepository`, `ITimeEntryRepository`, `ICommentRepository`)
- `IUnitOfWork` for transaction management
- ASP.NET Core Identity `UserManager` and `SignInManager` for user operations
- AutoMapper for DTO-to-entity mapping

**Technology Stack:** C# 12 with async/await, dependency injection, LINQ queries, business logic validation, transaction management via Unit of Work pattern

#### Data Access (Repository Layer)

**Responsibility:** Abstracts database access via Entity Framework Core, provides generic CRUD operations, implements specialized queries (recursive CTEs, full-text search, complex filters), and handles database transactions.

**Key Interfaces:**
- `IRepository<T>` - Generic repository with CRUD operations (`GetById`, `Add`, `Update`, `Delete`, `Find`)
- `ITaskRepository` - Specialized task queries (`GetHierarchy`, `GetDescendants`, `GetByFilters`)
- `IUserRepository` - User queries (`GetByEmail`, `SearchUsers`)
- `ITimeEntryRepository` - Time queries (`GetTaskTimeEntries`, `GetActiveTimer`)
- `ICommentRepository` - Comment queries (`GetTaskComments`)
- `IActivityLogRepository` - Activity queries with pagination
- `IUnitOfWork` - Transaction management with `SaveChangesAsync()`

**Dependencies:**
- `ApplicationDbContext` - EF Core DbContext with entity configurations
- Entity Framework Core 8.0 for ORM operations
- PostgreSQL provider (`Npgsql.EntityFrameworkCore.PostgreSQL`)

**Technology Stack:** Entity Framework Core 8.0, LINQ-to-SQL, async queries, DbContext with dependency injection, repository pattern, unit of work pattern

#### Database Context (ApplicationDbContext)

**Responsibility:** Entity Framework Core DbContext managing database connection, entity configurations, migrations, change tracking, and SQL query generation.

**Key Interfaces:**
- `ApplicationDbContext` - DbContext with DbSet properties for each entity
- `DbSet<User>`, `DbSet<Task>`, `DbSet<TimeEntry>`, `DbSet<Comment>`, `DbSet<TaskAssignee>`, `DbSet<ActivityLog>`
- Entity configurations via Fluent API (`OnModelCreating`)
- Migration history tracking

**Dependencies:**
- PostgreSQL database connection string (from configuration)
- Entity class definitions (User, Task, TimeEntry, Comment, TaskAssignee, ActivityLog)
- EF Core migrations for schema versioning

**Technology Stack:** Entity Framework Core 8.0, Fluent API for entity configuration, code-first migrations, PostgreSQL provider, connection pooling

#### Authentication & Authorization Middleware

**Responsibility:** Validates JWT bearer tokens, extracts user identity from claims, enforces authorization policies, handles token refresh, and provides user context to controllers/services.

**Key Interfaces:**
- `JwtBearerMiddleware` - ASP.NET Core JWT authentication middleware
- `AuthorizationMiddleware` - Role/policy-based authorization
- `JwtTokenService` - Token generation and validation utility
- `RefreshTokenRepository` - Refresh token storage and validation

**Dependencies:**
- ASP.NET Core Identity for user management
- `JwtSecurityTokenHandler` for token generation/validation
- Configuration for JWT secret key, issuer, audience

**Technology Stack:** ASP.NET Core Identity 8.0, JWT bearer authentication, bcrypt password hashing (via Identity), refresh token pattern with database storage

---

### Infrastructure Components

#### Vercel Edge Network (Frontend Hosting)

**Responsibility:** Serves static Angular build artifacts (HTML, CSS, JS bundles) with global CDN distribution, provides automatic HTTPS, handles routing for Angular SPA, and enables instant deployments from Git.

**Key Interfaces:**
- Static file serving at `https://taskflow.vercel.app`
- Environment variable injection for API endpoint configuration
- Build hooks for automatic deployment on Git push
- Analytics and Web Vitals monitoring

**Dependencies:**
- GitHub repository for source code and CI/CD triggers
- Angular CLI production build output (`ng build --configuration production`)

**Technology Stack:** Vercel platform, global edge network, automatic HTTPS, Git-based deployments, serverless functions (not used in TaskFlow)

#### Fly.io Container Platform (Backend Hosting)

**Responsibility:** Hosts ASP.NET Core API in Docker containers, provides persistent volumes for any local state, manages multi-region deployment, automatic HTTPS via Fly Proxy, health checks, and horizontal scaling.

**Key Interfaces:**
- API accessible at `https://api.taskflow.fly.dev`
- Fly.io CLI for deployment (`fly deploy`)
- `fly.toml` configuration for app settings (regions, scaling, health checks)
- Dockerfile for .NET API containerization

**Dependencies:**
- Docker for containerization
- ASP.NET Core 8.0 runtime
- Connection to Supabase PostgreSQL

**Technology Stack:** Fly.io platform, Docker 24+, multi-region deployment (iad primary), automatic TLS, container orchestration, health monitoring

#### Supabase PostgreSQL Database

**Responsibility:** Provides managed PostgreSQL 15+ database with recursive CTE support, full-text search, ACID transactions, automated backups, connection pooling, and row-level security (RLS) for direct client access if needed.

**Key Interfaces:**
- PostgreSQL connection string with credentials
- Database migrations via EF Core (`dotnet ef migrations add`, `dotnet ef database update`)
- Direct SQL access for recursive CTEs
- Supabase Studio for database management UI

**Dependencies:**
- Entity Framework Core 8.0 with Npgsql provider
- Database schema defined via EF Core entities

**Technology Stack:** Supabase platform, PostgreSQL 15+, pgvector extension (post-MVP for semantic search), automated backups, connection pooling

#### Supabase Storage (File Storage)

**Responsibility:** Stores user profile images with signed URL access, supports direct client uploads from Angular, provides image transformations, and enforces row-level security policies.

**Key Interfaces:**
- Storage bucket: `avatars`
- Upload endpoint for Angular HttpClient
- Signed URL generation for secure access
- RLS policies limiting access to authenticated users

**Dependencies:**
- Supabase JavaScript client (used from Angular if direct upload)
- Or backend proxy for uploads via ASP.NET Core

**Technology Stack:** Supabase Storage (S3-compatible), signed URLs, image transformation CDN, RLS for access control

---

### Component Interaction Diagram

```mermaid
graph TB
    subgraph "Frontend - Angular SPA on Vercel"
        AppShell[App Shell Component]
        AuthModule[Authentication Module]
        TaskModule[Task Management Module]
        TimeModule[Time Tracking Module]
        CollabModule[Collaboration Module]
        Services[Shared Services Layer]
    end
    
    subgraph "Backend - ASP.NET Core on Fly.io"
        Controllers[API Controllers Layer]
        BusinessLogic[Business Logic Services]
        Repositories[Repository Layer]
        DbContext[EF Core DbContext]
        AuthMiddleware[Auth Middleware]
    end
    
    subgraph "Infrastructure - Supabase"
        PostgresDB[(PostgreSQL Database)]
        Storage[Supabase Storage]
    end
    
    User[User Browser] -->|HTTPS| AppShell
    AppShell --> AuthModule
    AppShell --> TaskModule
    AppShell --> TimeModule
    AppShell --> CollabModule
    
    AuthModule --> Services
    TaskModule --> Services
    TimeModule --> Services
    CollabModule --> Services
    
    Services -->|REST API| AuthMiddleware
    AuthMiddleware --> Controllers
    Controllers --> BusinessLogic
    BusinessLogic --> Repositories
    Repositories --> DbContext
    DbContext -->|EF Core| PostgresDB
    
    TaskModule -.->|Direct Upload| Storage
    
    style AppShell fill:#dd0031
    style Controllers fill:#512bd4
    style PostgresDB fill:#3ECF8E
    style Storage fill:#3ECF8E
```

### Component Communication Patterns

**Frontend to Backend:**
- **Protocol:** HTTPS REST API with JSON payloads
- **Authentication:** JWT bearer token in `Authorization` header
- **Error Handling:** HTTP status codes with standardized error response format
- **Loading States:** RxJS Observable streams with loading/error/success states
- **Polling:** HTTP polling at 30-second intervals for activity log updates

**Backend Internal:**
- **Controller → Service:** Dependency injection, async/await method calls
- **Service → Repository:** Interface-based calls with Unit of Work for transactions
- **Repository → Database:** Entity Framework Core LINQ queries, compiled to SQL
- **Cross-Cutting Concerns:** Middleware pipeline (auth, logging, error handling)

**Database Access:**
- **Standard Queries:** EF Core LINQ with automatic SQL generation
- **Recursive Queries:** Raw SQL with `FromSqlRaw()` for WITH RECURSIVE CTEs
- **Transactions:** Unit of Work pattern with `SaveChangesAsync()` commit boundary

**File Storage:**
- **Profile Images:** Direct upload from Angular to Supabase Storage (post-MVP), or proxy through .NET API for consistency


## External APIs

TaskFlow MVP **does not require external API integrations** beyond its core infrastructure services (Supabase for database/storage, which are platform services rather than external APIs). The application is self-contained with all business logic implemented in the ASP.NET Core backend.

**Rationale for No External APIs:**
- **Authentication:** Handled internally via ASP.NET Core Identity and JWT tokens (NFR10)
- **Email Services:** Email confirmation and notifications deferred to post-MVP (reduces complexity and cost)
- **Payment Processing:** Freemium model and paid plans deferred to post-MVP v2.0+ (focus on product-market fit first)
- **Analytics:** Built-in Fly.io metrics and Vercel analytics sufficient for MVP monitoring
- **File Storage:** Supabase Storage is part of infrastructure platform, not external integration
- **Search:** Full-text search via PostgreSQL's built-in capabilities, no need for Elasticsearch/Algolia
- **Real-Time Updates:** HTTP polling sufficient for MVP use cases (NFR requirement, no WebSocket/SignalR complexity)

**Post-MVP External API Considerations:**

When TaskFlow scales beyond MVP, the following external APIs may be integrated:

1. **Email Service (SendGrid, AWS SES, or Resend):**
   - Purpose: Transactional emails (email confirmation, password reset, task assignment notifications)
   - Priority: High for production launch
   - Integration Point: Background job triggered by ActivityLog events

2. **Payment Processing (Stripe):**
   - Purpose: Subscription billing for freemium-to-paid conversion
   - Priority: High once product-market fit validated (1000+ active users goal achieved)
   - Integration Point: New BillingController and SubscriptionService

3. **Error Tracking (Sentry):**
   - Purpose: Production error monitoring and alerting beyond basic Fly.io logs
   - Priority: Medium for production stability
   - Integration Point: ASP.NET Core middleware integration

4. **Calendar Integration (Google Calendar, Outlook Calendar APIs):**
   - Purpose: Sync task due dates to external calendars
   - Priority: Low, nice-to-have feature
   - Integration Point: New IntegrationService with OAuth flows

5. **Slack/Teams Integration:**
   - Purpose: Post task updates and comments to team channels
   - Priority: Medium for team collaboration enhancement
   - Integration Point: Webhook notifications from ActivityLog events

6. **OAuth Providers (Google, Microsoft, GitHub):**
   - Purpose: Social login to reduce registration friction
   - Priority: Medium for user acquisition
   - Integration Point: ASP.NET Core Identity external authentication


## Core Workflows

This section illustrates the key system workflows using sequence diagrams, showing how frontend components, backend services, and infrastructure interact to fulfill critical user journeys from the PRD.

### User Registration and Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant Angular as Angular SPA
    participant AuthService as Auth Service
    participant API as API Controller
    participant Identity as ASP.NET Core Identity
    participant DB as PostgreSQL
    
    Note over User,DB: Registration Flow
    User->>Angular: Fills registration form (email, password, name)
    Angular->>Angular: Client-side validation
    Angular->>API: POST /api/auth/register
    API->>API: Model validation
    API->>Identity: Check if email exists
    Identity->>DB: Query Users table
    DB-->>Identity: Email available
    Identity->>Identity: Hash password (bcrypt)
    Identity->>DB: INSERT new User
    DB-->>Identity: User created
    Identity->>Identity: Generate JWT token (24h expiry)
    Identity->>Identity: Generate refresh token (30d expiry)
    Identity->>DB: Store refresh token
    API-->>Angular: 201 Created {token, refreshToken, user}
    Angular->>AuthService: Store tokens in localStorage
    Angular->>Angular: Navigate to dashboard
    
    Note over User,DB: Login Flow
    User->>Angular: Enters email/password
    Angular->>API: POST /api/auth/login
    API->>Identity: Verify credentials
    Identity->>DB: Query User by email
    DB-->>Identity: User record
    Identity->>Identity: Verify password hash (bcrypt)
    Identity->>Identity: Generate JWT + refresh token
    Identity->>DB: Store refresh token
    API-->>Angular: 200 OK {token, refreshToken, user}
    Angular->>AuthService: Store tokens in localStorage
    Angular->>Angular: Navigate to dashboard
    
    Note over User,DB: Authenticated Request Flow
    User->>Angular: Performs action (e.g., create task)
    Angular->>API: POST /api/tasks (Authorization: Bearer <token>)
    API->>API: JWT Middleware validates token
    API->>API: Extract userId from claims
    API->>API: Process request with user context
    API-->>Angular: 201 Created {task}
    
    Note over User,DB: Token Refresh Flow
    Angular->>Angular: Detects JWT expiring soon
    Angular->>API: POST /api/auth/refresh {refreshToken}
    API->>DB: Validate refresh token
    DB-->>API: Token valid
    API->>API: Generate new JWT
    API-->>Angular: 200 OK {token, refreshToken}
    Angular->>AuthService: Update stored tokens
```

### Task Creation with Hierarchy and Assignment

```mermaid
sequenceDiagram
    actor User
    participant Angular as Task Form Component
    participant TaskService as Task Service
    participant API as Tasks Controller
    participant Service as Task Service (Backend)
    participant Repo as Task Repository
    participant DB as PostgreSQL
    participant ActivityLog as Activity Log Service
    
    User->>Angular: Opens create task form
    Angular->>Angular: Displays form (name, description, parent, assignees, etc.)
    User->>Angular: Fills form and selects parent task
    User->>Angular: Adds 2 assignees via user picker
    Angular->>Angular: Client-side validation
    
    Angular->>TaskService: createTask(taskDto)
    TaskService->>API: POST /api/tasks (with JWT token)
    API->>API: Validate JWT, extract userId
    API->>Service: CreateTask(taskDto, currentUserId)
    
    Service->>Service: Validate parent task exists
    Service->>Repo: GetById(parentTaskId)
    Repo->>DB: SELECT * FROM Tasks WHERE Id = ?
    DB-->>Repo: Parent task
    Repo-->>Service: Parent task
    
    Service->>Service: Check circular reference (prevent task as own ancestor)
    Service->>Repo: GetAncestors(parentTaskId)
    Repo->>DB: WITH RECURSIVE ... SELECT ancestors
    DB-->>Repo: Ancestor chain
    Repo-->>Service: Ancestors (validated: no circular ref)
    
    Service->>Service: Create Task entity
    Service->>Repo: Add(task)
    Repo->>DB: BEGIN TRANSACTION
    Repo->>DB: INSERT INTO Tasks VALUES (...)
    
    Service->>Service: Process assignees
    loop For each assigneeId
        Service->>Repo: AddAssignment(taskId, userId)
        Repo->>DB: INSERT INTO TaskAssignees VALUES (...)
    end
    
    Service->>ActivityLog: LogTaskCreated(task, currentUser)
    ActivityLog->>DB: INSERT INTO ActivityLogs VALUES (...)
    
    Service->>Repo: SaveChanges()
    Repo->>DB: COMMIT TRANSACTION
    DB-->>Repo: Success
    Repo-->>Service: Task created
    Service-->>API: Task entity with assignees
    API-->>TaskService: 201 Created {task}
    TaskService-->>Angular: Task observable emits
    Angular->>Angular: Update task list UI
    Angular->>Angular: Show success toast "Task created"
    Angular->>User: Display new task in list
```

### Time Tracking: Start Timer → Stop Timer → Time Rollup

```mermaid
sequenceDiagram
    actor User
    participant Angular as Timer Widget
    participant TimeService as Time Tracking Service
    participant API as Time Entries Controller
    participant Service as Time Tracking Service (Backend)
    participant Repo as Time Entry Repository
    participant TaskRepo as Task Repository
    participant DB as PostgreSQL
    
    Note over User,DB: Start Timer
    User->>Angular: Clicks "Start Timer" on task
    Angular->>Angular: Check for existing active timer
    Angular->>TimeService: startTimer(taskId)
    TimeService->>API: POST /api/timeentries {taskId, startTime, endTime: null}
    API->>Service: CreateTimeEntry(dto, userId)
    Service->>Repo: GetActiveTimer(userId)
    Repo->>DB: SELECT * FROM TimeEntries WHERE UserId = ? AND EndTime IS NULL
    DB-->>Repo: No active timer
    Service->>Service: Create TimeEntry (EndTime = null)
    Service->>Repo: Add(timeEntry)
    Repo->>DB: INSERT INTO TimeEntries (startTime, endTime=NULL, ...)
    DB-->>Repo: TimeEntry created
    Repo-->>Service: TimeEntry
    Service-->>API: 201 Created {timeEntry}
    API-->>TimeService: TimeEntry
    TimeService->>Angular: Store active timer in component state
    Angular->>Angular: Start interval (update every 1 second)
    Angular->>Angular: Display timer widget (00:00:01, 00:00:02, ...)
    
    Note over User,DB: Stop Timer
    User->>Angular: Clicks "Stop Timer"
    Angular->>Angular: Calculate duration from startTime
    Angular->>TimeService: stopTimer(timeEntryId, endTime)
    TimeService->>API: PATCH /api/timeentries/{id} {endTime}
    API->>Service: UpdateTimeEntry(id, endTime, userId)
    Service->>Repo: GetById(id)
    Repo->>DB: SELECT * FROM TimeEntries WHERE Id = ?
    DB-->>Repo: TimeEntry (with startTime)
    Service->>Service: Verify userId matches (authorization)
    Service->>Service: Set endTime, calculate duration
    Service->>Repo: Update(timeEntry)
    Repo->>DB: BEGIN TRANSACTION
    Repo->>DB: UPDATE TimeEntries SET EndTime = ?, Duration = ?
    
    Note over User,DB: Time Rollup to Parent Tasks
    Service->>Service: Trigger time rollup for task hierarchy
    Service->>TaskRepo: GetAncestors(taskId)
    TaskRepo->>DB: WITH RECURSIVE cte AS (SELECT parent...) SELECT ancestors
    DB-->>TaskRepo: Ancestor task IDs
    
    loop For each ancestor task
        Service->>TaskRepo: RecalculateTotalLoggedTime(ancestorTaskId)
        TaskRepo->>DB: WITH RECURSIVE ... SUM(Duration) FROM TimeEntries + descendants
        DB-->>TaskRepo: Total seconds
        TaskRepo->>DB: UPDATE Tasks SET TotalLoggedTime = ? WHERE Id = ?
    end
    
    Service->>Repo: SaveChanges()
    Repo->>DB: COMMIT TRANSACTION
    DB-->>Repo: Success
    Repo-->>Service: Updated TimeEntry
    Service-->>API: 200 OK {timeEntry}
    API-->>TimeService: TimeEntry with duration
    TimeService->>Angular: Update task totalLoggedTime
    Angular->>Angular: Clear timer widget
    Angular->>Angular: Refresh task list (show updated logged time)
    Angular->>Angular: Show success toast "2h 30m logged"
```

### Hierarchical Task Query with Recursive CTE

```mermaid
sequenceDiagram
    actor User
    participant Angular as Task Tree Component
    participant TaskService as Task Service
    participant API as Tasks Controller
    participant Service as Task Service (Backend)
    participant Repo as Task Repository
    participant DB as PostgreSQL
    
    User->>Angular: Opens tree view
    Angular->>TaskService: getTasks({includeChildren: true})
    TaskService->>API: GET /api/tasks?includeChildren=true
    API->>Service: GetUserTasks(userId, includeChildren)
    Service->>Repo: GetTaskHierarchy(userId)
    
    Note over Repo,DB: Recursive CTE Query
    Repo->>DB: Execute recursive CTE query
    DB->>DB: WITH RECURSIVE task_tree AS (<br/>  SELECT *, 0 as depth FROM Tasks WHERE ParentTaskId IS NULL<br/>  UNION ALL<br/>  SELECT t.*, tt.depth + 1 FROM Tasks t<br/>  JOIN task_tree tt ON t.ParentTaskId = tt.Id<br/>  WHERE tt.depth < 15<br/>)<br/>SELECT * FROM task_tree ORDER BY depth, Name
    DB-->>Repo: Hierarchical result set with depth
    
    Repo->>Repo: Map to Task entities with children collections
    Repo->>DB: Load assignees (JOIN TaskAssignees + Users)
    DB-->>Repo: Assignee data
    Repo->>DB: Load totalLoggedTime (pre-calculated)
    DB-->>Repo: Time data
    Repo-->>Service: Task tree structure
    
    Service->>Service: Apply authorization filter (only user's tasks)
    Service->>Service: Calculate hasChildren flags
    Service-->>API: Task list with hierarchy
    API-->>TaskService: 200 OK {tasks[]}
    TaskService-->>Angular: Observable emits task array
    Angular->>Angular: Build tree structure from flat array (parentId references)
    Angular->>Angular: Render tree with expand/collapse icons
    Angular->>User: Display hierarchical tree view
    
    User->>Angular: Expands a task node
    Angular->>Angular: Show children (already loaded)
    User->>Angular: Drag task to new parent (reparenting)
    Angular->>TaskService: updateTask(taskId, {parentTaskId: newParentId})
    TaskService->>API: PUT /api/tasks/{id} {parentTaskId}
    API->>Service: UpdateTask(id, dto, userId)
    Service->>Repo: GetById(id)
    Service->>Service: Validate no circular reference
    Service->>Repo: GetDescendants(id)
    Repo->>DB: WITH RECURSIVE ... SELECT descendants
    DB-->>Repo: Descendant IDs
    Service->>Service: Check newParentId not in descendants
    Service->>Repo: Update(task)
    Repo->>DB: UPDATE Tasks SET ParentTaskId = ?, ModifiedDate = ?
    DB-->>Repo: Success
    Service-->>API: Updated task
    API-->>TaskService: 200 OK {task}
    TaskService->>Angular: Refresh tree
    Angular->>Angular: Re-render tree with new parent relationship
```

### Activity Log and Collaboration Flow

```mermaid
sequenceDiagram
    actor User1 as User (Sarah)
    actor User2 as User (Marcus)
    participant Angular as Task Detail Panel
    participant CollabService as Collaboration Service
    participant API as API Controller
    participant ActivityService as Activity Log Service
    participant CommentService as Comment Service
    participant DB as PostgreSQL
    
    Note over User1,DB: Status Change Creates Activity Log
    User1->>Angular: Changes task status from "In Progress" to "Done"
    Angular->>API: PUT /api/tasks/{id} {status: 4}
    API->>ActivityService: Auto-triggered by service layer
    ActivityService->>ActivityService: Detect status change (oldValue vs newValue)
    ActivityService->>ActivityService: Format description "Sarah changed status from In Progress to Done"
    ActivityService->>DB: INSERT INTO ActivityLogs (taskId, userId, activityType=2, description, oldValue, newValue, timestamp)
    DB-->>ActivityService: Log created
    ActivityService-->>API: Status updated
    API-->>Angular: 200 OK {task}
    Angular->>Angular: Update task card UI
    
    Note over User1,DB: Comment with Mention
    User1->>Angular: Types comment "@Marcus can you review this?"
    Angular->>Angular: Detect @mention, highlight Marcus
    Angular->>CollabService: createComment(taskId, content, mentionedUserIds: [marcusId])
    CollabService->>API: POST /api/comments {taskId, content, mentionedUserIds}
    API->>CommentService: CreateComment(dto, userId)
    CommentService->>DB: INSERT INTO Comments (taskId, userId, content, mentionedUserIds, createdDate)
    DB-->>CommentService: Comment created
    CommentService->>ActivityService: LogCommentAdded(taskId, userId)
    ActivityService->>DB: INSERT INTO ActivityLogs (activityType=7, description="Sarah added a comment")
    API-->>CollabService: 201 Created {comment}
    CollabService->>Angular: Update comments list
    Angular->>Angular: Display new comment with @Marcus highlighted
    
    Note over User2,DB: Marcus Views Activity Log (Polling)
    User2->>Angular: Opens task detail panel
    Angular->>Angular: Start polling interval (30 seconds)
    Angular->>API: GET /api/tasks/{id}/activities?page=1&pageSize=50
    API->>ActivityService: GetTaskActivities(taskId, page, pageSize)
    ActivityService->>DB: SELECT * FROM ActivityLogs WHERE TaskId = ? ORDER BY Timestamp DESC LIMIT 50
    DB->>DB: JOIN Users to get user names
    DB-->>ActivityService: Activity entries with user data
    ActivityService-->>API: Activity log page
    API-->>Angular: 200 OK {items[], totalCount, page}
    Angular->>Angular: Render activity timeline
    Angular->>User2: Display "Sarah changed status...", "Sarah added a comment"
    
    loop Every 30 seconds
        Angular->>API: GET /api/tasks/{id}/activities (poll for updates)
        API-->>Angular: Activity log (may include new entries)
        Angular->>Angular: Update timeline if new activities detected
    end
    
    User2->>Angular: Navigates away from task
    Angular->>Angular: Stop polling interval (cleanup)
```

### Advanced Filtering and Sorting Flow

```mermaid
sequenceDiagram
    actor User
    participant Angular as Task List Component
    participant TaskService as Task Service
    participant API as Tasks Controller
    participant Service as Task Service (Backend)
    participant Repo as Task Repository
    participant DB as PostgreSQL
    
    User->>Angular: Opens list view
    Angular->>TaskService: getTasks({page: 1, pageSize: 50, sortBy: 'createdDate', sortOrder: 'desc'})
    TaskService->>API: GET /api/tasks?page=1&pageSize=50&sortBy=createdDate&sortOrder=desc
    API->>Service: GetTasks(filters, sorting, pagination, userId)
    Service->>Repo: FindWithFilters(filters, sorting, pagination)
    Repo->>DB: SELECT * FROM Tasks WHERE CreatedByUserId = ? ORDER BY CreatedDate DESC LIMIT 50 OFFSET 0
    DB-->>Repo: Task page 1
    Repo->>Repo: Include assignees, calculate totalCount
    Repo-->>Service: {items, totalCount, page, pageSize, totalPages}
    Service-->>API: Task list response
    API-->>TaskService: 200 OK {items[], totalCount: 234, page: 1, pageSize: 50, totalPages: 5}
    TaskService-->>Angular: Observable emits paginated data
    Angular->>Angular: Render data table with 50 tasks
    Angular->>Angular: Display pagination "Showing 1-50 of 234 tasks"
    
    Note over User,DB: Apply Multiple Filters
    User->>Angular: Selects filters (status: "In Progress", priority: "High", assignee: "Sarah")
    User->>Angular: Clicks "Apply Filters"
    Angular->>TaskService: getTasks({status: [1], priority: [2], assigneeId: sarahId, page: 1, pageSize: 50})
    TaskService->>API: GET /api/tasks?status=1&priority=2&assigneeId={sarahId}&page=1&pageSize=50
    API->>Service: GetTasks(filters, sorting, pagination, userId)
    Service->>Repo: FindWithFilters(filters, sorting, pagination)
    
    Repo->>DB: Complex filtered query
    DB->>DB: SELECT t.* FROM Tasks t<br/>JOIN TaskAssignees ta ON t.Id = ta.TaskId<br/>WHERE t.CreatedByUserId = ?<br/>AND t.Status = 1<br/>AND t.Priority = 2<br/>AND ta.UserId = ?<br/>AND t.IsDeleted = false<br/>ORDER BY t.CreatedDate DESC<br/>LIMIT 50 OFFSET 0
    DB->>DB: Use indexes on Status, Priority, CreatedByUserId
    DB-->>Repo: Filtered results (12 tasks)
    
    Repo-->>Service: {items: 12 tasks, totalCount: 12, page: 1, pageSize: 50, totalPages: 1}
    Service-->>API: Filtered task list
    API-->>TaskService: 200 OK {items[12], totalCount: 12}
    TaskService-->>Angular: Observable emits filtered data
    Angular->>Angular: Display active filter chips "Status: In Progress ×", "Priority: High ×"
    Angular->>Angular: Update task table (12 tasks)
    Angular->>Angular: Show "Showing 12 of 12 tasks"
    
    User->>Angular: Clicks column header "Due Date" to sort
    Angular->>TaskService: getTasks({...existingFilters, sortBy: 'dueDate', sortOrder: 'asc'})
    TaskService->>API: GET /api/tasks?status=1&priority=2&assigneeId={id}&sortBy=dueDate&sortOrder=asc
    API->>Service: GetTasks with new sort
    Service->>Repo: FindWithFilters (ORDER BY DueDate ASC NULLS LAST)
    Repo->>DB: SELECT ... ORDER BY DueDate ASC NULLS LAST
    DB-->>Repo: Re-sorted results
    Repo-->>Service: Tasks sorted by due date
    Service-->>API: Sorted task list
    API-->>TaskService: 200 OK
    TaskService-->>Angular: Re-render table with new sort
    Angular->>Angular: Update sort indicator (up arrow on Due Date column)
```

**Workflow Summary:**

These core workflows demonstrate:
1. **Authentication Flow:** JWT-based auth with bcrypt password hashing (NFR10), refresh token pattern (NFR9)
2. **Task Creation:** Circular reference prevention, validation, multi-user assignment, activity logging
3. **Time Tracking:** Active timer with localStorage persistence, time rollup via recursive CTE (NFR19)
4. **Hierarchy Queries:** PostgreSQL recursive CTEs for efficient tree traversal (NFR19)
5. **Collaboration:** Activity log generation, comment system with mentions, HTTP polling for updates
6. **Advanced Filtering:** Complex multi-criteria queries with proper indexing, pagination (NFR2 <500ms)

All workflows follow the established architectural patterns: three-tier architecture, JWT authentication, EF Core with repositories, HTTP polling for live updates, and recursive CTEs for hierarchical data.


## Database Schema

This section defines the concrete PostgreSQL database schema for TaskFlow, including table definitions with data types, constraints, indexes, and relationships. The schema is designed to support Entity Framework Core code-first migrations while optimizing for query performance per NFR requirements.

**Schema Design Principles:**
- **Normalization:** Third normal form (3NF) to eliminate data duplication and maintain referential integrity
- **Performance:** Strategic indexes on foreign keys, filter columns, and sort columns to meet NFR2 (<500ms list view)
- **Recursive CTEs:** Self-referencing Tasks.ParentTaskId enables unlimited hierarchy with efficient traversal (NFR19)
- **Soft Deletes:** IsDeleted flags preserve historical data for activity logs and reporting while appearing deleted in UI
- **JSONB Fields:** Flexible storage for evolving features (MentionedUserIds, ActivityLog metadata) without schema migrations
- **UUID Primary Keys:** GUIDs prevent ID conflicts in distributed systems and hide sequential patterns
- **Timestamps:** CreatedDate/ModifiedDate on all entities enable audit trails and activity logging (FR22)

### PostgreSQL DDL Schema

```sql
-- ============================================================================
-- TaskFlow Database Schema
-- PostgreSQL 15+
-- Generated for Entity Framework Core 8.0 code-first migrations
-- ============================================================================

-- Enable UUID extension for GUID primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Users Table
-- Stores user accounts with ASP.NET Core Identity integration
-- ============================================================================
CREATE TABLE "Users" (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "Email" VARCHAR(256) NOT NULL,
    "PasswordHash" VARCHAR(256) NOT NULL,  -- bcrypt hash via ASP.NET Core Identity
    "Name" VARCHAR(100) NOT NULL,
    "ProfileImageUrl" VARCHAR(500) NULL,    -- Supabase Storage signed URL
    "CreatedDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ModifiedDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "UQ_Users_Email" UNIQUE ("Email")
);

-- Indexes for Users table
CREATE UNIQUE INDEX "IX_Users_Email" ON "Users" ("Email");
CREATE INDEX "IX_Users_CreatedDate" ON "Users" ("CreatedDate" DESC);

COMMENT ON TABLE "Users" IS 'User accounts with authentication credentials';
COMMENT ON COLUMN "Users"."PasswordHash" IS 'bcrypt hash via ASP.NET Core Identity (NFR10)';

-- ============================================================================
-- Tasks Table
-- Core entity with self-referencing hierarchy for unlimited nesting
-- ============================================================================
CREATE TABLE "Tasks" (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "Name" VARCHAR(200) NOT NULL,
    "Description" TEXT NULL,                         -- Max 5000 chars enforced in application
    "ParentTaskId" UUID NULL,                        -- Self-referencing FK for hierarchy
    "CreatedByUserId" UUID NOT NULL,
    "CreatedDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ModifiedDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "DueDate" TIMESTAMP NULL,
    "Priority" INT NOT NULL DEFAULT 1,               -- 0=Low, 1=Medium, 2=High, 3=Critical
    "Status" INT NOT NULL DEFAULT 0,                 -- 0=ToDo, 1=InProgress, 2=Blocked, 3=Waiting, 4=Done
    "Progress" INT NOT NULL DEFAULT 0,               -- 0-100 percentage
    "Type" INT NOT NULL DEFAULT 2,                   -- 0=Project, 1=Milestone, 2=Task
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "TotalLoggedTime" BIGINT NOT NULL DEFAULT 0,     -- Cached total seconds (includes children rollup)
    
    CONSTRAINT "FK_Tasks_ParentTask" FOREIGN KEY ("ParentTaskId") 
        REFERENCES "Tasks" ("Id") ON DELETE SET NULL,
    CONSTRAINT "FK_Tasks_CreatedByUser" FOREIGN KEY ("CreatedByUserId") 
        REFERENCES "Users" ("Id") ON DELETE CASCADE,
    CONSTRAINT "CK_Tasks_Progress" CHECK ("Progress" >= 0 AND "Progress" <= 100),
    CONSTRAINT "CK_Tasks_Priority" CHECK ("Priority" >= 0 AND "Priority" <= 3),
    CONSTRAINT "CK_Tasks_Status" CHECK ("Status" >= 0 AND "Status" <= 4),
    CONSTRAINT "CK_Tasks_Type" CHECK ("Type" >= 0 AND "Type" <= 2)
);

-- Indexes for Tasks table (optimized for common queries)
CREATE INDEX "IX_Tasks_CreatedByUserId" ON "Tasks" ("CreatedByUserId") WHERE "IsDeleted" = FALSE;
CREATE INDEX "IX_Tasks_ParentTaskId" ON "Tasks" ("ParentTaskId") WHERE "IsDeleted" = FALSE;
CREATE INDEX "IX_Tasks_Status" ON "Tasks" ("Status") WHERE "IsDeleted" = FALSE;
CREATE INDEX "IX_Tasks_Priority" ON "Tasks" ("Priority") WHERE "IsDeleted" = FALSE;
CREATE INDEX "IX_Tasks_DueDate" ON "Tasks" ("DueDate") WHERE "IsDeleted" = FALSE AND "DueDate" IS NOT NULL;
CREATE INDEX "IX_Tasks_CreatedDate" ON "Tasks" ("CreatedDate" DESC) WHERE "IsDeleted" = FALSE;
CREATE INDEX "IX_Tasks_Type" ON "Tasks" ("Type") WHERE "IsDeleted" = FALSE;

-- Composite index for common filter combinations
CREATE INDEX "IX_Tasks_CreatedByUser_Status_Priority" ON "Tasks" ("CreatedByUserId", "Status", "Priority") 
    WHERE "IsDeleted" = FALSE;

-- Full-text search index for Name and Description (FR4)
CREATE INDEX "IX_Tasks_FullTextSearch" ON "Tasks" 
    USING GIN (to_tsvector('english', COALESCE("Name", '') || ' ' || COALESCE("Description", '')));

COMMENT ON TABLE "Tasks" IS 'Core task entity with self-referencing hierarchy for unlimited nesting';
COMMENT ON COLUMN "Tasks"."ParentTaskId" IS 'Self-referencing FK enables recursive hierarchy (NFR19)';
COMMENT ON COLUMN "Tasks"."TotalLoggedTime" IS 'Cached seconds including children rollup for performance';

-- ============================================================================
-- TaskAssignees Table (Join Table)
-- Many-to-many relationship between Tasks and Users for multi-user assignment
-- ============================================================================
CREATE TABLE "TaskAssignees" (
    "TaskId" UUID NOT NULL,
    "UserId" UUID NOT NULL,
    "AssignedDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "AssignedByUserId" UUID NOT NULL,                -- Who made the assignment
    
    CONSTRAINT "PK_TaskAssignees" PRIMARY KEY ("TaskId", "UserId"),
    CONSTRAINT "FK_TaskAssignees_Task" FOREIGN KEY ("TaskId") 
        REFERENCES "Tasks" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_TaskAssignees_User" FOREIGN KEY ("UserId") 
        REFERENCES "Users" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_TaskAssignees_AssignedByUser" FOREIGN KEY ("AssignedByUserId") 
        REFERENCES "Users" ("Id") ON DELETE CASCADE
);

-- Indexes for TaskAssignees table
CREATE INDEX "IX_TaskAssignees_UserId" ON "TaskAssignees" ("UserId");
CREATE INDEX "IX_TaskAssignees_TaskId" ON "TaskAssignees" ("TaskId");
CREATE INDEX "IX_TaskAssignees_AssignedDate" ON "TaskAssignees" ("AssignedDate" DESC);

COMMENT ON TABLE "TaskAssignees" IS 'Join table for multi-user task assignment (FR8)';

-- ============================================================================
-- TimeEntries Table
-- Time tracking with both timer-based and manual entries
-- ============================================================================
CREATE TABLE "TimeEntries" (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "TaskId" UUID NOT NULL,
    "UserId" UUID NOT NULL,
    "StartTime" TIMESTAMP NOT NULL,
    "EndTime" TIMESTAMP NULL,                        -- NULL = active timer still running
    "Duration" BIGINT NOT NULL DEFAULT 0,            -- Calculated seconds (EndTime - StartTime)
    "Notes" VARCHAR(500) NULL,
    "IsManual" BOOLEAN NOT NULL DEFAULT FALSE,       -- TRUE = manual entry, FALSE = timer-tracked
    "CreatedDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ModifiedDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "FK_TimeEntries_Task" FOREIGN KEY ("TaskId") 
        REFERENCES "Tasks" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_TimeEntries_User" FOREIGN KEY ("UserId") 
        REFERENCES "Users" ("Id") ON DELETE CASCADE,
    CONSTRAINT "CK_TimeEntries_Duration" CHECK ("Duration" >= 0),
    CONSTRAINT "CK_TimeEntries_EndTime" CHECK ("EndTime" IS NULL OR "EndTime" >= "StartTime")
);

-- Indexes for TimeEntries table
CREATE INDEX "IX_TimeEntries_TaskId" ON "TimeEntries" ("TaskId");
CREATE INDEX "IX_TimeEntries_UserId" ON "TimeEntries" ("UserId");
CREATE INDEX "IX_TimeEntries_StartTime" ON "TimeEntries" ("StartTime" DESC);

-- Index for active timer queries (EndTime IS NULL)
CREATE INDEX "IX_TimeEntries_ActiveTimer" ON "TimeEntries" ("UserId") WHERE "EndTime" IS NULL;

COMMENT ON TABLE "TimeEntries" IS 'Time tracking entries for tasks with timer and manual logging (FR10-13)';
COMMENT ON COLUMN "TimeEntries"."EndTime" IS 'NULL indicates active timer still running (FR10)';
COMMENT ON COLUMN "TimeEntries"."Duration" IS 'Cached calculation for performance (EndTime - StartTime in seconds)';

-- ============================================================================
-- Comments Table
-- Task discussion threads with user mentions
-- ============================================================================
CREATE TABLE "Comments" (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "TaskId" UUID NOT NULL,
    "UserId" UUID NOT NULL,
    "ParentCommentId" UUID NULL,                     -- For threaded replies (post-MVP)
    "Content" TEXT NOT NULL,                         -- Max 2000 chars enforced in application
    "CreatedDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ModifiedDate" TIMESTAMP NULL,                   -- NULL = never edited
    "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE,      -- Soft delete preserves thread context
    "MentionedUserIds" JSONB NULL,                   -- Array of UUIDs for @mentions
    
    CONSTRAINT "FK_Comments_Task" FOREIGN KEY ("TaskId") 
        REFERENCES "Tasks" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Comments_User" FOREIGN KEY ("UserId") 
        REFERENCES "Users" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Comments_ParentComment" FOREIGN KEY ("ParentCommentId") 
        REFERENCES "Comments" ("Id") ON DELETE CASCADE
);

-- Indexes for Comments table
CREATE INDEX "IX_Comments_TaskId" ON "Comments" ("TaskId") WHERE "IsDeleted" = FALSE;
CREATE INDEX "IX_Comments_UserId" ON "Comments" ("UserId");
CREATE INDEX "IX_Comments_CreatedDate" ON "Comments" ("CreatedDate" DESC) WHERE "IsDeleted" = FALSE;
CREATE INDEX "IX_Comments_ParentCommentId" ON "Comments" ("ParentCommentId") WHERE "ParentCommentId" IS NOT NULL;

-- GIN index for JSONB mentioned users (for future notifications)
CREATE INDEX "IX_Comments_MentionedUserIds" ON "Comments" USING GIN ("MentionedUserIds");

COMMENT ON TABLE "Comments" IS 'Task comment threads with mentions and replies (FR21, FR23)';
COMMENT ON COLUMN "Comments"."MentionedUserIds" IS 'JSONB array of user UUIDs for @mentions';
COMMENT ON COLUMN "Comments"."ModifiedDate" IS 'NULL = never edited, set on edit for "edited" badge';

-- ============================================================================
-- ActivityLogs Table
-- Audit trail of all task changes for activity feed
-- ============================================================================
CREATE TABLE "ActivityLogs" (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "TaskId" UUID NOT NULL,
    "UserId" UUID NOT NULL,
    "ActivityType" INT NOT NULL,                     -- 0=TaskCreated, 1=TaskUpdated, 2=StatusChanged, etc.
    "Timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Description" VARCHAR(500) NOT NULL,             -- Pre-formatted human-readable description
    "OldValue" JSONB NULL,                           -- Previous state as JSON
    "NewValue" JSONB NULL,                           -- New state as JSON
    "Metadata" JSONB NULL,                           -- Additional context (assignee names, durations, etc.)
    
    CONSTRAINT "FK_ActivityLogs_Task" FOREIGN KEY ("TaskId") 
        REFERENCES "Tasks" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_ActivityLogs_User" FOREIGN KEY ("UserId") 
        REFERENCES "Users" ("Id") ON DELETE CASCADE,
    CONSTRAINT "CK_ActivityLogs_ActivityType" CHECK ("ActivityType" >= 0 AND "ActivityType" <= 11)
);

-- Indexes for ActivityLogs table (optimized for chronological queries)
CREATE INDEX "IX_ActivityLogs_TaskId_Timestamp" ON "ActivityLogs" ("TaskId", "Timestamp" DESC);
CREATE INDEX "IX_ActivityLogs_UserId" ON "ActivityLogs" ("UserId");
CREATE INDEX "IX_ActivityLogs_Timestamp" ON "ActivityLogs" ("Timestamp" DESC);
CREATE INDEX "IX_ActivityLogs_ActivityType" ON "ActivityLogs" ("ActivityType");

-- GIN indexes for JSONB columns (for future advanced filtering)
CREATE INDEX "IX_ActivityLogs_OldValue" ON "ActivityLogs" USING GIN ("OldValue");
CREATE INDEX "IX_ActivityLogs_NewValue" ON "ActivityLogs" USING GIN ("NewValue");
CREATE INDEX "IX_ActivityLogs_Metadata" ON "ActivityLogs" USING GIN ("Metadata");

COMMENT ON TABLE "ActivityLogs" IS 'Audit trail of task changes for activity feed (FR22)';
COMMENT ON COLUMN "ActivityLogs"."Description" IS 'Pre-formatted description like "Sarah changed status from In Progress to Done"';
COMMENT ON COLUMN "ActivityLogs"."OldValue" IS 'Previous state as JSON for diff views';
COMMENT ON COLUMN "ActivityLogs"."NewValue" IS 'New state as JSON for diff views';

-- ============================================================================
-- RefreshTokens Table (ASP.NET Core Identity Extension)
-- Stores refresh tokens for JWT token refresh pattern (NFR9)
-- ============================================================================
CREATE TABLE "RefreshTokens" (
    "Id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID NOT NULL,
    "Token" VARCHAR(256) NOT NULL,
    "ExpiresAt" TIMESTAMP NOT NULL,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "RevokedAt" TIMESTAMP NULL,                      -- NULL = active, set on logout/revoke
    
    CONSTRAINT "FK_RefreshTokens_User" FOREIGN KEY ("UserId") 
        REFERENCES "Users" ("Id") ON DELETE CASCADE,
    CONSTRAINT "UQ_RefreshTokens_Token" UNIQUE ("Token")
);

-- Indexes for RefreshTokens table
CREATE UNIQUE INDEX "IX_RefreshTokens_Token" ON "RefreshTokens" ("Token");
CREATE INDEX "IX_RefreshTokens_UserId" ON "RefreshTokens" ("UserId");
CREATE INDEX "IX_RefreshTokens_ExpiresAt" ON "RefreshTokens" ("ExpiresAt") WHERE "RevokedAt" IS NULL;

COMMENT ON TABLE "RefreshTokens" IS 'Refresh tokens for JWT token refresh pattern (NFR9)';
COMMENT ON COLUMN "RefreshTokens"."RevokedAt" IS 'NULL = active token, set on logout or security revocation';

-- ============================================================================
-- Helper Functions and Views
-- ============================================================================

-- Function to get task hierarchy depth (for validation)
CREATE OR REPLACE FUNCTION get_task_depth(task_id UUID) 
RETURNS INT AS $$
DECLARE
    depth INT := 0;
BEGIN
    WITH RECURSIVE task_ancestors AS (
        SELECT "Id", "ParentTaskId", 0 AS level
        FROM "Tasks"
        WHERE "Id" = task_id
        
        UNION ALL
        
        SELECT t."Id", t."ParentTaskId", ta.level + 1
        FROM "Tasks" t
        INNER JOIN task_ancestors ta ON t."Id" = ta."ParentTaskId"
        WHERE ta.level < 15  -- Max depth limit (NFR15)
    )
    SELECT MAX(level) INTO depth FROM task_ancestors;
    
    RETURN COALESCE(depth, 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_task_depth IS 'Calculate task hierarchy depth for validation (NFR15: max 10 levels)';

-- Function to calculate total logged time with rollup (recursive aggregation)
CREATE OR REPLACE FUNCTION calculate_total_logged_time(task_id UUID) 
RETURNS BIGINT AS $$
DECLARE
    total_seconds BIGINT := 0;
BEGIN
    WITH RECURSIVE task_tree AS (
        -- Anchor: selected task
        SELECT "Id"
        FROM "Tasks"
        WHERE "Id" = task_id
        
        UNION ALL
        
        -- Recursive: all descendants
        SELECT t."Id"
        FROM "Tasks" t
        INNER JOIN task_tree tt ON t."ParentTaskId" = tt."Id"
        WHERE t."IsDeleted" = FALSE
    )
    SELECT COALESCE(SUM(te."Duration"), 0) INTO total_seconds
    FROM "TimeEntries" te
    INNER JOIN task_tree tt ON te."TaskId" = tt."Id"
    WHERE te."EndTime" IS NOT NULL;  -- Exclude active timers
    
    RETURN total_seconds;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_total_logged_time IS 'Calculate total logged time including all descendants (FR13)';

-- View for task hierarchy with depth and path
CREATE OR REPLACE VIEW "TaskHierarchy" AS
WITH RECURSIVE task_tree AS (
    SELECT 
        "Id",
        "Name",
        "ParentTaskId",
        "CreatedByUserId",
        "Status",
        "Priority",
        "Type",
        "TotalLoggedTime",
        0 AS "Depth",
        ARRAY["Id"] AS "Path",
        "Name" AS "FullPath"
    FROM "Tasks"
    WHERE "ParentTaskId" IS NULL AND "IsDeleted" = FALSE
    
    UNION ALL
    
    SELECT 
        t."Id",
        t."Name",
        t."ParentTaskId",
        t."CreatedByUserId",
        t."Status",
        t."Priority",
        t."Type",
        t."TotalLoggedTime",
        tt."Depth" + 1,
        tt."Path" || t."Id",
        tt."FullPath" || ' > ' || t."Name"
    FROM "Tasks" t
    INNER JOIN task_tree tt ON t."ParentTaskId" = tt."Id"
    WHERE t."IsDeleted" = FALSE AND tt."Depth" < 15
)
SELECT * FROM task_tree;

COMMENT ON VIEW "TaskHierarchy" IS 'Recursive view showing task hierarchy with depth and full path';
```

### Entity Framework Core Configuration

The above SQL DDL schema maps to EF Core entity configurations using Fluent API in `ApplicationDbContext.OnModelCreating()`.

**Sample EF Core Configuration:**

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    // Task entity with self-referencing hierarchy
    modelBuilder.Entity<Task>(entity =>
    {
        entity.ToTable("Tasks");
        entity.HasKey(e => e.Id);
        
        // Self-referencing hierarchy
        entity.HasOne(e => e.Parent)
              .WithMany(e => e.Children)
              .HasForeignKey(e => e.ParentTaskId)
              .OnDelete(DeleteBehavior.SetNull);
        
        // Indexes
        entity.HasIndex(e => e.CreatedByUserId);
        entity.HasIndex(e => e.Status);
        entity.HasIndex(e => new { e.CreatedByUserId, e.Status, e.Priority });
        
        // Global query filter for soft delete
        entity.HasQueryFilter(e => !e.IsDeleted);
    });
    
    // TaskAssignee many-to-many configuration
    modelBuilder.Entity<TaskAssignee>(entity =>
    {
        entity.ToTable("TaskAssignees");
        entity.HasKey(e => new { e.TaskId, e.UserId });
    });
}
```

### Schema Evolution Strategy

**Migration Workflow:**
1. **Create Migration:** `dotnet ef migrations add InitialCreate`
2. **Review SQL:** Check generated SQL in `Migrations/` folder
3. **Apply to Dev:** `dotnet ef database update`
4. **Apply to Production:** Run migrations on Supabase via CI/CD

**Performance Monitoring:**
- Monitor slow queries via `pg_stat_statements`
- Add indexes based on production query patterns
- Expected performance: Task list <500ms (NFR2), hierarchy queries <1s (NFR19)


## Frontend Architecture

This section defines the Angular 20 frontend architecture, including component organization, state management, routing structure, and API service layer. The frontend follows **Angular standalone component architecture** with reactive state management via RxJS, providing a modern, performant SPA experience.

**Frontend Architecture Principles:**
- **Standalone Components:** Angular 20 standalone components eliminate NgModules, simplify dependency injection, and enable better tree-shaking
- **Smart/Dumb Pattern:** Container components handle business logic and API calls, presentational components render UI based on inputs
- **Reactive Programming:** RxJS Observables for async operations, event handling, and state management
- **Type Safety:** TypeScript interfaces generated from C# DTOs ensure frontend-backend contract alignment
- **Performance First:** Lazy loading, OnPush change detection, virtual scrolling for large lists
- **Accessibility:** WCAG AA compliance with keyboard navigation, ARIA labels, screen reader support (NFR requirements)

### Component Organization

```
frontend/
├── src/
│   ├── app/
│   │   ├── app.ts                        # Root AppComponent (standalone)
│   │   ├── app.config.ts                 # Application configuration
│   │   ├── app.routes.ts                 # Route definitions
│   │   │
│   │   ├── core/                         # Singleton services & guards
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts       # Authentication state & JWT management
│   │   │   │   ├── error-handler.service.ts
│   │   │   │   └── storage.service.ts    # localStorage abstraction
│   │   │   ├── interceptors/
│   │   │   │   ├── auth.interceptor.ts   # Add JWT to requests
│   │   │   │   └── error.interceptor.ts  # Global error handling
│   │   │   └── guards/
│   │   │       └── auth.guard.ts         # Route protection
│   │   │
│   │   ├── shared/                       # Reusable components & utilities
│   │   │   ├── components/
│   │   │   │   ├── loading-spinner/
│   │   │   │   │   ├── loading-spinner.component.ts
│   │   │   │   │   ├── loading-spinner.component.html
│   │   │   │   │   └── loading-spinner.component.scss
│   │   │   │   ├── confirmation-dialog/
│   │   │   │   │   ├── confirmation-dialog.component.ts
│   │   │   │   │   ├── confirmation-dialog.component.html
│   │   │   │   │   └── confirmation-dialog.component.scss
│   │   │   │   ├── error-message/
│   │   │   │   │   ├── error-message.component.ts
│   │   │   │   │   ├── error-message.component.html
│   │   │   │   │   └── error-message.component.scss
│   │   │   │   └── empty-state/
│   │   │   │       ├── empty-state.component.ts
│   │   │   │       ├── empty-state.component.html
│   │   │   │       └── empty-state.component.scss
│   │   │   ├── pipes/
│   │   │   │   ├── duration.pipe.ts      # Format seconds to "2h 30m"
│   │   │   │   ├── relative-time.pipe.ts # "2 hours ago"
│   │   │   │   └── safe-html.pipe.ts     # Sanitize HTML for markdown
│   │   │   ├── directives/
│   │   │   │   └── auto-focus.directive.ts
│   │   │   ├── models/                   # TypeScript interfaces (generated from C#)
│   │   │   │   ├── user.model.ts
│   │   │   │   ├── task.model.ts
│   │   │   │   ├── time-entry.model.ts
│   │   │   │   ├── comment.model.ts
│   │   │   │   └── activity-log.model.ts
│   │   │   └── utils/
│   │   │       ├── date.utils.ts
│   │   │       └── validation.utils.ts
│   │   │
│   │   ├── features/                     # Feature modules (lazy loaded)
│   │   │   │
│   │   │   ├── auth/                     # Authentication feature
│   │   │   │   ├── login/
│   │   │   │   │   ├── login.component.ts
│   │   │   │   │   ├── login.component.html
│   │   │   │   │   └── login.component.scss
│   │   │   │   ├── register/
│   │   │   │   │   ├── register.component.ts
│   │   │   │   │   ├── register.component.html
│   │   │   │   │   └── register.component.scss
│   │   │   │   └── auth.routes.ts
│   │   │   │
│   │   │   ├── dashboard/                # Main dashboard
│   │   │   │   ├── dashboard.component.ts
│   │   │   │   ├── dashboard.component.html
│   │   │   │   ├── dashboard.component.scss
│   │   │   │   └── dashboard.routes.ts
│   │   │   │
│   │   │   ├── tasks/                    # Task management feature
│   │   │   │   ├── services/
│   │   │   │   │   └── task.service.ts   # Task API operations
│   │   │   │   ├── task-list/
│   │   │   │   │   ├── task-list.component.ts
│   │   │   │   │   ├── task-list.component.html
│   │   │   │   │   ├── task-list.component.scss
│   │   │   │   │   └── components/
│   │   │   │   │       ├── task-table/
│   │   │   │   │       │   ├── task-table.component.ts
│   │   │   │   │       │   ├── task-table.component.html
│   │   │   │   │       │   └── task-table.component.scss
│   │   │   │   │       ├── task-filters/
│   │   │   │   │       │   ├── task-filters.component.ts
│   │   │   │   │       │   ├── task-filters.component.html
│   │   │   │   │       │   └── task-filters.component.scss
│   │   │   │   │       └── task-card/
│   │   │   │   │           ├── task-card.component.ts
│   │   │   │   │           ├── task-card.component.html
│   │   │   │   │           └── task-card.component.scss
│   │   │   │   ├── task-tree/
│   │   │   │   │   ├── task-tree.component.ts
│   │   │   │   │   ├── task-tree.component.html
│   │   │   │   │   ├── task-tree.component.scss
│   │   │   │   │   └── components/
│   │   │   │   │       └── tree-node/
│   │   │   │   │           ├── tree-node.component.ts
│   │   │   │   │           ├── tree-node.component.html
│   │   │   │   │           └── tree-node.component.scss
│   │   │   │   ├── task-gantt/
│   │   │   │   │   ├── task-gantt.component.ts
│   │   │   │   │   ├── task-gantt.component.html
│   │   │   │   │   └── task-gantt.component.scss
│   │   │   │   ├── task-detail/
│   │   │   │   │   ├── task-detail.component.ts
│   │   │   │   │   ├── task-detail.component.html
│   │   │   │   │   ├── task-detail.component.scss
│   │   │   │   │   └── components/
│   │   │   │   │       ├── task-info-panel/
│   │   │   │   │       │   ├── task-info-panel.component.ts
│   │   │   │   │       │   ├── task-info-panel.component.html
│   │   │   │   │       │   └── task-info-panel.component.scss
│   │   │   │   │       ├── task-actions/
│   │   │   │   │       │   ├── task-actions.component.ts
│   │   │   │   │       │   ├── task-actions.component.html
│   │   │   │   │       │   └── task-actions.component.scss
│   │   │   │   │       └── task-metadata/
│   │   │   │   │           ├── task-metadata.component.ts
│   │   │   │   │           ├── task-metadata.component.html
│   │   │   │   │           └── task-metadata.component.scss
│   │   │   │   ├── task-form/
│   │   │   │   │   ├── task-form.component.ts
│   │   │   │   │   ├── task-form.component.html
│   │   │   │   │   └── task-form.component.scss
│   │   │   │   └── tasks.routes.ts
│   │   │   │
│   │   │   ├── time-tracking/            # Time tracking feature
│   │   │   │   ├── services/
│   │   │   │   │   └── time-tracking.service.ts
│   │   │   │   ├── timer-widget/
│   │   │   │   │   ├── timer-widget.component.ts
│   │   │   │   │   ├── timer-widget.component.html
│   │   │   │   │   └── timer-widget.component.scss
│   │   │   │   ├── manual-entry/
│   │   │   │   │   ├── manual-entry.component.ts
│   │   │   │   │   ├── manual-entry.component.html
│   │   │   │   │   └── manual-entry.component.scss
│   │   │   │   ├── time-log/
│   │   │   │   │   ├── time-log.component.ts
│   │   │   │   │   ├── time-log.component.html
│   │   │   │   │   ├── time-log.component.scss
│   │   │   │   │   └── components/
│   │   │   │   │       └── time-entry-item/
│   │   │   │   │           ├── time-entry-item.component.ts
│   │   │   │   │           ├── time-entry-item.component.html
│   │   │   │   │           └── time-entry-item.component.scss
│   │   │   │   └── time-tracking.routes.ts
│   │   │   │
│   │   │   ├── collaboration/            # Comments & assignments
│   │   │   │   ├── services/
│   │   │   │   │   ├── comment.service.ts
│   │   │   │   │   └── assignment.service.ts
│   │   │   │   ├── comment-thread/
│   │   │   │   │   ├── comment-thread.component.ts
│   │   │   │   │   ├── comment-thread.component.html
│   │   │   │   │   ├── comment-thread.component.scss
│   │   │   │   │   └── components/
│   │   │   │   │       ├── comment-item/
│   │   │   │   │       │   ├── comment-item.component.ts
│   │   │   │   │       │   ├── comment-item.component.html
│   │   │   │   │       │   └── comment-item.component.scss
│   │   │   │   │       └── comment-form/
│   │   │   │   │           ├── comment-form.component.ts
│   │   │   │   │           ├── comment-form.component.html
│   │   │   │   │           └── comment-form.component.scss
│   │   │   │   ├── assignment-picker/
│   │   │   │   │   ├── assignment-picker.component.ts
│   │   │   │   │   ├── assignment-picker.component.html
│   │   │   │   │   └── assignment-picker.component.scss
│   │   │   │   ├── activity-log/
│   │   │   │   │   ├── activity-log.component.ts
│   │   │   │   │   ├── activity-log.component.html
│   │   │   │   │   ├── activity-log.component.scss
│   │   │   │   │   └── components/
│   │   │   │   │       └── activity-item/
│   │   │   │   │           ├── activity-item.component.ts
│   │   │   │   │           ├── activity-item.component.html
│   │   │   │   │           └── activity-item.component.scss
│   │   │   │   └── collaboration.routes.ts
│   │   │   │
│   │   │   └── user-profile/             # User settings
│   │   │       ├── user-profile.component.ts
│   │   │       ├── user-profile.component.html
│   │   │       ├── user-profile.component.scss
│   │   │       └── user-profile.routes.ts
│   │   │
│   │   └── layout/                       # App shell layout
│   │       ├── main-layout/
│   │       │   ├── main-layout.component.ts
│   │       │   ├── main-layout.component.html
│   │       │   └── main-layout.component.scss
│   │       ├── navigation/
│   │       │   ├── navigation.component.ts
│   │       │   ├── navigation.component.html
│   │       │   └── navigation.component.scss
│   │       └── sidebar/
│   │           ├── sidebar.component.ts
│   │           ├── sidebar.component.html
│   │           └── sidebar.component.scss
│   │
│   ├── assets/                           # Static assets
│   ├── environments/                     # Environment configs
│   │   ├── environment.ts                # Development
│   │   └── environment.prod.ts           # Production
│   ├── index.html
│   ├── main.ts                           # Application bootstrap
│   └── styles.css                        # Global styles
│
├── angular.json
├── package.json
├── tsconfig.json
└── README.md
```

### Component Architecture Patterns

#### Container/Presentational Pattern Example

**Container Component (Smart):**
```typescript
// task-list.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../services/task.service';
import { Task, TaskFilters } from '../../../shared/models/task.model';
import { TaskTableComponent } from './components/task-table/task-table.component';
import { TaskFiltersComponent } from './components/task-filters/task-filters.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, TaskTableComponent, TaskFiltersComponent],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent implements OnInit {
  private taskService = inject(TaskService);
  
  tasks$!: Observable<Task[]>;
  loading = false;
  filters: TaskFilters = {};
  totalCount = 0;
  page = 1;
  pageSize = 50;
  
  ngOnInit() {
    this.loadTasks();
  }
  
  loadTasks() {
    this.loading = true;
    this.tasks$ = this.taskService.getTasks({
      ...this.filters,
      page: this.page,
      pageSize: this.pageSize
    });
  }
  
  onFiltersChange(filters: TaskFilters) {
    this.filters = filters;
    this.page = 1; // Reset to first page
    this.loadTasks();
  }
  
  onSearch(searchTerm: string) {
    this.filters = { ...this.filters, search: searchTerm };
    this.loadTasks();
  }
  
  onSortChange(sort: { column: string, direction: 'asc' | 'desc' }) {
    this.filters = { ...this.filters, sortBy: sort.column, sortOrder: sort.direction };
    this.loadTasks();
  }
  
  onPageChange(page: number) {
    this.page = page;
    this.loadTasks();
  }
  
  onTaskEdit(task: Task) {
    // Navigate to edit or open modal
  }
  
  onTaskDelete(taskId: string) {
    this.taskService.deleteTask(taskId).subscribe(() => {
      this.loadTasks();
    });
  }
  
  onTimerStart(taskId: string) {
    // Start timer logic
  }
}
```

**Presentational Component (Dumb):**
```typescript
// task-table.component.ts
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { Task } from '../../../../../shared/models/task.model';

@Component({
  selector: 'app-task-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatSortModule],
  templateUrl: './task-table.component.html',
  styleUrls: ['./task-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskTableComponent {
  @Input() tasks: Task[] | null = [];
  @Input() loading = false;
  @Input() totalCount = 0;
  @Input() page = 1;
  @Input() pageSize = 50;
  
  @Output() sortChange = new EventEmitter<{ column: string, direction: 'asc' | 'desc' }>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() taskEdit = new EventEmitter<Task>();
  @Output() taskDelete = new EventEmitter<string>();
  @Output() timerStart = new EventEmitter<string>();
  
  displayedColumns = ['name', 'status', 'priority', 'dueDate', 'assignees', 'loggedTime', 'actions'];
  
  onSortChange(sort: any) {
    this.sortChange.emit({ column: sort.active, direction: sort.direction });
  }
  
  onPageChange(event: any) {
    this.pageChange.emit(event.pageIndex + 1);
  }
}
```

### State Management Architecture

TaskFlow uses **RxJS with Service-based state management** (no NgRx) for simplicity:

**State Service Pattern:**
```typescript
// task-state.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Task } from '../../shared/models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskStateService {
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private selectedTaskSubject = new BehaviorSubject<Task | null>(null);
  
  // Public observables
  tasks$ = this.tasksSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();
  selectedTask$ = this.selectedTaskSubject.asObservable();
  
  setTasks(tasks: Task[]) {
    this.tasksSubject.next(tasks);
  }
  
  addTask(task: Task) {
    const current = this.tasksSubject.value;
    this.tasksSubject.next([...current, task]);
  }
  
  updateTask(updatedTask: Task) {
    const current = this.tasksSubject.value;
    const updated = current.map(t => t.id === updatedTask.id ? updatedTask : t);
    this.tasksSubject.next(updated);
  }
  
  deleteTask(taskId: string) {
    const current = this.tasksSubject.value;
    this.tasksSubject.next(current.filter(t => t.id !== taskId));
  }
  
  selectTask(task: Task | null) {
    this.selectedTaskSubject.next(task);
  }
  
  setLoading(loading: boolean) {
    this.loadingSubject.next(loading);
  }
}
```

### Routing Architecture

**Route Configuration:**
```typescript
// app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
  },
  {
    path: 'tasks',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/tasks/tasks.routes').then(m => m.TASK_ROUTES)
  },
  {
    path: 'profile',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/user-profile/user-profile.routes').then(m => m.PROFILE_ROUTES)
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
```

**AuthGuard Implementation:**
```typescript
// auth.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const AuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.isAuthenticated()) {
    return true;
  }
  
  // Store attempted URL for redirect after login
  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url }
  });
};
```

### API Service Layer

**Base HTTP Service:**
```typescript
// task.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Task, TaskCreateDto, TaskUpdateDto, TaskListResponse } from '../../shared/models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/tasks`;
  
  getTasks(filters?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: number[];
    priority?: number[];
    assigneeId?: string;
    dueDateFrom?: Date;
    dueDateTo?: Date;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Observable<TaskListResponse> {
    let params = new HttpParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params = params.append(key, v.toString()));
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }
    
    return this.http.get<TaskListResponse>(this.apiUrl, { params });
  }
  
  getTaskById(id: string): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/${id}`);
  }
  
  createTask(dto: TaskCreateDto): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, dto);
  }
  
  updateTask(id: string, dto: TaskUpdateDto): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/${id}`, dto);
  }
  
  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
  
  getTaskChildren(id: string): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/${id}/children`);
  }
  
  getTaskDescendants(id: string, maxDepth = 10): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/${id}/descendants`, {
      params: { maxDepth: maxDepth.toString() }
    });
  }
  
  assignUsers(taskId: string, userIds: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/${taskId}/assignments`, { userIds });
  }
  
  unassignUser(taskId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${taskId}/assignments/${userId}`);
  }
}
```

**Authentication Service:**
```typescript
// auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../../shared/models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  
  currentUser$ = this.currentUserSubject.asObservable();
  
  constructor() {
    // Initialize user from stored token
    const user = this.getUserFromStorage();
    if (user) {
      this.currentUserSubject.next(user);
    }
  }
  
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/api/auth/login`, credentials)
      .pipe(
        tap(response => this.handleAuthResponse(response))
      );
  }
  
  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/api/auth/register`, userData)
      .pipe(
        tap(response => this.handleAuthResponse(response))
      );
  }
  
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }
  
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.http.post<AuthResponse>(`${environment.apiUrl}/api/auth/refresh`, { refreshToken })
      .pipe(
        tap(response => this.handleAuthResponse(response))
      );
  }
  
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    // Check token expiration
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }
  
  getToken(): string | null {
    return localStorage.getItem('token');
  }
  
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
  
  private handleAuthResponse(response: AuthResponse) {
    localStorage.setItem('token', response.token);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));
    this.currentUserSubject.next(response.user);
  }
  
  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  }
}
```

**HTTP Interceptor for JWT:**
```typescript
// auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  
  if (token && !req.url.includes('/auth/')) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }
  
  return next(req);
};
```

### Performance Optimizations

**Lazy Loading Strategy:**
- Feature modules loaded on-demand via route configuration
- Reduces initial bundle size from ~2MB to ~500KB

**Change Detection Strategy:**
- OnPush strategy for presentational components
- Reduces change detection cycles by 70%

**Virtual Scrolling:**
```typescript
// For large task lists (500+ items)
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  template: `
    <cdk-virtual-scroll-viewport itemSize="50" class="task-list-viewport">
      <div *cdkVirtualFor="let task of tasks" class="task-item">
        {{ task.name }}
      </div>
    </cdk-virtual-scroll-viewport>
  `
})
```

**Image Optimization:**
- Profile images lazy loaded with placeholder
- Supabase Storage image transformations for responsive sizes

### Accessibility Implementation

**Keyboard Navigation:**
- All interactive elements accessible via Tab key
- Escape key closes modals/panels
- Enter key submits forms
- Arrow keys navigate lists

**ARIA Labels:**
```html
<button 
  aria-label="Start timer for task: {{ task.name }}"
  [attr.aria-pressed]="timerActive"
  (click)="startTimer()">
  <mat-icon>play_arrow</mat-icon>
</button>
```

**Screen Reader Support:**
- Semantic HTML5 elements (<main>, <nav>, <article>)
- Role attributes for custom components
- Live regions for dynamic content updates

**Color Contrast:**
- All text meets WCAG AA 4.5:1 ratio
- Status indicators use both color and icons


---

## 11. Backend Architecture

### Overview

The backend API is built with **ASP.NET Core 8.0 LTS** following Clean Architecture principles. The application is organized into distinct layers with clear separation of concerns, supporting the RESTful API endpoints defined in the OpenAPI specification.

**Architecture Style:**
- Three-tier architecture (Presentation, Business Logic, Data Access)
- Repository Pattern with Unit of Work for data access
- Dependency Injection for loose coupling
- Middleware pipeline for cross-cutting concerns
- JWT-based authentication with ASP.NET Core Identity

**Deployment:**
- Hosted on Fly.io as Docker container
- PostgreSQL database on Supabase
- RESTful API with JSON responses
- Swagger/OpenAPI documentation at `/swagger`

### Project Structure

```
backend/
├── TaskFlow.Api/                    # ASP.NET Core Web API project
│   ├── Controllers/                 # API controllers
│   │   ├── AuthController.cs        # POST /api/auth/register, /login
│   │   ├── TasksController.cs       # CRUD operations for tasks
│   │   ├── TimeTrackingController.cs # Time entry management
│   │   ├── CommentsController.cs    # Task comments
│   │   └── UsersController.cs       # User management
│   ├── Middleware/
│   │   ├── ErrorHandlingMiddleware.cs # Global exception handling
│   │   ├── RequestLoggingMiddleware.cs # Request/response logging
│   │   └── CorrelationIdMiddleware.cs # Trace ID for requests
│   ├── Filters/
│   │   ├── ValidateModelAttribute.cs # Model validation filter
│   │   └── ApiKeyAuthFilter.cs      # Future API key support
│   ├── Extensions/
│   │   ├── ServiceCollectionExtensions.cs # DI registration
│   │   └── ApplicationBuilderExtensions.cs # Middleware setup
│   ├── Program.cs                   # Application entry point
│   ├── appsettings.json             # Configuration
│   └── appsettings.Development.json
│
├── TaskFlow.Core/                   # Business logic layer
│   ├── Entities/                    # Domain entities (POCOs)
│   │   ├── User.cs
│   │   ├── Task.cs
│   │   ├── TimeEntry.cs
│   │   ├── Comment.cs
│   │   ├── TaskAssignee.cs
│   │   └── ActivityLog.cs
│   ├── Interfaces/                  # Abstractions
│   │   ├── Repositories/
│   │   │   ├── ITaskRepository.cs
│   │   │   ├── IUserRepository.cs
│   │   │   ├── ITimeEntryRepository.cs
│   │   │   └── ICommentRepository.cs
│   │   ├── Services/
│   │   │   ├── IAuthService.cs
│   │   │   ├── ITaskService.cs
│   │   │   ├── ITimeTrackingService.cs
│   │   │   └── IActivityLogService.cs
│   │   └── IUnitOfWork.cs           # Unit of Work pattern
│   ├── Services/                    # Business logic services
│   │   ├── AuthService.cs
│   │   ├── TaskService.cs
│   │   ├── TimeTrackingService.cs
│   │   └── ActivityLogService.cs
│   ├── DTOs/                        # Data Transfer Objects
│   │   ├── Auth/
│   │   │   ├── RegisterDto.cs
│   │   │   ├── LoginDto.cs
│   │   │   └── AuthResponseDto.cs
│   │   ├── Tasks/
│   │   │   ├── TaskCreateDto.cs
│   │   │   ├── TaskUpdateDto.cs
│   │   │   ├── TaskResponseDto.cs
│   │   │   └── TaskFilterDto.cs
│   │   ├── TimeEntries/
│   │   │   ├── TimeEntryCreateDto.cs
│   │   │   └── TimeEntryResponseDto.cs
│   │   └── Shared/
│   │       ├── PaginationDto.cs
│   │       └── ErrorResponseDto.cs
│   ├── Exceptions/                  # Custom exceptions
│   │   ├── NotFoundException.cs
│   │   ├── ValidationException.cs
│   │   └── UnauthorizedException.cs
│   └── Constants/
│       ├── TaskStatus.cs            # Enum for task statuses
│       ├── TaskPriority.cs
│       └── ActivityType.cs
│
├── TaskFlow.Infrastructure/         # Data access layer
│   ├── Data/
│   │   ├── ApplicationDbContext.cs  # EF Core DbContext
│   │   └── Migrations/              # EF Core migrations
│   ├── Repositories/                # Repository implementations
│   │   ├── TaskRepository.cs
│   │   ├── UserRepository.cs
│   │   ├── TimeEntryRepository.cs
│   │   ├── CommentRepository.cs
│   │   └── UnitOfWork.cs
│   ├── Configurations/              # EF Core entity configurations
│   │   ├── UserConfiguration.cs
│   │   ├── TaskConfiguration.cs
│   │   ├── TimeEntryConfiguration.cs
│   │   └── CommentConfiguration.cs
│   └── Services/
│       ├── JwtTokenService.cs       # JWT token generation
│       └── PasswordHasher.cs        # Bcrypt password hashing
│
└── TaskFlow.Tests/                  # Unit and integration tests
    ├── Unit/
    │   ├── Services/
    │   └── Repositories/
    └── Integration/
        └── Controllers/
```

### Controller Organization

Controllers are thin orchestrators that delegate to service layer. All controllers inherit from `ControllerBase` and use attribute routing.

**TasksController.cs Example:**

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using TaskFlow.Core.Interfaces.Services;
using TaskFlow.Core.DTOs.Tasks;
using System.Security.Claims;

namespace TaskFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;
    private readonly ILogger<TasksController> _logger;

    public TasksController(
        ITaskService taskService,
        ILogger<TasksController> logger)
    {
        _taskService = taskService;
        _logger = logger;
    }

    private Guid GetUserId() => 
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // GET: api/tasks?status=InProgress&priority=High&page=1&pageSize=25
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PagedResponseDto<TaskResponseDto>>> GetTasks(
        [FromQuery] TaskFilterDto filter,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        _logger.LogInformation("User {UserId} fetching tasks with filters", userId);
        
        var result = await _taskService.GetTasksAsync(userId, filter, cancellationToken);
        return Ok(result);
    }

    // GET: api/tasks/{id}
    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TaskResponseDto>> GetTask(
        Guid id,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var task = await _taskService.GetTaskByIdAsync(userId, id, cancellationToken);
        return Ok(task);
    }

    // POST: api/tasks
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<TaskResponseDto>> CreateTask(
        [FromBody] TaskCreateDto dto,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var task = await _taskService.CreateTaskAsync(userId, dto, cancellationToken);
        return CreatedAtAction(nameof(GetTask), new { id = task.Id }, task);
    }

    // PUT: api/tasks/{id}
    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TaskResponseDto>> UpdateTask(
        Guid id,
        [FromBody] TaskUpdateDto dto,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var task = await _taskService.UpdateTaskAsync(userId, id, dto, cancellationToken);
        return Ok(task);
    }

    // DELETE: api/tasks/{id}
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteTask(
        Guid id,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        await _taskService.DeleteTaskAsync(userId, id, cancellationToken);
        return NoContent();
    }

    // GET: api/tasks/{id}/hierarchy
    [HttpGet("{id:guid}/hierarchy")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<TaskHierarchyDto>> GetTaskHierarchy(
        Guid id,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var hierarchy = await _taskService.GetTaskHierarchyAsync(userId, id, cancellationToken);
        return Ok(hierarchy);
    }
}
```

**AuthController.cs Example:**

```csharp
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Core.Interfaces.Services;
using TaskFlow.Core.DTOs.Auth;

namespace TaskFlow.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IAuthService authService,
        ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    // POST: api/auth/register
    [HttpPost("register")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AuthResponseDto>> Register(
        [FromBody] RegisterDto dto,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("New user registration attempt: {Email}", dto.Email);
        
        var response = await _authService.RegisterAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(Register), response);
    }

    // POST: api/auth/login
    [HttpPost("login")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponseDto>> Login(
        [FromBody] LoginDto dto,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("Login attempt: {Email}", dto.Email);
        
        var response = await _authService.LoginAsync(dto, cancellationToken);
        return Ok(response);
    }

    // POST: api/auth/refresh
    [HttpPost("refresh")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponseDto>> RefreshToken(
        [FromBody] RefreshTokenDto dto,
        CancellationToken cancellationToken)
    {
        var response = await _authService.RefreshTokenAsync(dto, cancellationToken);
        return Ok(response);
    }
}
```

### Service Layer

Services contain business logic and coordinate between controllers and repositories. They validate business rules and orchestrate complex operations.

**TaskService.cs Example:**

```csharp
using TaskFlow.Core.Interfaces.Services;
using TaskFlow.Core.Interfaces;
using TaskFlow.Core.DTOs.Tasks;
using TaskFlow.Core.Entities;
using TaskFlow.Core.Exceptions;

namespace TaskFlow.Core.Services;

public class TaskService : ITaskService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IActivityLogService _activityLogService;
    private readonly ILogger<TaskService> _logger;

    public TaskService(
        IUnitOfWork unitOfWork,
        IActivityLogService activityLogService,
        ILogger<TaskService> logger)
    {
        _unitOfWork = unitOfWork;
        _activityLogService = activityLogService;
        _logger = logger;
    }

    public async Task<PagedResponseDto<TaskResponseDto>> GetTasksAsync(
        Guid userId,
        TaskFilterDto filter,
        CancellationToken cancellationToken)
    {
        // Validate user exists
        var userExists = await _unitOfWork.Users.ExistsAsync(userId, cancellationToken);
        if (!userExists)
            throw new UnauthorizedException("User not found");

        // Build query with filters
        var query = _unitOfWork.Tasks.GetTasksForUser(userId);

        if (filter.Status.HasValue)
            query = query.Where(t => t.Status == filter.Status.Value);

        if (filter.Priority.HasValue)
            query = query.Where(t => t.Priority == filter.Priority.Value);

        if (!string.IsNullOrEmpty(filter.Search))
            query = query.Where(t => 
                t.Name.Contains(filter.Search) || 
                t.Description.Contains(filter.Search));

        if (filter.DueDateFrom.HasValue)
            query = query.Where(t => t.DueDate >= filter.DueDateFrom.Value);

        if (filter.DueDateTo.HasValue)
            query = query.Where(t => t.DueDate <= filter.DueDateTo.Value);

        // Apply pagination
        var totalCount = await query.CountAsync(cancellationToken);
        var tasks = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync(cancellationToken);

        var taskDtos = tasks.Select(MapToDto).ToList();

        return new PagedResponseDto<TaskResponseDto>
        {
            Items = taskDtos,
            TotalCount = totalCount,
            Page = filter.Page,
            PageSize = filter.PageSize
        };
    }

    public async Task<TaskResponseDto> CreateTaskAsync(
        Guid userId,
        TaskCreateDto dto,
        CancellationToken cancellationToken)
    {
        // Validate parent task exists if specified
        if (dto.ParentTaskId.HasValue)
        {
            var parentExists = await _unitOfWork.Tasks.ExistsAsync(
                dto.ParentTaskId.Value, 
                cancellationToken);
            
            if (!parentExists)
                throw new ValidationException("Parent task not found");

            // Prevent circular dependencies
            var wouldCreateCycle = await _unitOfWork.Tasks
                .WouldCreateCycleAsync(dto.ParentTaskId.Value, userId, cancellationToken);
            
            if (wouldCreateCycle)
                throw new ValidationException("Cannot create circular task dependencies");
        }

        var task = new Task
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Description = dto.Description,
            Status = dto.Status,
            Priority = dto.Priority,
            EstimatedHours = dto.EstimatedHours,
            DueDate = dto.DueDate,
            ParentTaskId = dto.ParentTaskId,
            CreatedById = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Tasks.AddAsync(task, cancellationToken);
        await _unitOfWork.CommitAsync(cancellationToken);

        // Log activity
        await _activityLogService.LogActivityAsync(
            userId,
            task.Id,
            ActivityType.TaskCreated,
            $"Created task: {task.Name}",
            cancellationToken);

        _logger.LogInformation("Task {TaskId} created by user {UserId}", task.Id, userId);

        return MapToDto(task);
    }

    public async Task<TaskHierarchyDto> GetTaskHierarchyAsync(
        Guid userId,
        Guid taskId,
        CancellationToken cancellationToken)
    {
        var task = await _unitOfWork.Tasks.GetByIdAsync(taskId, cancellationToken);
        if (task == null)
            throw new NotFoundException("Task not found");

        // Use recursive CTE function from database
        var hierarchy = await _unitOfWork.Tasks
            .GetTaskHierarchyAsync(taskId, cancellationToken);

        return hierarchy;
    }

    private static TaskResponseDto MapToDto(Task task)
    {
        return new TaskResponseDto
        {
            Id = task.Id,
            Name = task.Name,
            Description = task.Description,
            Status = task.Status,
            Priority = task.Priority,
            EstimatedHours = task.EstimatedHours,
            ActualHours = task.ActualHours,
            DueDate = task.DueDate,
            ParentTaskId = task.ParentTaskId,
            CreatedById = task.CreatedById,
            CreatedAt = task.CreatedAt,
            UpdatedAt = task.UpdatedAt
        };
    }
}
```

### Repository Pattern

Repositories abstract data access logic using interfaces. Unit of Work pattern coordinates multiple repository operations in a transaction.

**ITaskRepository.cs Interface:**

```csharp
using TaskFlow.Core.Entities;

namespace TaskFlow.Core.Interfaces.Repositories;

public interface ITaskRepository : IRepository<Task>
{
    Task<IEnumerable<Task>> GetTasksForUserAsync(
        Guid userId, 
        CancellationToken cancellationToken);
    
    Task<TaskHierarchyDto> GetTaskHierarchyAsync(
        Guid taskId, 
        CancellationToken cancellationToken);
    
    Task<bool> WouldCreateCycleAsync(
        Guid parentId, 
        Guid childId, 
        CancellationToken cancellationToken);
    
    Task<IEnumerable<Task>> GetSubtasksAsync(
        Guid parentId, 
        CancellationToken cancellationToken);
    
    IQueryable<Task> GetTasksForUser(Guid userId);
}

public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<IEnumerable<T>> GetAllAsync(CancellationToken cancellationToken);
    Task AddAsync(T entity, CancellationToken cancellationToken);
    void Update(T entity);
    void Delete(T entity);
    Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken);
}
```

**TaskRepository.cs Implementation:**

```csharp
using Microsoft.EntityFrameworkCore;
using TaskFlow.Core.Entities;
using TaskFlow.Core.Interfaces.Repositories;
using TaskFlow.Infrastructure.Data;

namespace TaskFlow.Infrastructure.Repositories;

public class TaskRepository : Repository<Task>, ITaskRepository
{
    public TaskRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Task>> GetTasksForUserAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        return await _context.Tasks
            .Where(t => t.CreatedById == userId)
            .Include(t => t.Assignees)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public IQueryable<Task> GetTasksForUser(Guid userId)
    {
        return _context.Tasks
            .Where(t => t.CreatedById == userId)
            .AsQueryable();
    }

    public async Task<TaskHierarchyDto> GetTaskHierarchyAsync(
        Guid taskId,
        CancellationToken cancellationToken)
    {
        // Call PostgreSQL recursive CTE function
        var result = await _context.TaskHierarchies
            .FromSqlRaw("SELECT * FROM get_task_hierarchy({0})", taskId)
            .ToListAsync(cancellationToken);

        return BuildHierarchyTree(result);
    }

    public async Task<bool> WouldCreateCycleAsync(
        Guid parentId,
        Guid childId,
        CancellationToken cancellationToken)
    {
        // Check if parentId appears in childId's ancestor chain
        var ancestors = await _context.Tasks
            .FromSqlRaw(@"
                WITH RECURSIVE ancestors AS (
                    SELECT id, parent_task_id
                    FROM tasks
                    WHERE id = {0}
                    UNION ALL
                    SELECT t.id, t.parent_task_id
                    FROM tasks t
                    INNER JOIN ancestors a ON t.id = a.parent_task_id
                )
                SELECT id FROM ancestors WHERE id = {1}",
                childId, parentId)
            .Select(t => t.Id)
            .ToListAsync(cancellationToken);

        return ancestors.Any();
    }

    public async Task<IEnumerable<Task>> GetSubtasksAsync(
        Guid parentId,
        CancellationToken cancellationToken)
    {
        return await _context.Tasks
            .Where(t => t.ParentTaskId == parentId)
            .Include(t => t.Assignees)
            .ToListAsync(cancellationToken);
    }

    private TaskHierarchyDto BuildHierarchyTree(List<TaskHierarchy> flatList)
    {
        // Build tree structure from flat list
        var lookup = flatList.ToDictionary(t => t.Id);
        foreach (var item in flatList.Where(t => t.ParentTaskId.HasValue))
        {
            if (lookup.TryGetValue(item.ParentTaskId.Value, out var parent))
            {
                parent.Children ??= new List<TaskHierarchyDto>();
                parent.Children.Add(MapToDto(item));
            }
        }
        return MapToDto(flatList.First(t => !t.ParentTaskId.HasValue));
    }
}

public class Repository<T> : IRepository<T> where T : class
{
    protected readonly ApplicationDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(ApplicationDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public async Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await _dbSet.FindAsync(new object[] { id }, cancellationToken);
    }

    public async Task<IEnumerable<T>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await _dbSet.ToListAsync(cancellationToken);
    }

    public async Task AddAsync(T entity, CancellationToken cancellationToken)
    {
        await _dbSet.AddAsync(entity, cancellationToken);
    }

    public void Update(T entity)
    {
        _dbSet.Update(entity);
    }

    public void Delete(T entity)
    {
        _dbSet.Remove(entity);
    }

    public async Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken)
    {
        return await _dbSet.FindAsync(new object[] { id }, cancellationToken) != null;
    }
}
```

**UnitOfWork.cs:**

```csharp
using TaskFlow.Core.Interfaces;
using TaskFlow.Core.Interfaces.Repositories;
using TaskFlow.Infrastructure.Data;

namespace TaskFlow.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;

    public ITaskRepository Tasks { get; }
    public IUserRepository Users { get; }
    public ITimeEntryRepository TimeEntries { get; }
    public ICommentRepository Comments { get; }

    public UnitOfWork(
        ApplicationDbContext context,
        ITaskRepository taskRepository,
        IUserRepository userRepository,
        ITimeEntryRepository timeEntryRepository,
        ICommentRepository commentRepository)
    {
        _context = context;
        Tasks = taskRepository;
        Users = userRepository;
        TimeEntries = timeEntryRepository;
        Comments = commentRepository;
    }

    public async Task<int> CommitAsync(CancellationToken cancellationToken)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
```

### Middleware Pipeline

Middleware handles cross-cutting concerns in the request pipeline.

**Program.cs Configuration:**

```csharp
using TaskFlow.Api.Extensions;
using TaskFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Custom service registration (DI)
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices();

// Authentication
builder.Services.AddJwtAuthentication(builder.Configuration);

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(builder.Configuration["FrontendUrl"]!)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Middleware pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<CorrelationIdMiddleware>();
app.UseMiddleware<RequestLoggingMiddleware>();
app.UseMiddleware<ErrorHandlingMiddleware>();

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Apply migrations on startup (for Fly.io deployment)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await db.Database.MigrateAsync();
}

app.Run();
```

**ErrorHandlingMiddleware.cs:**

```csharp
using System.Net;
using System.Text.Json;
using TaskFlow.Core.Exceptions;
using TaskFlow.Core.DTOs.Shared;

namespace TaskFlow.Api.Middleware;

public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    public ErrorHandlingMiddleware(
        RequestDelegate next,
        ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var response = context.Response;
        response.ContentType = "application/json";

        var errorResponse = new ErrorResponseDto
        {
            TraceId = context.TraceIdentifier,
            Timestamp = DateTime.UtcNow
        };

        switch (exception)
        {
            case NotFoundException notFound:
                response.StatusCode = (int)HttpStatusCode.NotFound;
                errorResponse.Message = notFound.Message;
                errorResponse.Errors = null;
                _logger.LogWarning(notFound, "Resource not found");
                break;

            case ValidationException validation:
                response.StatusCode = (int)HttpStatusCode.BadRequest;
                errorResponse.Message = "Validation failed";
                errorResponse.Errors = validation.Errors;
                _logger.LogWarning(validation, "Validation error");
                break;

            case UnauthorizedException unauthorized:
                response.StatusCode = (int)HttpStatusCode.Unauthorized;
                errorResponse.Message = unauthorized.Message;
                _logger.LogWarning(unauthorized, "Unauthorized access");
                break;

            default:
                response.StatusCode = (int)HttpStatusCode.InternalServerError;
                errorResponse.Message = "An unexpected error occurred";
                _logger.LogError(exception, "Unhandled exception");
                break;
        }

        var jsonResponse = JsonSerializer.Serialize(errorResponse);
        await response.WriteAsync(jsonResponse);
    }
}
```

### Dependency Injection Setup

**ServiceCollectionExtensions.cs:**

```csharp
using TaskFlow.Core.Interfaces;
using TaskFlow.Core.Interfaces.Services;
using TaskFlow.Core.Interfaces.Repositories;
using TaskFlow.Core.Services;
using TaskFlow.Infrastructure.Repositories;
using TaskFlow.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace TaskFlow.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Core services
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ITaskService, TaskService>();
        services.AddScoped<ITimeTrackingService, TimeTrackingService>();
        services.AddScoped<IActivityLogService, ActivityLogService>();

        return services;
    }

    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services)
    {
        // Repositories
        services.AddScoped<ITaskRepository, TaskRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<ITimeEntryRepository, TimeEntryRepository>();
        services.AddScoped<ICommentRepository, CommentRepository>();
        
        // Unit of Work
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Infrastructure services
        services.AddSingleton<IJwtTokenService, JwtTokenService>();
        services.AddSingleton<IPasswordHasher, PasswordHasher>();

        return services;
    }

    public static IServiceCollection AddJwtAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var jwtSettings = configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"]!;

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtSettings["Issuer"],
                ValidAudience = jwtSettings["Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(secretKey)),
                ClockSkew = TimeSpan.Zero
            };
        });

        return services;
    }
}
```

### EF Core Configuration

**ApplicationDbContext.cs:**

```csharp
using Microsoft.EntityFrameworkCore;
using TaskFlow.Core.Entities;
using TaskFlow.Infrastructure.Configurations;

namespace TaskFlow.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Task> Tasks { get; set; }
    public DbSet<TaskAssignee> TaskAssignees { get; set; }
    public DbSet<TimeEntry> TimeEntries { get; set; }
    public DbSet<Comment> Comments { get; set; }
    public DbSet<ActivityLog> ActivityLogs { get; set; }

    // For raw SQL queries
    public DbSet<TaskHierarchy> TaskHierarchies { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply configurations from separate files
        modelBuilder.ApplyConfiguration(new UserConfiguration());
        modelBuilder.ApplyConfiguration(new TaskConfiguration());
        modelBuilder.ApplyConfiguration(new TaskAssigneeConfiguration());
        modelBuilder.ApplyConfiguration(new TimeEntryConfiguration());
        modelBuilder.ApplyConfiguration(new CommentConfiguration());
        modelBuilder.ApplyConfiguration(new ActivityLogConfiguration());

        // Configure TaskHierarchy as keyless entity for raw SQL
        modelBuilder.Entity<TaskHierarchy>().HasNoKey().ToView(null);
    }
}
```

**TaskConfiguration.cs Example:**

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskFlow.Core.Entities;

namespace TaskFlow.Infrastructure.Configurations;

public class TaskConfiguration : IEntityTypeConfiguration<Task>
{
    public void Configure(EntityTypeBuilder<Task> builder)
    {
        builder.ToTable("tasks");

        builder.HasKey(t => t.Id);
        builder.Property(t => t.Id).HasColumnName("id");

        builder.Property(t => t.Name)
            .HasColumnName("name")
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(t => t.Description)
            .HasColumnName("description")
            .HasMaxLength(2000);

        builder.Property(t => t.Status)
            .HasColumnName("status")
            .IsRequired()
            .HasConversion<string>();

        builder.Property(t => t.Priority)
            .HasColumnName("priority")
            .IsRequired()
            .HasConversion<string>();

        builder.Property(t => t.EstimatedHours)
            .HasColumnName("estimated_hours")
            .HasPrecision(10, 2);

        builder.Property(t => t.ActualHours)
            .HasColumnName("actual_hours")
            .HasPrecision(10, 2);

        builder.Property(t => t.DueDate)
            .HasColumnName("due_date");

        builder.Property(t => t.ParentTaskId)
            .HasColumnName("parent_task_id");

        builder.Property(t => t.CreatedById)
            .HasColumnName("created_by_id")
            .IsRequired();

        builder.Property(t => t.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Property(t => t.UpdatedAt)
            .HasColumnName("updated_at")
            .IsRequired();

        // Relationships
        builder.HasOne(t => t.CreatedBy)
            .WithMany(u => u.CreatedTasks)
            .HasForeignKey(t => t.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.ParentTask)
            .WithMany(t => t.Subtasks)
            .HasForeignKey(t => t.ParentTaskId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(t => t.Assignees)
            .WithOne(ta => ta.Task)
            .HasForeignKey(ta => ta.TaskId);

        builder.HasMany(t => t.TimeEntries)
            .WithOne(te => te.Task)
            .HasForeignKey(te => te.TaskId);

        builder.HasMany(t => t.Comments)
            .WithOne(c => c.Task)
            .HasForeignKey(c => c.TaskId);

        // Indexes
        builder.HasIndex(t => t.Status);
        builder.HasIndex(t => t.Priority);
        builder.HasIndex(t => t.DueDate);
        builder.HasIndex(t => t.CreatedById);
        builder.HasIndex(t => t.ParentTaskId);
        builder.HasIndex(t => t.CreatedAt);
    }
}
```

### Authentication Flow

**JwtTokenService.cs:**

```csharp
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using TaskFlow.Core.Interfaces.Services;
using TaskFlow.Core.Entities;

namespace TaskFlow.Infrastructure.Services;

public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateAccessToken(User user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"]!;
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.DisplayName),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(int.Parse(jwtSettings["ExpiryMinutes"]!)),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        return Convert.ToBase64String(Guid.NewGuid().ToByteArray());
    }

    public ClaimsPrincipal ValidateToken(string token)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"]!;
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));

        var tokenHandler = new JwtSecurityTokenHandler();
        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = false, // Don't validate expiry for refresh
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = key
        };

        return tokenHandler.ValidateToken(token, validationParameters, out _);
    }
}
```

### Deployment Configuration

**Dockerfile:**

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["TaskFlow.Api/TaskFlow.Api.csproj", "TaskFlow.Api/"]
COPY ["TaskFlow.Core/TaskFlow.Core.csproj", "TaskFlow.Core/"]
COPY ["TaskFlow.Infrastructure/TaskFlow.Infrastructure.csproj", "TaskFlow.Infrastructure/"]
RUN dotnet restore "TaskFlow.Api/TaskFlow.Api.csproj"
COPY . .
WORKDIR "/src/TaskFlow.Api"
RUN dotnet build "TaskFlow.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "TaskFlow.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "TaskFlow.Api.dll"]
```

**fly.toml:**

```toml
app = "taskflow-api"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[env]
  ASPNETCORE_ENVIRONMENT = "Production"
  ASPNETCORE_URLS = "http://0.0.0.0:8080"

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [[services.http_checks]]
    interval = 10000
    timeout = 2000
    grace_period = "10s"
    method = "GET"
    path = "/health"
```

**appsettings.Production.json:**

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "${DATABASE_URL}"
  },
  "JwtSettings": {
    "SecretKey": "${JWT_SECRET_KEY}",
    "Issuer": "TaskFlow.Api",
    "Audience": "TaskFlow.Web",
    "ExpiryMinutes": 60,
    "RefreshTokenExpiryDays": 7
  },
  "FrontendUrl": "${FRONTEND_URL}",
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Warning"
    }
  }
}
```

---

## 12. Coding Standards

This section defines critical coding standards for AI agents and developers working on TaskFlow. These are **minimal but essential** rules that prevent common mistakes and ensure consistency across the fullstack codebase.

### Critical Fullstack Rules

**Type Sharing:**
- All shared TypeScript interfaces MUST be defined in a shared types location accessible to both frontend and backend
- Generate TypeScript interfaces from C# DTOs for API contracts
- Never duplicate type definitions between frontend and backend
- Use a single source of truth for data structures

**API Communication:**
- Never make direct HTTP calls using `fetch()` or `HttpClient` outside of service layers
- Frontend: All API calls MUST go through services in `src/app/core/services/`
- Backend: All database access MUST go through repositories, never direct DbContext calls in controllers
- Use dependency injection for all service dependencies

**Environment Variables:**
- Access environment variables only through configuration objects
- Frontend: Use `environment.ts` files, never `process.env` directly in components
- Backend: Use `IConfiguration` injection, never `Environment.GetEnvironmentVariable()` in business logic
- All secrets MUST be in environment variables, never hardcoded

**Error Handling:**
- All backend API routes MUST use the global `ErrorHandlingMiddleware`
- Frontend: All service methods MUST use the centralized error handling via HTTP interceptor
- Never swallow errors silently - log and propagate appropriately
- Use custom exception types (`NotFoundException`, `ValidationException`, `UnauthorizedException`)

**State Management:**
- Frontend: Never mutate state directly - use RxJS BehaviorSubjects for shared state
- Always use immutable update patterns (spread operators, array methods)
- Keep component state minimal - lift shared state to services
- Use async pipe in templates to auto-unsubscribe from observables

**Authentication:**
- JWT tokens MUST be stored in memory only (BehaviorSubject), never localStorage
- Refresh tokens can be stored in httpOnly cookies (future enhancement)
- All authenticated API calls MUST include Authorization header via HTTP interceptor
- Backend: All protected endpoints MUST have `[Authorize]` attribute

**Database Queries:**
- Always use parameterized queries through EF Core to prevent SQL injection
- Use `AsNoTracking()` for read-only queries to improve performance
- Apply `.ToListAsync()` or `.FirstOrDefaultAsync()` to execute queries, never iterate `IQueryable` directly
- Use indexes on foreign keys and frequently queried columns

**Component Architecture:**
- Follow container/presentational pattern: smart containers, dumb presentational components
- Presentational components should only use `@Input()` and `@Output()`, no service injection
- Keep components focused - single responsibility principle
- Each component must have separate `.ts`, `.html`, and `.scss` files

**Async Operations:**
- Frontend: Always use `async pipe` for observables in templates to prevent memory leaks
- Backend: Use `async/await` consistently, never mix with `.Result` or `.Wait()`
- Always pass `CancellationToken` through the call chain
- Handle cancellation gracefully in long-running operations

**Validation:**
- Frontend: Use reactive forms with built-in validators
- Backend: Use Data Annotations on DTOs and FluentValidation for complex rules
- Validate at API boundary (DTOs), not in domain entities
- Return clear validation error messages with field-level details

**Dependency Injection:**
- Register all services in `ServiceCollectionExtensions` methods
- Use appropriate lifetimes: Singleton for stateless, Scoped for per-request, Transient for lightweight
- Never use `new` keyword for services - always inject via constructor
- Keep constructors simple - only assign dependencies, no logic

**Logging:**
- Use structured logging with semantic properties: `_logger.LogInformation("User {UserId} created task {TaskId}", userId, taskId)`
- Never log sensitive data (passwords, tokens, PII)
- Log at appropriate levels: Debug for dev-only, Information for business events, Warning for recoverable errors, Error for exceptions
- Include correlation IDs for request tracing

### Naming Conventions

| Element | Frontend (Angular/TypeScript) | Backend (ASP.NET Core/C#) | Example |
|---------|-------------------------------|---------------------------|---------|
| **Components** | PascalCase | - | `TaskListComponent`, `UserProfileComponent` |
| **Component Files** | kebab-case | - | `task-list.component.ts`, `task-list.component.html`, `task-list.component.scss` |
| **Services** | PascalCase | PascalCase | `AuthService.ts`, `AuthService.cs` |
| **Interfaces (TS)** | PascalCase | PascalCase (prefix with I) | `Task`, `User` (frontend), `ITaskRepository` (backend) |
| **DTOs** | PascalCase with suffix | PascalCase with suffix | `TaskCreateDto`, `TaskResponseDto` |
| **API Routes** | kebab-case | - | `/api/tasks`, `/api/time-entries` |
| **Variables** | camelCase | camelCase | `userId`, `taskList`, `currentPage` |
| **Constants** | UPPER_SNAKE_CASE | PascalCase | `MAX_PAGE_SIZE`, `DefaultPageSize` |
| **Database Tables** | - | snake_case | `tasks`, `time_entries`, `task_assignees` |
| **Database Columns** | - | snake_case | `created_at`, `parent_task_id`, `estimated_hours` |
| **Enums** | PascalCase | PascalCase | `TaskStatus`, `TaskPriority` |
| **Hooks (Angular)** | camelCase with 'use' prefix | - | N/A (not applicable to Angular) |
| **Private Fields (C#)** | - | _camelCase | `_unitOfWork`, `_logger`, `_context` |
| **Methods** | camelCase | PascalCase | `getTasks()`, `GetTasksAsync()` |
| **Boolean Variables** | camelCase with is/has | PascalCase with Is/Has | `isLoading`, `hasPermission`, `IsActive` |
| **Event Handlers** | camelCase with 'on' prefix | PascalCase with 'On' prefix | `onSubmit()`, `OnTaskCreated()` |

### File Organization Standards

**Angular Component Structure:**
```
feature-name/
├── feature-name.component.ts       # Component logic
├── feature-name.component.html     # Template
├── feature-name.component.scss     # Styles
├── feature-name.component.spec.ts  # Unit tests
└── components/                     # Child components
    └── child-component/
        ├── child-component.component.ts
        ├── child-component.component.html
        └── child-component.component.scss
```

**ASP.NET Core Project Structure:**
```
Feature/
├── FeatureController.cs           # API controller
├── FeatureService.cs              # Business logic
├── IFeatureService.cs             # Service interface
├── FeatureRepository.cs           # Data access
├── IFeatureRepository.cs          # Repository interface
└── DTOs/
    ├── FeatureCreateDto.cs
    ├── FeatureUpdateDto.cs
    └── FeatureResponseDto.cs
```

### Code Quality Rules

**General:**
- Maximum file length: 300 lines (split larger files)
- Maximum method length: 50 lines (extract to helper methods)
- Maximum method parameters: 4 (use DTOs for more)
- No magic numbers - use named constants
- No commented-out code - delete it (version control exists)

**TypeScript/Angular:**
- Enable strict mode in `tsconfig.json`
- No `any` types - use proper typing or `unknown`
- Prefer `const` over `let`, never use `var`
- Use arrow functions for callbacks
- Avoid nested subscriptions - use RxJS operators (switchMap, mergeMap, etc.)

**C#:**
- Enable nullable reference types
- Use `var` for local variables when type is obvious
- Prefer expression-bodied members for single-line methods
- Use collection initializers and object initializers
- Always dispose IDisposable resources (use `using` statements)

### Comment Standards

**When to Comment:**
- Complex business logic that isn't self-evident
- Workarounds for external API quirks or bugs
- Performance optimizations that seem non-obvious
- Public API documentation (XML comments for C#, JSDoc for TypeScript)

**When NOT to Comment:**
- Obvious code that explains what it does (the code itself should be self-documenting)
- Restating the code in English
- Commented-out code (delete it instead)
- TODO comments without a ticket reference

**Good Comment Examples:**
```csharp
// NFR19: Use recursive CTE for task hierarchy to prevent N+1 queries
var hierarchy = await _context.Tasks
    .FromSqlRaw("SELECT * FROM get_task_hierarchy({0})", taskId)
    .ToListAsync(cancellationToken);
```

```typescript
// Debounce search input to prevent excessive API calls
this.searchControl.valueChanges.pipe(
  debounceTime(300),
  distinctUntilChanged()
).subscribe(term => this.search(term));
```

### Git Commit Standards

**Commit Message Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(tasks): add task hierarchy view with recursive query

Implements NFR19 requirement for parent-child task relationships.
Uses PostgreSQL recursive CTE for efficient querying.

Closes #42
```

```
fix(auth): prevent token refresh loop on 401 responses

The HTTP interceptor was retrying 401 responses indefinitely.
Added check to skip retry on auth endpoints.

Fixes #67
```

### Testing Standards

**Unit Test Requirements:**
- Every service method MUST have unit tests
- Every repository method MUST have unit tests
- Components with business logic MUST have unit tests
- Aim for 80%+ code coverage

**Test Naming:**
- TypeScript: `describe('MethodName', () => { it('should do something when condition', () => ...) })`
- C#: `public void MethodName_ShouldDoSomething_WhenCondition()`

**Test Organization:**
- Arrange-Act-Assert pattern
- One assertion per test (or related assertions)
- Use test fixtures for common setup
- Mock external dependencies (repositories, HTTP calls)

### Performance Standards

**Frontend:**
- Initial bundle size < 500KB gzipped
- First Contentful Paint < 1.5s
- Time to Interactive < 3.5s
- Lazy load routes and feature modules
- Use virtual scrolling for lists > 100 items

**Backend:**
- API response time p95 < 500ms
- Database queries < 100ms
- Use pagination for list endpoints (max 100 items per page)
- Implement response caching where appropriate
- Use database connection pooling

### Security Standards

**Frontend:**
- Never store sensitive data in localStorage
- Sanitize all user input before rendering
- Use Angular's built-in XSS protection
- Implement Content Security Policy headers

**Backend:**
- Always validate and sanitize user input
- Use parameterized queries (EF Core handles this)
- Implement rate limiting on auth endpoints
- Hash passwords with BCrypt (work factor 12)
- Use HTTPS only in production
- Set secure cookie flags

### Accessibility Standards

**WCAG 2.1 Level AA Compliance:**
- All interactive elements keyboard accessible
- Color contrast ratio ≥ 4.5:1 for text
- Alt text for images
- ARIA labels for complex components
- Semantic HTML5 elements
- Focus indicators visible
- Form validation errors clearly announced

**Angular Specific:**
- Use Angular Material components (built-in accessibility)
- Add `aria-label` to icon-only buttons
- Implement skip navigation links
- Use live regions for dynamic content


---

## 13. Unified Project Structure

This section defines the complete repository structure for TaskFlow, showing both the Angular frontend workspace and the ASP.NET Core backend solution. The hybrid approach respects each ecosystem's conventions while maintaining clear organization.

### Complete Repository Structure

```
taskflow/                                    # Root repository
├── .github/                                 # GitHub configuration
│   └── workflows/
│       ├── frontend-ci.yml                  # Frontend CI pipeline
│       ├── backend-ci.yml                   # Backend CI pipeline
│       └── deploy.yml                       # Deployment workflow
│
├── frontend/                                # Angular 20 workspace
│   ├── .vscode/                             # VS Code settings
│   │   ├── settings.json
│   │   ├── extensions.json
│   │   └── launch.json
│   ├── public/                              # Static assets
│   │   └── favicon.ico
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/                        # Singleton services
│   │   │   │   ├── guards/
│   │   │   │   │   ├── auth.guard.ts
│   │   │   │   │   └── auth.guard.spec.ts
│   │   │   │   ├── interceptors/
│   │   │   │   │   ├── auth.interceptor.ts
│   │   │   │   │   ├── error.interceptor.ts
│   │   │   │   │   └── loading.interceptor.ts
│   │   │   │   ├── services/
│   │   │   │   │   ├── api/
│   │   │   │   │   │   ├── api.service.ts
│   │   │   │   │   │   ├── task.service.ts
│   │   │   │   │   │   ├── time-tracking.service.ts
│   │   │   │   │   │   ├── comment.service.ts
│   │   │   │   │   │   └── user.service.ts
│   │   │   │   │   ├── auth/
│   │   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   │   └── token.service.ts
│   │   │   │   │   └── state/
│   │   │   │   │       ├── task-state.service.ts
│   │   │   │   │       └── user-state.service.ts
│   │   │   │   └── models/                  # TypeScript interfaces/types
│   │   │   │       ├── task.model.ts
│   │   │   │       ├── user.model.ts
│   │   │   │       ├── time-entry.model.ts
│   │   │   │       ├── comment.model.ts
│   │   │   │       └── api-response.model.ts
│   │   │   │
│   │   │   ├── shared/                      # Shared components & utilities
│   │   │   │   ├── components/
│   │   │   │   │   ├── loading-spinner/
│   │   │   │   │   │   ├── loading-spinner.component.ts
│   │   │   │   │   │   ├── loading-spinner.component.html
│   │   │   │   │   │   ├── loading-spinner.component.scss
│   │   │   │   │   │   └── loading-spinner.component.spec.ts
│   │   │   │   │   ├── confirmation-dialog/
│   │   │   │   │   │   ├── confirmation-dialog.component.ts
│   │   │   │   │   │   ├── confirmation-dialog.component.html
│   │   │   │   │   │   ├── confirmation-dialog.component.scss
│   │   │   │   │   │   └── confirmation-dialog.component.spec.ts
│   │   │   │   │   ├── error-message/
│   │   │   │   │   │   ├── error-message.component.ts
│   │   │   │   │   │   ├── error-message.component.html
│   │   │   │   │   │   └── error-message.component.scss
│   │   │   │   │   └── empty-state/
│   │   │   │   │       ├── empty-state.component.ts
│   │   │   │   │       ├── empty-state.component.html
│   │   │   │   │       └── empty-state.component.scss
│   │   │   │   ├── directives/
│   │   │   │   │   ├── auto-focus.directive.ts
│   │   │   │   │   └── debounce-click.directive.ts
│   │   │   │   ├── pipes/
│   │   │   │   │   ├── status-label.pipe.ts
│   │   │   │   │   ├── priority-label.pipe.ts
│   │   │   │   │   ├── duration.pipe.ts
│   │   │   │   │   └── relative-time.pipe.ts
│   │   │   │   └── utils/
│   │   │   │       ├── date.utils.ts
│   │   │   │       ├── validation.utils.ts
│   │   │   │       └── format.utils.ts
│   │   │   │
│   │   │   ├── features/                    # Feature modules
│   │   │   │   ├── auth/
│   │   │   │   │   ├── login/
│   │   │   │   │   │   ├── login.component.ts
│   │   │   │   │   │   ├── login.component.html
│   │   │   │   │   │   ├── login.component.scss
│   │   │   │   │   │   └── login.component.spec.ts
│   │   │   │   │   ├── register/
│   │   │   │   │   │   ├── register.component.ts
│   │   │   │   │   │   ├── register.component.html
│   │   │   │   │   │   ├── register.component.scss
│   │   │   │   │   │   └── register.component.spec.ts
│   │   │   │   │   └── auth.routes.ts
│   │   │   │   │
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── dashboard.component.ts
│   │   │   │   │   ├── dashboard.component.html
│   │   │   │   │   ├── dashboard.component.scss
│   │   │   │   │   ├── dashboard.component.spec.ts
│   │   │   │   │   └── dashboard.routes.ts
│   │   │   │   │
│   │   │   │   ├── tasks/
│   │   │   │   │   ├── services/
│   │   │   │   │   │   └── task.service.ts
│   │   │   │   │   ├── task-list/
│   │   │   │   │   │   ├── task-list.component.ts
│   │   │   │   │   │   ├── task-list.component.html
│   │   │   │   │   │   ├── task-list.component.scss
│   │   │   │   │   │   ├── task-list.component.spec.ts
│   │   │   │   │   │   └── components/
│   │   │   │   │   │       ├── task-table/
│   │   │   │   │   │       │   ├── task-table.component.ts
│   │   │   │   │   │       │   ├── task-table.component.html
│   │   │   │   │   │       │   └── task-table.component.scss
│   │   │   │   │   │       ├── task-filters/
│   │   │   │   │   │       │   ├── task-filters.component.ts
│   │   │   │   │   │       │   ├── task-filters.component.html
│   │   │   │   │   │       │   └── task-filters.component.scss
│   │   │   │   │   │       └── task-card/
│   │   │   │   │   │           ├── task-card.component.ts
│   │   │   │   │   │           ├── task-card.component.html
│   │   │   │   │   │           └── task-card.component.scss
│   │   │   │   │   ├── task-tree/
│   │   │   │   │   │   ├── task-tree.component.ts
│   │   │   │   │   │   ├── task-tree.component.html
│   │   │   │   │   │   ├── task-tree.component.scss
│   │   │   │   │   │   └── components/
│   │   │   │   │   │       └── tree-node/
│   │   │   │   │   │           ├── tree-node.component.ts
│   │   │   │   │   │           ├── tree-node.component.html
│   │   │   │   │   │           └── tree-node.component.scss
│   │   │   │   │   ├── task-gantt/
│   │   │   │   │   │   ├── task-gantt.component.ts
│   │   │   │   │   │   ├── task-gantt.component.html
│   │   │   │   │   │   └── task-gantt.component.scss
│   │   │   │   │   ├── task-detail/
│   │   │   │   │   │   ├── task-detail.component.ts
│   │   │   │   │   │   ├── task-detail.component.html
│   │   │   │   │   │   ├── task-detail.component.scss
│   │   │   │   │   │   └── components/
│   │   │   │   │   │       ├── task-info-panel/
│   │   │   │   │   │       │   ├── task-info-panel.component.ts
│   │   │   │   │   │       │   ├── task-info-panel.component.html
│   │   │   │   │   │       │   └── task-info-panel.component.scss
│   │   │   │   │   │       ├── task-actions/
│   │   │   │   │   │       │   ├── task-actions.component.ts
│   │   │   │   │   │       │   ├── task-actions.component.html
│   │   │   │   │   │       │   └── task-actions.component.scss
│   │   │   │   │   │       └── task-metadata/
│   │   │   │   │   │           ├── task-metadata.component.ts
│   │   │   │   │   │           ├── task-metadata.component.html
│   │   │   │   │   │           └── task-metadata.component.scss
│   │   │   │   │   ├── task-form/
│   │   │   │   │   │   ├── task-form.component.ts
│   │   │   │   │   │   ├── task-form.component.html
│   │   │   │   │   │   └── task-form.component.scss
│   │   │   │   │   └── tasks.routes.ts
│   │   │   │   │
│   │   │   │   ├── time-tracking/
│   │   │   │   │   ├── services/
│   │   │   │   │   │   └── time-tracking.service.ts
│   │   │   │   │   ├── timer-widget/
│   │   │   │   │   │   ├── timer-widget.component.ts
│   │   │   │   │   │   ├── timer-widget.component.html
│   │   │   │   │   │   └── timer-widget.component.scss
│   │   │   │   │   ├── manual-entry/
│   │   │   │   │   │   ├── manual-entry.component.ts
│   │   │   │   │   │   ├── manual-entry.component.html
│   │   │   │   │   │   └── manual-entry.component.scss
│   │   │   │   │   ├── time-log/
│   │   │   │   │   │   ├── time-log.component.ts
│   │   │   │   │   │   ├── time-log.component.html
│   │   │   │   │   │   ├── time-log.component.scss
│   │   │   │   │   │   └── components/
│   │   │   │   │   │       └── time-entry-item/
│   │   │   │   │   │           ├── time-entry-item.component.ts
│   │   │   │   │   │           ├── time-entry-item.component.html
│   │   │   │   │   │           └── time-entry-item.component.scss
│   │   │   │   │   └── time-tracking.routes.ts
│   │   │   │   │
│   │   │   │   ├── collaboration/
│   │   │   │   │   ├── services/
│   │   │   │   │   │   ├── comment.service.ts
│   │   │   │   │   │   └── assignment.service.ts
│   │   │   │   │   ├── comment-thread/
│   │   │   │   │   │   ├── comment-thread.component.ts
│   │   │   │   │   │   ├── comment-thread.component.html
│   │   │   │   │   │   ├── comment-thread.component.scss
│   │   │   │   │   │   └── components/
│   │   │   │   │   │       ├── comment-item/
│   │   │   │   │   │       │   ├── comment-item.component.ts
│   │   │   │   │   │       │   ├── comment-item.component.html
│   │   │   │   │   │       │   └── comment-item.component.scss
│   │   │   │   │   │       └── comment-form/
│   │   │   │   │   │           ├── comment-form.component.ts
│   │   │   │   │   │           ├── comment-form.component.html
│   │   │   │   │   │           └── comment-form.component.scss
│   │   │   │   │   ├── assignment-picker/
│   │   │   │   │   │   ├── assignment-picker.component.ts
│   │   │   │   │   │   ├── assignment-picker.component.html
│   │   │   │   │   │   └── assignment-picker.component.scss
│   │   │   │   │   ├── activity-log/
│   │   │   │   │   │   ├── activity-log.component.ts
│   │   │   │   │   │   ├── activity-log.component.html
│   │   │   │   │   │   ├── activity-log.component.scss
│   │   │   │   │   │   └── components/
│   │   │   │   │   │       └── activity-item/
│   │   │   │   │   │           ├── activity-item.component.ts
│   │   │   │   │   │           ├── activity-item.component.html
│   │   │   │   │   │           └── activity-item.component.scss
│   │   │   │   │   └── collaboration.routes.ts
│   │   │   │   │
│   │   │   │   └── user-profile/
│   │   │   │       ├── user-profile.component.ts
│   │   │   │       ├── user-profile.component.html
│   │   │   │       ├── user-profile.component.scss
│   │   │   │       └── user-profile.routes.ts
│   │   │   │
│   │   │   ├── layout/                      # App shell layout
│   │   │   │   ├── main-layout/
│   │   │   │   │   ├── main-layout.component.ts
│   │   │   │   │   ├── main-layout.component.html
│   │   │   │   │   └── main-layout.component.scss
│   │   │   │   ├── navigation/
│   │   │   │   │   ├── navigation.component.ts
│   │   │   │   │   ├── navigation.component.html
│   │   │   │   │   └── navigation.component.scss
│   │   │   │   └── sidebar/
│   │   │   │       ├── sidebar.component.ts
│   │   │   │       ├── sidebar.component.html
│   │   │   │       └── sidebar.component.scss
│   │   │   │
│   │   │   ├── app.component.ts             # Root component
│   │   │   ├── app.component.html
│   │   │   ├── app.component.scss
│   │   │   ├── app.component.spec.ts
│   │   │   ├── app.config.ts                # App configuration
│   │   │   └── app.routes.ts                # Root routes
│   │   │
│   │   ├── assets/                          # Static assets
│   │   │   ├── images/
│   │   │   ├── icons/
│   │   │   └── fonts/
│   │   │
│   │   ├── environments/
│   │   │   ├── environment.ts               # Development config
│   │   │   └── environment.prod.ts          # Production config
│   │   │
│   │   ├── styles/                          # Global styles
│   │   │   ├── _variables.scss              # SCSS variables
│   │   │   ├── _mixins.scss                 # SCSS mixins
│   │   │   ├── _typography.scss             # Typography styles
│   │   │   └── _material-theme.scss         # Material theme
│   │   │
│   │   ├── index.html                       # HTML entry point
│   │   ├── main.ts                          # TypeScript entry point
│   │   └── styles.scss                      # Global styles entry
│   │
│   ├── .editorconfig                        # Editor configuration
│   ├── .eslintrc.json                       # ESLint configuration
│   ├── .gitignore
│   ├── .prettierrc                          # Prettier configuration
│   ├── angular.json                         # Angular workspace config
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json                        # TypeScript config
│   ├── tsconfig.app.json                    # App TypeScript config
│   ├── tsconfig.spec.json                   # Test TypeScript config
│   ├── README.md
│   └── vercel.json                          # Vercel deployment config
│
├── backend/                                 # ASP.NET Core solution
│   ├── TaskFlow.Api/                        # Web API project
│   │   ├── Controllers/
│   │   │   ├── AuthController.cs
│   │   │   ├── TasksController.cs
│   │   │   ├── TimeTrackingController.cs
│   │   │   ├── CommentsController.cs
│   │   │   └── UsersController.cs
│   │   ├── Middleware/
│   │   │   ├── ErrorHandlingMiddleware.cs
│   │   │   ├── RequestLoggingMiddleware.cs
│   │   │   └── CorrelationIdMiddleware.cs
│   │   ├── Filters/
│   │   │   ├── ValidateModelAttribute.cs
│   │   │   └── ApiKeyAuthFilter.cs
│   │   ├── Extensions/
│   │   │   ├── ServiceCollectionExtensions.cs
│   │   │   └── ApplicationBuilderExtensions.cs
│   │   ├── Properties/
│   │   │   └── launchSettings.json
│   │   ├── Program.cs
│   │   ├── appsettings.json
│   │   ├── appsettings.Development.json
│   │   ├── appsettings.Production.json
│   │   ├── Dockerfile
│   │   └── TaskFlow.Api.csproj
│   │
│   ├── TaskFlow.Core/                       # Business logic layer
│   │   ├── Entities/
│   │   │   ├── User.cs
│   │   │   ├── Task.cs
│   │   │   ├── TimeEntry.cs
│   │   │   ├── Comment.cs
│   │   │   ├── TaskAssignee.cs
│   │   │   └── ActivityLog.cs
│   │   ├── Interfaces/
│   │   │   ├── Repositories/
│   │   │   │   ├── ITaskRepository.cs
│   │   │   │   ├── IUserRepository.cs
│   │   │   │   ├── ITimeEntryRepository.cs
│   │   │   │   └── ICommentRepository.cs
│   │   │   ├── Services/
│   │   │   │   ├── IAuthService.cs
│   │   │   │   ├── ITaskService.cs
│   │   │   │   ├── ITimeTrackingService.cs
│   │   │   │   └── IActivityLogService.cs
│   │   │   └── IUnitOfWork.cs
│   │   ├── Services/
│   │   │   ├── AuthService.cs
│   │   │   ├── TaskService.cs
│   │   │   ├── TimeTrackingService.cs
│   │   │   └── ActivityLogService.cs
│   │   ├── DTOs/
│   │   │   ├── Auth/
│   │   │   │   ├── RegisterDto.cs
│   │   │   │   ├── LoginDto.cs
│   │   │   │   └── AuthResponseDto.cs
│   │   │   ├── Tasks/
│   │   │   │   ├── TaskCreateDto.cs
│   │   │   │   ├── TaskUpdateDto.cs
│   │   │   │   ├── TaskResponseDto.cs
│   │   │   │   └── TaskFilterDto.cs
│   │   │   ├── TimeEntries/
│   │   │   │   ├── TimeEntryCreateDto.cs
│   │   │   │   └── TimeEntryResponseDto.cs
│   │   │   └── Shared/
│   │   │       ├── PaginationDto.cs
│   │   │       └── ErrorResponseDto.cs
│   │   ├── Exceptions/
│   │   │   ├── NotFoundException.cs
│   │   │   ├── ValidationException.cs
│   │   │   └── UnauthorizedException.cs
│   │   ├── Constants/
│   │   │   ├── TaskStatus.cs
│   │   │   ├── TaskPriority.cs
│   │   │   └── ActivityType.cs
│   │   └── TaskFlow.Core.csproj
│   │
│   ├── TaskFlow.Infrastructure/             # Data access layer
│   │   ├── Data/
│   │   │   ├── ApplicationDbContext.cs
│   │   │   └── Migrations/
│   │   │       └── [EF Core migrations]
│   │   ├── Repositories/
│   │   │   ├── Repository.cs
│   │   │   ├── TaskRepository.cs
│   │   │   ├── UserRepository.cs
│   │   │   ├── TimeEntryRepository.cs
│   │   │   ├── CommentRepository.cs
│   │   │   └── UnitOfWork.cs
│   │   ├── Configurations/
│   │   │   ├── UserConfiguration.cs
│   │   │   ├── TaskConfiguration.cs
│   │   │   ├── TimeEntryConfiguration.cs
│   │   │   └── CommentConfiguration.cs
│   │   ├── Services/
│   │   │   ├── JwtTokenService.cs
│   │   │   └── PasswordHasher.cs
│   │   └── TaskFlow.Infrastructure.csproj
│   │
│   ├── TaskFlow.Tests/                      # Test projects
│   │   ├── Unit/
│   │   │   ├── Services/
│   │   │   │   ├── TaskServiceTests.cs
│   │   │   │   └── AuthServiceTests.cs
│   │   │   └── Repositories/
│   │   │       └── TaskRepositoryTests.cs
│   │   ├── Integration/
│   │   │   └── Controllers/
│   │   │       ├── TasksControllerTests.cs
│   │   │       └── AuthControllerTests.cs
│   │   └── TaskFlow.Tests.csproj
│   │
│   ├── .editorconfig
│   ├── .gitignore
│   ├── Directory.Build.props               # Shared MSBuild properties
│   ├── fly.toml                            # Fly.io deployment config
│   ├── TaskFlow.sln                        # Solution file
│   └── README.md
│
├── database/                               # Database scripts
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_add_task_hierarchy.sql
│   │   └── 003_add_indexes.sql
│   ├── seeds/
│   │   └── dev_seed_data.sql
│   └── README.md
│
├── docs/                                   # Documentation
│   ├── architecture.md                     # This document
│   ├── prd.md                              # Product requirements
│   ├── brief.md                            # Project brief
│   ├── api/
│   │   └── openapi.yaml                    # Generated from architecture.md
│   └── diagrams/
│       ├── architecture.png
│       └── erd.png
│
├── scripts/                                # Build & deployment scripts
│   ├── build-frontend.ps1
│   ├── build-backend.ps1
│   ├── deploy-frontend.ps1
│   ├── deploy-backend.ps1
│   ├── run-migrations.ps1
│   └── seed-database.ps1
│
├── docker-compose.yml                      # Local development compose
├── .gitignore                              # Root gitignore
├── .env.example                            # Environment variables template
├── LICENSE
└── README.md                               # Root readme
```

### Key Directory Explanations

**Frontend (`frontend/`):**
- **Standalone Angular 20 workspace** with Vite-based build system
- `src/app/core/` - Singleton services, guards, interceptors (imported once in app.config.ts)
- `src/app/shared/` - Reusable components, directives, pipes used across features
- `src/app/features/` - Feature modules with lazy-loaded routes
- `src/app/layout/` - App shell components (navigation, sidebar)
- `environments/` - Environment-specific configuration

**Backend (`backend/`):**
- **ASP.NET Core solution** with Clean Architecture layering
- `TaskFlow.Api/` - Presentation layer (controllers, middleware, filters)
- `TaskFlow.Core/` - Domain layer (entities, DTOs, business logic, interfaces)
- `TaskFlow.Infrastructure/` - Infrastructure layer (EF Core, repositories, external services)
- `TaskFlow.Tests/` - Unit and integration tests

**Database (`database/`):**
- SQL migration scripts for version control
- Seed data for development environment
- Separate from EF Core migrations for visibility

**Shared Concerns:**
- `.github/workflows/` - CI/CD pipelines for both stacks
- `docs/` - All documentation including this architecture
- `scripts/` - PowerShell scripts for build/deploy automation
- `docker-compose.yml` - Orchestrates frontend, backend, and PostgreSQL for local dev

### Repository Organization Rationale

**Why Hybrid Structure (Not Monorepo):**
1. **Ecosystem Respect:** npm/package.json for Angular, NuGet/.csproj for .NET
2. **Build Tools:** Angular CLI and dotnet CLI work independently
3. **Team Specialization:** Frontend/backend devs can work in their respective directories
4. **Deployment Independence:** Frontend (Vercel) and backend (Fly.io) deploy separately
5. **Type Sharing:** C# DTOs can generate TypeScript interfaces for frontend consumption

**Shared Code Strategy:**
- C# DTOs in `TaskFlow.Core/DTOs/` serve as single source of truth
- Generate TypeScript interfaces from C# using tools like NSwag or custom scripts
- Place generated types in `frontend/src/app/core/models/`
- Commit generated files to source control for visibility

### Docker Compose for Local Development

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: taskflow-db
    environment:
      POSTGRES_DB: taskflow_dev
      POSTGRES_USER: taskflow_user
      POSTGRES_PASSWORD: taskflow_pass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/migrations:/docker-entrypoint-initdb.d

  backend:
    build:
      context: ./backend
      dockerfile: TaskFlow.Api/Dockerfile
    container_name: taskflow-api
    environment:
      ASPNETCORE_ENVIRONMENT: Development
      ConnectionStrings__DefaultConnection: "Host=postgres;Database=taskflow_dev;Username=taskflow_user;Password=taskflow_pass"
      JwtSettings__SecretKey: "dev-secret-key-minimum-32-characters-long"
      JwtSettings__Issuer: "TaskFlow.Api"
      JwtSettings__Audience: "TaskFlow.Web"
      JwtSettings__ExpiryMinutes: "60"
      FrontendUrl: "http://localhost:4200"
    ports:
      - "5000:8080"
    depends_on:
      - postgres
    volumes:
      - ./backend:/src

  frontend:
    image: node:20-alpine
    container_name: taskflow-web
    working_dir: /app
    command: npm start
    environment:
      NODE_ENV: development
      API_URL: "http://localhost:5000"
    ports:
      - "4200:4200"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Environment Configuration

**Frontend `.env.development`:**
```bash
# API Configuration
VITE_API_URL=http://localhost:5000
VITE_API_TIMEOUT=30000

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG_LOGGING=true
```

**Frontend `.env.production`:**
```bash
# API Configuration
VITE_API_URL=https://api.taskflow.app
VITE_API_TIMEOUT=30000

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG_LOGGING=false
```

**Backend `.env` (Development):**
```bash
# Database
DATABASE_URL=Host=localhost;Database=taskflow_dev;Username=taskflow_user;Password=taskflow_pass

# JWT
JWT_SECRET_KEY=dev-secret-key-minimum-32-characters-long-for-hs256
JWT_ISSUER=TaskFlow.Api
JWT_AUDIENCE=TaskFlow.Web
JWT_EXPIRY_MINUTES=60
JWT_REFRESH_TOKEN_EXPIRY_DAYS=7

# CORS
FRONTEND_URL=http://localhost:4200

# Supabase Storage (if using)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_STORAGE_BUCKET=taskflow-attachments
```

**Backend Production (Fly.io Secrets):**
```bash
# Set via: fly secrets set NAME=value
DATABASE_URL=postgresql://user:pass@db.region.supabase.co:5432/postgres
JWT_SECRET_KEY=<generate-secure-key>
JWT_ISSUER=TaskFlow.Api
JWT_AUDIENCE=TaskFlow.Web
FRONTEND_URL=https://taskflow.vercel.app
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
```

### Development Workflow Integration

**Start All Services Locally:**
```powershell
# Start database, backend, and frontend
docker-compose up -d
```

**Start Frontend Only:**
```powershell
cd frontend
npm install
npm start
# Runs on http://localhost:4200
```

**Start Backend Only:**
```powershell
cd backend
dotnet restore
dotnet run --project TaskFlow.Api
# Runs on http://localhost:5000
```

**Run Database Migrations:**
```powershell
cd backend/TaskFlow.Api
dotnet ef database update
```

**Generate TypeScript Types from C# DTOs:**
```powershell
# Using NSwag or custom script
.\scripts\generate-types.ps1
```

This unified structure maintains ecosystem best practices while enabling efficient fullstack development.


---

## 14. Development Workflow

This section defines the complete development setup and workflow for local development, including prerequisites, initial setup, daily development commands, and debugging procedures.

### Prerequisites

Before starting development, ensure the following tools are installed:

**Required:**
```powershell
# Node.js 20 LTS
node --version  # Should output v20.x.x
npm --version   # Should output v10.x.x

# .NET 8 SDK
dotnet --version  # Should output 8.0.x

# PostgreSQL 15+ (or use Docker)
psql --version  # Should output 15.x or higher

# Docker Desktop (for containerized development)
docker --version
docker-compose --version

# Git
git --version
```

**Recommended:**
```powershell
# Visual Studio Code
code --version

# Angular CLI (global)
npm install -g @angular/cli@20

# Entity Framework Core CLI
dotnet tool install --global dotnet-ef

# PowerShell 7+ (if on Windows)
pwsh --version
```

**VS Code Extensions:**
- Angular Language Service
- C# Dev Kit
- ESLint
- Prettier
- Docker
- GitLens
- REST Client

### Initial Setup

#### 1. Clone Repository

```powershell
# Clone the repository
git clone https://github.com/your-org/taskflow.git
cd taskflow
```

#### 2. Frontend Setup

```powershell
cd frontend

# Install dependencies
npm install

# Copy environment template
Copy-Item .env.example .env.development

# Edit .env.development with your local settings
code .env.development

# Verify setup
npm run lint
npm test -- --watch=false
```

**Frontend `.env.development` Configuration:**
```bash
VITE_API_URL=http://localhost:5000
VITE_API_TIMEOUT=30000
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG_LOGGING=true
```

#### 3. Backend Setup

```powershell
cd ../backend

# Restore NuGet packages
dotnet restore

# Copy environment template
Copy-Item .env.example .env

# Edit .env with your local database connection
code .env

# Build solution
dotnet build

# Run tests
dotnet test
```

**Backend `.env` Configuration:**
```bash
DATABASE_URL=Host=localhost;Database=taskflow_dev;Username=taskflow_user;Password=taskflow_pass
JWT_SECRET_KEY=dev-secret-key-minimum-32-characters-long-for-hs256
JWT_ISSUER=TaskFlow.Api
JWT_AUDIENCE=TaskFlow.Web
JWT_EXPIRY_MINUTES=60
JWT_REFRESH_TOKEN_EXPIRY_DAYS=7
FRONTEND_URL=http://localhost:4200
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

#### 4. Database Setup

**Option A: Docker (Recommended)**

```powershell
# Start PostgreSQL container
docker-compose up -d postgres

# Wait for database to be ready
Start-Sleep -Seconds 5

# Run migrations
cd backend/TaskFlow.Api
dotnet ef database update

# Seed development data (optional)
dotnet run -- --seed
```

**Option B: Local PostgreSQL**

```powershell
# Create database and user
psql -U postgres

# In psql:
CREATE DATABASE taskflow_dev;
CREATE USER taskflow_user WITH PASSWORD 'taskflow_pass';
GRANT ALL PRIVILEGES ON DATABASE taskflow_dev TO taskflow_user;
\q

# Run migrations
cd backend/TaskFlow.Api
dotnet ef database update
```

#### 5. Verify Setup

```powershell
# Terminal 1: Start backend
cd backend
dotnet run --project TaskFlow.Api

# Terminal 2: Start frontend
cd frontend
npm start

# Terminal 3: Run tests
cd backend
dotnet watch test

# Terminal 4: Frontend tests
cd frontend
npm test
```

Open browser to:
- Frontend: http://localhost:4200
- Backend API: http://localhost:5000
- Swagger UI: http://localhost:5000/swagger

### Development Commands

#### Frontend Commands

```powershell
cd frontend

# Start development server
npm start                           # Runs on http://localhost:4200

# Build for production
npm run build                       # Output to dist/

# Build with production optimization
npm run build:prod

# Run unit tests
npm test                            # Runs in watch mode
npm test -- --watch=false           # Single run
npm test -- --code-coverage         # With coverage report

# Run linter
npm run lint                        # Check for issues
npm run lint:fix                    # Auto-fix issues

# Format code
npm run format                      # Prettier format all files
npm run format:check                # Check formatting

# Type checking
npm run type-check                  # TypeScript type checking

# Analyze bundle size
npm run analyze                     # Opens bundle analyzer

# Generate component
ng generate component features/tasks/task-summary --style=scss

# Generate service
ng generate service core/services/notification

# Update dependencies
npm outdated                        # Check for updates
npm update                          # Update within semver range
```

#### Backend Commands

```powershell
cd backend

# Start development server with hot reload
dotnet watch run --project TaskFlow.Api

# Build solution
dotnet build                        # Debug build
dotnet build -c Release             # Release build

# Run all tests
dotnet test                         # Run all tests
dotnet test --filter "FullyQualifiedName~TaskService"  # Specific tests
dotnet test --collect:"XPlat Code Coverage"  # With coverage

# Run specific test project
dotnet test TaskFlow.Tests/TaskFlow.Tests.csproj

# Entity Framework migrations
dotnet ef migrations add MigrationName --project TaskFlow.Infrastructure --startup-project TaskFlow.Api
dotnet ef database update --project TaskFlow.Api
dotnet ef migrations remove --project TaskFlow.Infrastructure --startup-project TaskFlow.Api
dotnet ef database drop --project TaskFlow.Api  # Careful!

# Clean solution
dotnet clean

# Restore packages
dotnet restore

# Format code
dotnet format                       # Format all code
dotnet format --verify-no-changes   # Check formatting

# Run API locally
dotnet run --project TaskFlow.Api --environment Development

# Generate API client (NSwag)
cd TaskFlow.Api
dotnet build
nswag run nswag.json
```

#### Docker Commands

```powershell
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d postgres
docker-compose up -d backend

# View logs
docker-compose logs -f              # All services
docker-compose logs -f backend      # Specific service

# Stop all services
docker-compose down

# Stop and remove volumes (data loss!)
docker-compose down -v

# Rebuild containers
docker-compose build
docker-compose up -d --build

# Execute command in container
docker-compose exec postgres psql -U taskflow_user -d taskflow_dev
docker-compose exec backend dotnet ef database update

# View running containers
docker-compose ps
```

#### Database Commands

```powershell
# Connect to database
psql -h localhost -U taskflow_user -d taskflow_dev

# Backup database
pg_dump -h localhost -U taskflow_user taskflow_dev > backup.sql

# Restore database
psql -h localhost -U taskflow_user taskflow_dev < backup.sql

# Run migration script
psql -h localhost -U taskflow_user -d taskflow_dev -f database/migrations/001_initial_schema.sql

# Run seed script
psql -h localhost -U taskflow_user -d taskflow_dev -f database/seeds/dev_seed_data.sql
```

#### Git Workflow Commands

```powershell
# Create feature branch
git checkout -b feature/task-filters

# Stage changes
git add .

# Commit with conventional format
git commit -m "feat(tasks): add advanced filtering options

Implements task filtering by status, priority, and date range.
Adds query parameter support to TasksController.

Closes #123"

# Push branch
git push origin feature/task-filters

# Create pull request (using GitHub CLI)
gh pr create --title "Add advanced task filtering" --body "Description here"

# Update branch with main
git checkout main
git pull origin main
git checkout feature/task-filters
git rebase main

# Squash commits
git rebase -i HEAD~3
```

### Daily Development Workflow

**Morning Startup:**

```powershell
# 1. Pull latest changes
git checkout main
git pull origin main

# 2. Update dependencies
cd frontend
npm install
cd ../backend
dotnet restore

# 3. Start services
docker-compose up -d

# 4. Run migrations
cd backend/TaskFlow.Api
dotnet ef database update

# 5. Start development servers
# Terminal 1:
cd backend
dotnet watch run --project TaskFlow.Api

# Terminal 2:
cd frontend
npm start
```

**Feature Development:**

```powershell
# 1. Create feature branch
git checkout -b feature/add-task-tags

# 2. Generate necessary files
cd frontend
ng generate component features/tasks/tag-selector --style=scss

cd ../backend
# Add TagDto.cs, update TaskDto.cs, etc.

# 3. Implement feature
# Write code...

# 4. Add tests
cd frontend
ng generate component features/tasks/tag-selector --skip-import
# Edit tag-selector.component.spec.ts

cd ../backend
# Add TagServiceTests.cs

# 5. Run tests continuously
# Terminal 3:
cd frontend
npm test

# Terminal 4:
cd backend
dotnet watch test

# 6. Commit incrementally
git add .
git commit -m "feat(tasks): add tag selector component"

git add .
git commit -m "test(tasks): add tag selector tests"
```

**Before Pushing:**

```powershell
# 1. Run linters
cd frontend
npm run lint:fix
npm run format

cd ../backend
dotnet format

# 2. Run all tests
cd frontend
npm test -- --watch=false --code-coverage

cd ../backend
dotnet test --collect:"XPlat Code Coverage"

# 3. Build production
cd frontend
npm run build:prod

cd ../backend
dotnet build -c Release

# 4. Push changes
git push origin feature/add-task-tags

# 5. Create pull request
gh pr create --web
```

### Debugging

#### Frontend Debugging (VS Code)

**launch.json:**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome against localhost",
      "url": "http://localhost:4200",
      "webRoot": "${workspaceFolder}/frontend/src",
      "sourceMapPathOverrides": {
        "webpack:/*": "${webRoot}/*"
      }
    },
    {
      "type": "chrome",
      "request": "attach",
      "name": "Attach to Chrome",
      "port": 9222,
      "webRoot": "${workspaceFolder}/frontend/src"
    }
  ]
}
```

**Browser DevTools:**
- Install Angular DevTools extension
- Use breakpoints in Sources tab
- Inspect component state with Angular DevTools
- Monitor network requests in Network tab

#### Backend Debugging (VS Code)

**launch.json:**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": ".NET Core Launch (web)",
      "type": "coreclr",
      "request": "launch",
      "preLaunchTask": "build",
      "program": "${workspaceFolder}/backend/TaskFlow.Api/bin/Debug/net8.0/TaskFlow.Api.dll",
      "args": [],
      "cwd": "${workspaceFolder}/backend/TaskFlow.Api",
      "stopAtEntry": false,
      "serverReadyAction": {
        "action": "openExternally",
        "pattern": "\\bNow listening on:\\s+(https?://\\S+)"
      },
      "env": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      },
      "sourceFileMap": {
        "/Views": "${workspaceFolder}/Views"
      }
    },
    {
      "name": ".NET Core Attach",
      "type": "coreclr",
      "request": "attach"
    }
  ]
}
```

**Debugging Steps:**
1. Set breakpoints in C# code
2. Press F5 to start debugging
3. Make API request from frontend or Swagger
4. Step through code with F10 (step over), F11 (step into)
5. Inspect variables in Debug Console

#### Database Debugging

```powershell
# Enable query logging in appsettings.Development.json
{
  "Logging": {
    "LogLevel": {
      "Microsoft.EntityFrameworkCore.Database.Command": "Information"
    }
  }
}

# View SQL queries in console
dotnet watch run --project TaskFlow.Api

# Use pgAdmin or DBeaver for visual query debugging
# Connection: localhost:5432, user: taskflow_user, db: taskflow_dev

# Analyze query performance
EXPLAIN ANALYZE SELECT * FROM tasks WHERE status = 'InProgress';

# View active queries
SELECT * FROM pg_stat_activity WHERE datname = 'taskflow_dev';
```

### Troubleshooting

**Common Issues:**

**Frontend won't start:**
```powershell
# Clear node_modules and reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install

# Clear Angular cache
Remove-Item -Recurse -Force .angular
```

**Backend won't start:**
```powershell
# Clear build artifacts
dotnet clean
Remove-Item -Recurse -Force */bin, */obj
dotnet restore
dotnet build
```

**Database connection fails:**
```powershell
# Check PostgreSQL is running
docker-compose ps

# Verify connection string in .env
# Check database exists
psql -h localhost -U taskflow_user -l

# Reset database
dotnet ef database drop --project TaskFlow.Api
dotnet ef database update --project TaskFlow.Api
```

**Port conflicts:**
```powershell
# Find process using port 4200 (frontend)
netstat -ano | findstr :4200
taskkill /PID <process_id> /F

# Find process using port 5000 (backend)
netstat -ano | findstr :5000
taskkill /PID <process_id> /F
```

**Migration conflicts:**
```powershell
# Revert last migration
cd backend/TaskFlow.Api
dotnet ef migrations remove --project ../TaskFlow.Infrastructure

# Reset database to specific migration
dotnet ef database update MigrationName --project TaskFlow.Api
```

**TypeScript errors:**
```powershell
cd frontend
# Clear TypeScript cache
Remove-Item -Recurse -Force node_modules/.cache
# Rebuild
npm run build
```

### Code Quality Checks

**Pre-commit Checks:**
```powershell
# Frontend quality checks
cd frontend
npm run lint
npm run format:check
npm run type-check
npm test -- --watch=false

# Backend quality checks
cd backend
dotnet format --verify-no-changes
dotnet build -warnaserror
dotnet test
```

**CI/CD Simulation:**
```powershell
# Simulate GitHub Actions locally
# Frontend
cd frontend
npm ci
npm run lint
npm test -- --watch=false --code-coverage
npm run build:prod

# Backend
cd backend
dotnet restore
dotnet build -c Release -warnaserror
dotnet test -c Release --collect:"XPlat Code Coverage"
```

### Performance Profiling

**Frontend:**
```powershell
# Build with source maps
npm run build:prod -- --source-map

# Lighthouse CI
npm install -g @lhci/cli
lhci autorun

# Bundle analyzer
npm run analyze
```

**Backend:**
```powershell
# Enable detailed logging
# appsettings.Development.json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft.EntityFrameworkCore": "Information"
    }
  }
}

# Use dotnet-trace for profiling
dotnet tool install --global dotnet-trace
dotnet trace collect --process-id <pid> --profile cpu-sampling
```

### Useful Scripts

Create these PowerShell scripts in `scripts/` directory:

**scripts/dev-setup.ps1:**
```powershell
# Complete development setup
Write-Host "Setting up TaskFlow development environment..." -ForegroundColor Green

# Frontend
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
cd frontend
npm install

# Backend
Write-Host "Restoring backend packages..." -ForegroundColor Yellow
cd ../backend
dotnet restore

# Database
Write-Host "Starting database..." -ForegroundColor Yellow
docker-compose up -d postgres
Start-Sleep -Seconds 5

# Migrations
Write-Host "Running migrations..." -ForegroundColor Yellow
cd TaskFlow.Api
dotnet ef database update

Write-Host "Setup complete! Run 'docker-compose up -d' to start all services." -ForegroundColor Green
```

**scripts/reset-dev-db.ps1:**
```powershell
# Reset development database
Write-Host "Resetting development database..." -ForegroundColor Yellow

cd backend/TaskFlow.Api
dotnet ef database drop --force
dotnet ef database update

Write-Host "Database reset complete!" -ForegroundColor Green
```

**scripts/run-all-tests.ps1:**
```powershell
# Run all tests
$ErrorActionPreference = "Stop"

Write-Host "Running frontend tests..." -ForegroundColor Yellow
cd frontend
npm test -- --watch=false --code-coverage

Write-Host "Running backend tests..." -ForegroundColor Yellow
cd ../backend
dotnet test --collect:"XPlat Code Coverage"

Write-Host "All tests passed!" -ForegroundColor Green
```

This development workflow enables efficient local development with clear commands and troubleshooting procedures.