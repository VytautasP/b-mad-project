# Epic 1: Foundation & Basic Task Management

**Epic Goal**: Establish the foundational technical infrastructure including authentication, database schema, and API framework, while simultaneously delivering a functional basic task management system. By the end of this epic, users can register, securely log in, create/edit/delete tasks with core fields (name, description, due date, priority, status), and have a deployed working application that provides immediate value as a simple but secure task tracker�validating the core technical stack before building advanced features.

## Story 1.1: Project Setup and Development Environment

**As a** developer,
**I want** a properly scaffolded Angular and .NET project with Git repository and basic CI/CD pipeline,
**so that** I have a solid foundation for rapid feature development with automated testing and deployment.

**Acceptance Criteria:**

1. Angular 17+ project created with Angular CLI, TypeScript strict mode enabled, and routing configured
2. .NET 8 Web API solution created with layered architecture (API, Services, Repositories, Data/Models projects or folders)
3. Git repository initialized with .gitignore files for both Angular and .NET
4. GitHub Actions workflow configured to run tests on pull request and build on merge to main
5. README.md includes setup instructions, tech stack documentation, and development commands
6. PostgreSQL connection configured with Entity Framework Core and initial migration created
7. CORS policy configured for localhost development and production domain placeholder
8. Angular environment files configured for local API endpoint and production API endpoint
9. Basic health check endpoint (/api/health) returns 200 OK to validate API is running
10. Angular serves successfully on localhost:4200 with placeholder "TaskFlow" landing page

## Story 1.2: User Registration and Authentication Backend

**As a** new user,
**I want** to register with email and password and securely log in,
**so that** I can access my personal task data with confidence that it's protected.

**Acceptance Criteria:**

1. User entity created in database with fields: Id (GUID), Email (unique, indexed), PasswordHash, Name, ProfileImageUrl (nullable), CreatedDate
2. Registration endpoint (POST /api/auth/register) accepts email, password, name and returns success/error
3. Password validation enforces minimum 8 characters, at least one uppercase, one lowercase, one number
4. Passwords hashed using bcrypt or ASP.NET Core Identity password hasher before storage
5. Login endpoint (POST /api/auth/login) accepts email/password and returns JWT bearer token on success
6. JWT token includes user ID, email, and expiration (24 hours from issue)
7. JWT secret key configured via environment variable (not hardcoded)
8. Authentication failures return appropriate HTTP status codes (400 for validation, 401 for invalid credentials)
9. Duplicate email registration returns 409 Conflict with clear error message
10. Unit tests cover password hashing, JWT generation, and validation logic
11. Integration tests validate registration and login flows with in-memory database

## Story 1.3: Authentication Frontend and Protected Routes

**As a** user,
**I want** a login and registration UI that securely stores my authentication token,
**so that** I can access the application and remain logged in across sessions.

**Acceptance Criteria:**

1. Registration page created with form fields: email, password, confirm password, name
2. Login page created with form fields: email, password, and "Remember Me" option
3. Form validation displays inline error messages for invalid inputs (email format, password strength, password mismatch)
4. Successful registration automatically logs user in and navigates to dashboard
5. Successful login stores JWT token in localStorage and navigates to dashboard
6. HTTP interceptor created to add Authorization: Bearer <token> header to all API requests
7. Auth guard created to protect routes requiring authentication (redirects to login if no token)
8. Auth service provides isAuthenticated(), getCurrentUser(), and logout() methods
9. Logout clears token from localStorage and navigates to login page
10. Navigation bar displays user name and logout button when authenticated
11. Token expiration handled gracefully�expired tokens redirect to login with "Session expired" message
12. Basic responsive styling applied to login/registration pages (mobile-friendly)

## Story 1.4: Core Task Data Model and API

**As a** developer,
**I want** a complete Task entity with database schema and CRUD API endpoints,
**so that** the frontend can create, read, update, and delete tasks with all core fields.

**Acceptance Criteria:**

