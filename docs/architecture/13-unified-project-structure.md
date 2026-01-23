# 13. Unified Project Structure

This section defines the complete repository structure for TaskFlow, showing both the Angular frontend workspace and the ASP.NET Core backend solution. The hybrid approach respects each ecosystem's conventions while maintaining clear organization.

## Complete Repository Structure

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
│   ├── TaskFlow.Abstractions/               # Shared abstractions (no dependencies)
│   │   ├── Entities/
│   │   │   ├── User.cs
│   │   │   ├── Task.cs
│   │   │   ├── TimeEntry.cs
│   │   │   ├── Comment.cs
│   │   │   ├── TaskAssignee.cs
│   │   │   └── ActivityLog.cs
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
│   │   │   ├── Comments/
│   │   │   │   ├── CommentCreateDto.cs
│   │   │   │   └── CommentResponseDto.cs
│   │   │   └── Shared/
│   │   │       ├── PaginationDto.cs
│   │   │       └── ErrorResponseDto.cs
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
│   │   ├── Exceptions/
│   │   │   ├── NotFoundException.cs
│   │   │   ├── ValidationException.cs
│   │   │   └── UnauthorizedException.cs
│   │   ├── Constants/
│   │   │   ├── TaskStatus.cs
│   │   │   ├── TaskPriority.cs
│   │   │   └── ActivityType.cs
│   │   └── TaskFlow.Abstractions.csproj
│   │
│   ├── TaskFlow.Core/                       # Business logic layer
│   │   ├── Services/
│   │   │   ├── AuthService.cs
│   │   │   ├── TaskService.cs
│   │   │   ├── TimeTrackingService.cs
│   │   │   └── ActivityLogService.cs
│   │   ├── Validators/
│   │   │   └── TaskValidator.cs
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

## Key Directory Explanations

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

## Repository Organization Rationale

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

## Docker Compose for Local Development

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

## Environment Configuration

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

## Development Workflow Integration

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
