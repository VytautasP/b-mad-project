# 12. Coding Standards

This section defines critical coding standards for AI agents and developers working on TaskFlow. These are **minimal but essential** rules that prevent common mistakes and ensure consistency across the fullstack codebase.

## Critical Fullstack Rules

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

## Naming Conventions

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

## File Organization Standards

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

## Code Quality Rules

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

## Comment Standards

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

## Git Commit Standards

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

## Testing Standards

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

## Performance Standards

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

## Security Standards

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

## Accessibility Standards

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