1. Task entity created with fields: Id (GUID), Name (required, max 200 chars), Description (nullable, max 2000 chars), CreatedDate, DueDate (nullable), Priority (enum: Low/Medium/High/Critical), Status (enum: ToDo/InProgress/Blocked/Waiting/Done), Progress (0-100 int), Type (enum: Project/Milestone/Task), CreatedByUserId (foreign key), ParentTaskId (nullable, self-referencing FK�not fully utilized until Epic 2)
2. Database migration created for Task table with appropriate indexes (CreatedByUserId, Status, DueDate)
3. TaskService created with methods: CreateTask, GetTaskById, UpdateTask, DeleteTask, GetUserTasks
4. Repository pattern implemented for Task data access via EF Core
5. CRUD endpoints created: POST /api/tasks, GET /api/tasks/:id, PUT /api/tasks/:id, DELETE /api/tasks/:id, GET /api/tasks (list)
6. Authorization enforced�users can only access/modify their own tasks (CreatedByUserId matches authenticated user)
7. Task list endpoint supports basic filtering by status and sorting by CreatedDate (full filtering in Epic 3)
8. Task validation enforces required fields (Name cannot be empty)
9. Soft delete implemented (IsDeleted flag) to preserve data integrity (or hard delete acceptable for MVP)
10. Unit tests cover TaskService business logic
11. Integration tests validate all CRUD endpoints with authentication

## Story 1.5: Task Management Frontend - Create and List

**As a** user,
**I want** to create new tasks with a simple form and see all my tasks in a list,
**so that** I can start tracking my work immediately.

**Acceptance Criteria:**

1. Dashboard page created as default authenticated landing page showing user's tasks
2. "Create Task" button prominently displayed at top of dashboard
3. Task creation form includes fields: Name (required), Description (textarea), Due Date (date picker), Priority (dropdown), Status (dropdown), Type (dropdown)
4. Form validation prevents submission without required Name field
5. Successful task creation adds task to list without full page reload
6. Task list displays tasks in cards or table rows showing: Name, Due Date, Priority, Status, Type
7. Empty state displayed when user has no tasks ("Get started by creating your first task")
8. Loading spinner shown while fetching tasks from API
9. Error messages displayed for API failures (creation failed, load failed)
10. Tasks sorted by CreatedDate descending (newest first) by default
11. Basic responsive layout�works on mobile, tablet, and desktop
12. Created tasks immediately appear in list confirming successful save

## Story 1.6: Task Management Frontend - Edit and Delete

**As a** user,
**I want** to edit task details and delete tasks I no longer need,
**so that** I can keep my task list accurate and up-to-date.

**Acceptance Criteria:**

1. Edit button/icon added to each task in the list
2. Clicking edit opens task edit form (modal, slide-out panel, or inline edit)
3. Edit form pre-populated with current task values
4. All task fields editable (Name, Description, Due Date, Priority, Status, Type)
5. Save button updates task via API and refreshes list
6. Cancel button closes edit form without saving changes
7. Delete button/icon added to each task with confirmation prompt ("Are you sure?")
8. Confirmed deletion removes task from list immediately
9. Successful edit/delete shows brief success notification (toast/snackbar)
10. API errors during edit/delete display user-friendly error messages
11. Edit and delete actions restricted to task owner (frontend enforces, backend validates)
12. Keyboard shortcuts: Escape closes edit form, Enter saves (if focus in form)

## Story 1.7: Task Search and Basic Filtering

**As a** user,
**I want** to search my tasks by text and filter by status,
**so that** I can quickly find specific tasks in a growing list.

**Acceptance Criteria:**

1. Search box added to dashboard above task list with placeholder "Search tasks..."
2. Search functionality filters tasks by Name and Description containing search term (case-insensitive)
3. Search executes on keystroke with debounce (300ms delay) to avoid excessive API calls
4. Status filter dropdown added next to search box (options: All, To Do, In Progress, Blocked, Waiting, Done)
5. Selecting status filters task list to show only tasks with that status
6. Search and status filter work together (both criteria applied simultaneously)
7. Backend API endpoint supports query parameters: ?search=term&status=InProgress
8. Full-text search performed on backend via EF Core Contains() or SQL LIKE query
9. Search/filter state persists during session (user navigates away and back, filters remain)
10. Clear search button (X icon) resets search term
11. Task count displayed showing filtered results (e.g., "Showing 5 of 12 tasks")
12. Performance acceptable�search returns results in <500ms for 500 tasks

## Story 1.8: Deployment Pipeline and Production Environment

**As a** developer,
**I want** automated deployment to production hosting with complete CI/CD pipeline,
**so that** users can access the live application and I can iterate quickly with confidence.

**Prerequisites:**
- Story 0.1 completed (Supabase, Fly.io, Vercel accounts created)
- All GitHub secrets configured per Story 0.1
- Backend project created and Dockerfile exists (Story 1.1)

---

### Acceptance Criteria

#### Frontend Deployment (Vercel)

1. **Angular Production Build Configuration:**
   - Production environment file (`src/environments/environment.prod.ts`) configured with production API URL
   - Build optimization enabled (minification, tree-shaking, lazy loading)
   - Source maps generated for production debugging (`sourceMap: true` in angular.json)
   - Bundle budget limits enforced (<2MB initial bundle per NFR1)

2. **Vercel Project Setup:**
   - Run `vercel` command in project root to import project
   - Framework preset automatically detected as Angular
   - Build command: `npm run build` (or `ng build`)
   - Output directory: `dist/b-mad-project/browser` (verify actual Angular build output path)
   - Install command: `npm install`
   - Root directory: `./` (monorepo root)

3. **Vercel Configuration File:**
   - Create `vercel.json` in project root with configuration:
     ```json
     {
       "version": 2,
       "framework": "angular",
       "buildCommand": "npm run build",
       "outputDirectory": "dist/b-mad-project/browser",
       "routes": [
         {
           "src": "/api/(.*)",
           "dest": "https://taskflow-api.fly.dev/api/$1"
         },
         {
           "handle": "filesystem"
         },
         {
           "src": "/(.*)",
           "dest": "/index.html"
         }
       ],
       "headers": [
         {
           "source": "/(.*)",
           "headers": [
             {
               "key": "X-Content-Type-Options",
               "value": "nosniff"
             },
             {
               "key": "X-Frame-Options",
               "value": "DENY"
             },
             {
               "key": "X-XSS-Protection",
               "value": "1; mode=block"
             }
           ]
         }
       ]
     }
     ```

4. **Environment Variables in Vercel:**
   - Navigate to Vercel project settings > Environment Variables
   - Add `API_URL` = `https://taskflow-api.fly.dev` (production backend URL)
   - Add `ENVIRONMENT` = `production`
   - Update Angular environment file to use these at build time

5. **Automatic Deployments:**
   - Vercel automatically deploys on push to `main` branch (production)
   - Vercel creates preview deployments for pull requests
   - Deployment status visible in GitHub PR checks

6. **Custom Domain (Optional for MVP):**
   - Skip custom domain for MVP (use Vercel-provided URL: `taskflow.vercel.app`)
   - Document process for adding custom domain post-MVP

---

#### Backend Deployment (Fly.io)

7. **Dockerfile Validation:**
   - `Dockerfile` exists in project root (created in Story 1.1 or earlier)
   - Dockerfile uses multi-stage build (build -> publish -> runtime)
   - Final image based on `mcr.microsoft.com/dotnet/aspnet:8.0-alpine`
   - Health check endpoint configured in Dockerfile
   - Non-root user configured for security

8. **Fly.io Application Launch:**
   - Run `fly launch --no-deploy` from project root
   - Select app name: `taskflow-api` (or unique name if taken)
   - Choose region: `iad` (US East - Ashburn, closest to Supabase us-east-1)
   - **Decline** Fly.io PostgreSQL setup (using Supabase instead)
   - **Decline** Fly.io Redis setup (not needed for MVP)
   - Command generates `fly.toml` configuration file (already exists in repo)

9. **Fly.io Secrets Configuration:**
   - Set all secrets via CLI (never commit to fly.toml):
     ```bash
     fly secrets set ConnectionStrings__DefaultConnection="Host=db.[PROJECT-REF].supabase.co;Port=5432;Database=postgres;Username=postgres;Password=[PASSWORD];Pooling=true;Minimum Pool Size=0;Maximum Pool Size=10"
     fly secrets set JwtSettings__SecretKey="[64-CHAR-SECRET-FROM-GITHUB]"
     fly secrets set JwtSettings__Issuer="TaskFlow"
     fly secrets set JwtSettings__Audience="TaskFlow"
     fly secrets set JwtSettings__ExpirationMinutes="1440"
     fly secrets set CorsSettings__AllowedOrigins="https://taskflow.vercel.app"
     ```
   - Verify secrets: `fly secrets list` (shows names only, not values)

10. **Initial Deployment:**
    - Run `fly deploy` to build and deploy Docker image
    - Fly.io builds image from Dockerfile and deploys to selected region
    - Deployment takes 3-5 minutes (includes image build and health checks)
    - Verify deployment: `fly status` (should show "deployed" status)

11. **Database Migrations:**
    - After first deployment, run migrations via SSH:
      ```bash
      fly ssh console
      # Inside container:
      dotnet ef database update --project TaskFlow.Infrastructure --startup-project TaskFlow.Api
      # Or if using runtime migrations:
      dotnet TaskFlow.Api.dll -- migrate
      ```
    - Alternative: Run migrations from local machine pointing to Supabase production database (less preferred)

12. **SSL Certificate and HTTPS:**
    - Fly.io automatically provisions Let's Encrypt SSL certificate
    - HTTPS enforced via `force_https = true` in fly.toml
    - Certificate auto-renews (no manual intervention)
    - Verify: `curl https://taskflow-api.fly.dev/api/health` returns 200 OK

---

#### GitHub Actions CI/CD Pipeline

13. **GitHub Actions Workflow File:**
    - Create `.github/workflows/deploy.yml`:
      ```yaml
      name: Deploy TaskFlow

      on:
        push:
          branches: [main]
        pull_request:
          branches: [main]

      jobs:
        # Frontend Tests and Build
        frontend:
          runs-on: ubuntu-latest
          steps:
            - uses: actions/checkout@v4
            
            - name: Setup Node.js
              uses: actions/setup-node@v4
              with:
                node-version: '20'
                cache: 'npm'
            
            - name: Install dependencies
              run: npm ci
            
            - name: Run linter
              run: npm run lint || true
            
            - name: Run tests
              run: npm run test -- --watch=false --browsers=ChromeHeadless
            
            - name: Build production
              run: npm run build
              env:
                API_URL: https://taskflow-api.fly.dev

        # Backend Tests and Build
        backend:
          runs-on: ubuntu-latest
          steps:
            - uses: actions/checkout@v4
            
            - name: Setup .NET
              uses: actions/setup-dotnet@v4
              with:
                dotnet-version: '8.0.x'
            
            - name: Restore dependencies
              run: dotnet restore backend/TaskFlow.Api/TaskFlow.Api.csproj
            
            - name: Build
              run: dotnet build backend/TaskFlow.Api/TaskFlow.Api.csproj --configuration Release --no-restore
            
            - name: Run tests
              run: dotnet test backend/TaskFlow.Tests/TaskFlow.Tests.csproj --no-restore --verbosity normal

        # Deploy to Vercel (Frontend)
        deploy-frontend:
          needs: [frontend, backend]
          runs-on: ubuntu-latest
          if: github.ref == 'refs/heads/main'
          steps:
            - uses: actions/checkout@v4
            
            - name: Deploy to Vercel
              uses: amondnet/vercel-action@v25
              with:
                vercel-token: ${{ secrets.VERCEL_TOKEN }}
                vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
                vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
                vercel-args: '--prod'

        # Deploy to Fly.io (Backend)
        deploy-backend:
          needs: [frontend, backend]
          runs-on: ubuntu-latest
          if: github.ref == 'refs/heads/main'
          steps:
            - uses: actions/checkout@v4
            
            - name: Setup Fly.io CLI
              uses: superfly/flyctl-actions/setup-flyctl@master
            
            - name: Deploy to Fly.io
              run: flyctl deploy --remote-only
              env:
                FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
      ```

14. **Workflow Validation:**
    - Push to non-main branch triggers tests only (no deployment)
    - Push to main branch triggers tests + deployment to production
    - Failed tests block deployment (needs: [frontend, backend])
    - Deployment status visible in GitHub commits and PR checks

---

#### Production Configuration

15. **CORS Configuration:**
    - Backend CORS middleware allows only `https://taskflow.vercel.app` (production frontend)
    - Localhost origins removed in production appsettings.json
    - Preflight requests handled correctly for Angular HttpClient

16. **Health Check Endpoint:**
    - `/api/health` endpoint returns 200 OK with JSON: `{ "status": "healthy", "timestamp": "..." }`
    - Health check validates database connection (Supabase reachable)
    - Fly.io monitors health check every 30 seconds (configured in fly.toml)
    - Unhealthy instances automatically restarted by Fly.io

17. **Logging and Monitoring:**
    - Serilog configured to write structured JSON logs to console
    - Fly.io captures stdout/stderr automatically
    - View logs: `fly logs` or Fly.io dashboard
    - Log levels: Information for production, Debug for development
    - Error logs include stack traces for debugging

18. **Environment Variables Summary:**
    - Frontend (Vercel): `API_URL`, `ENVIRONMENT`
    - Backend (Fly.io): All secrets set via `fly secrets set` (Story 0.1)
    - No secrets in code, fly.toml, or vercel.json

---

#### Validation and Testing

19. **Production URLs:**
    - Frontend: `https://taskflow.vercel.app` (or assigned Vercel URL)
    - Backend API: `https://taskflow-api.fly.dev`
    - Health check: `https://taskflow-api.fly.dev/api/health`
    - Swagger docs: `https://taskflow-api.fly.dev/swagger` (consider disabling in production)

20. **End-to-End Production Testing:**
    - Open frontend production URL in browser
    - Register new user account (test authentication flow)
    - Login with registered user (verify JWT token flow)
    - Create new task (test full-stack POST request)
    - Edit task (test PUT request)
    - Delete task (test DELETE request)
    - Search tasks (test GET with query parameters)
    - Verify all actions work without CORS errors
    - Test on mobile device (responsive design validation)

21. **Performance Validation:**
    - Initial page load completes in <3 seconds (NFR1) - test with Chrome DevTools Network throttling (Fast 3G)
    - API response times <500ms for task list (NFR2)
    - No console errors in browser developer tools
    - Lighthouse score >90 for Performance, Accessibility, Best Practices

22. **Security Validation:**
    - All URLs use HTTPS (NFR8)
    - Security headers present in responses (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)
    - JWT tokens expire after 24 hours (NFR9)
    - Passwords not visible in network requests (hashed on backend)
    - API returns 401 Unauthorized for invalid/expired tokens

---

#### Documentation

23. **Deployment Documentation:**
    - README.md updated with production URLs
    - Deployment process documented (GitHub Actions workflow)
    - Manual deployment steps documented (fly deploy, vercel deploy)
    - Rollback procedure documented (fly releases, vercel rollback)

24. **Monitoring Setup:**
    - Fly.io dashboard bookmarked for metrics monitoring
    - Vercel dashboard bookmarked for deployment status
    - Supabase dashboard bookmarked for database monitoring
    - Alert thresholds noted (approaching free tier limits)

---

### Success Criteria

- ✅ Frontend deployed to Vercel with automatic HTTPS
- ✅ Backend deployed to Fly.io with automatic HTTPS and health checks
- ✅ GitHub Actions workflow deploys both frontend and backend on merge to main
- ✅ Production database (Supabase) accessible from backend
- ✅ CORS configured correctly (frontend can call backend API)
- ✅ End-to-end user journey works in production (register → login → create task → delete task)
- ✅ Performance meets NFR1-2 requirements (<3s page load, <500ms API responses)
- ✅ Security requirements met (HTTPS everywhere, JWT auth, no exposed secrets)
- ✅ Monitoring and logging operational (can view logs in Fly.io dashboard)
- ✅ Deployment is repeatable (push to main → automatic deployment)

---

### Common Issues and Troubleshooting

**Issue: CORS errors in browser console**
- **Solution:** Verify `CorsSettings__AllowedOrigins` secret in Fly.io matches exact Vercel URL (including https://)

**Issue: Fly.io deployment fails with "Dockerfile not found"**
- **Solution:** Ensure Dockerfile exists in project root, not in backend/ subdirectory

**Issue: Database connection fails in production**
- **Solution:** Verify Supabase connection string uses pooling mode and correct project reference

**Issue: GitHub Actions workflow fails on deployment step**
- **Solution:** Verify all GitHub secrets are set correctly (VERCEL_TOKEN, FLY_API_TOKEN, etc.)

**Issue: Vercel build fails with "Module not found"**
- **Solution:** Verify all dependencies in package.json, run `npm install` locally to test

**Issue: Backend health check failing**
- **Solution:** Check Fly.io logs with `fly logs`, verify database connection, ensure port 8080 exposed

---

### Rollback Procedures

**Frontend Rollback (Vercel):**
```bash
# View deployments
vercel ls

# Promote previous deployment to production
vercel promote [DEPLOYMENT-URL]
```

**Backend Rollback (Fly.io):**
```bash
# View releases
fly releases

# Rollback to previous version
fly releases rollback
```

---
