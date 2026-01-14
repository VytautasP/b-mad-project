# TaskFlow Product Requirements Document (PRD)

## Goals and Background Context

### Goals

- Deliver a lightweight, hierarchical task management system that serves freelancers and small teams without enterprise tool complexity
- Enable integrated time tracking as a first-class feature, eliminating the need for separate time tracking tools
- Provide unlimited task nesting through recursive hierarchy to support projects of any complexity
- Create an intuitive interface requiring <5 minutes for new users to create their first task and start tracking time
- Build a freemium SaaS model with clear upgrade paths from solo use to team collaboration
- Achieve 1,000 active users within 6 months with 15% free-to-paid conversion

### Background Context

The task management tool market presents users with an impossible choice: sacrifice professionalism with oversimplified to-do lists or drown in the complexity of enterprise platforms like Jira, Monday.com, and Asana. Freelancers managing multiple client projects and small teams (3-7 people) need professional-grade capabilities�particularly time tracking for billing and task hierarchy for project organization�without spending hours on tool configuration and training.

TaskFlow addresses this gap through architectural elegance: a single recursive Task entity replaces rigid "project/epic/story/task" hierarchies, and built-in time tracking eliminates tool fragmentation. The MVP focuses on Freelance Sarah (independent consultant billing hourly) and Team Lead Marcus (managing small teams) personas, delivering essential functionality with progressive disclosure�solo features work immediately, team capabilities activate when collaborators are invited.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-01-13 | v1.0 | Initial PRD creation from Project Brief | John (PM) |

---

## Requirements

### Functional Requirements

- **FR1:** User registration and authentication with email/password using JWT bearer tokens
- **FR2:** User profile management (name, email, profile image) with secure login/logout flow
- **FR3:** Create, read, update, and delete tasks with core fields: Name (required), Description, Created Date, Due Date, Priority (Low/Medium/High/Critical), Status, Progress (0-100%), Type (Project/Milestone/Task), Assignees, Logged Time
- **FR4:** Full-text search across all task fields
- **FR5:** Unlimited parent-child task nesting via self-referencing ParentTaskId relationship
- **FR6:** Automatic parent task progress calculation from children's weighted averages
- **FR7:** Visual tree rendering of task hierarchy in UI with drag-and-drop reparenting capability
- **FR8:** Multi-user task assignment system supporting assignment of tasks to multiple users simultaneously
- **FR9:** Filter tasks by assignee with personalized "My Tasks" view
- **FR10:** Start/stop timer with pause capability for active time tracking (browser-based)
- **FR11:** Manual time entry with hours/minutes and optional notes
- **FR12:** TimeEntry log per task with user attribution and timestamp
- **FR13:** Automatic time aggregation and rollup to parent tasks in hierarchy
- **FR14:** Sortable list view by name, due date, priority, status, assignee, and logged time
- **FR15:** Multi-criteria filtering in list view (assignee, status, priority, due date range, task type)
- **FR16:** Pagination support for list view performance (500+ tasks)
- **FR17:** Inline quick actions in list view (edit, delete, start timer)
- **FR18:** Timeline/Gantt view with visual date-based task rendering
- **FR19:** Drag-to-adjust due dates in Gantt view
- **FR20:** Gantt view zoom levels (day/week/month) with color-coding by status or priority
- **FR21:** Comment threads on tasks with user mentions (@username)
- **FR22:** Activity log tracking task creation, status changes, time logged, and other key events
- **FR23:** Comment edit/delete with author permissions
- **FR24:** Enhanced status workflow: To Do ? In Progress ? Blocked ? Waiting ? Done
- **FR25:** Status-specific UI indicators (colors, icons) with filter by status capability

### Non-Functional Requirements

- **NFR1:** Initial page load must complete in <3 seconds on 4G connection
- **NFR2:** List view rendering must complete in <500ms for 500 tasks
- **NFR3:** Gantt view rendering must complete in <2 seconds for 100 tasks
- **NFR4:** Time tracking timer must maintain precision to the second with <100ms UI update latency
- **NFR5:** Application must support Chrome 100+, Firefox 100+, Safari 15+, Edge 100+
- **NFR6:** Responsive design must support mobile browsers (iOS Safari, Chrome Android)
- **NFR7:** Progressive Web App (PWA) capabilities for add-to-home-screen experience
- **NFR8:** System must enforce HTTPS everywhere with no unencrypted connections
- **NFR9:** JWT tokens must include expiration with refresh token pattern for security
- **NFR10:** Passwords must be hashed using bcrypt or ASP.NET Core Identity standards
- **NFR11:** SQL injection prevention via parameterized queries (Entity Framework Core)
- **NFR12:** XSS protection via Angular's built-in sanitization
- **NFR13:** CSRF tokens required for all state-changing operations
- **NFR14:** API rate limiting to prevent abuse
- **NFR15:** Recursive hierarchy must support at least 10 nesting levels without UI/performance degradation
- **NFR16:** System must maintain <1% error rate in production
- **NFR17:** System must achieve 99.5% uptime over 30-day periods
- **NFR18:** Application must fit within Firebase free tier limits (10GB storage, 50K reads/day, 20K writes/day)
- **NFR19:** Database must support recursive Common Table Expressions (CTEs) for hierarchy queries
- **NFR20:** All dependencies must use open-source licenses (MIT, Apache 2.0) with zero budget constraint

---

## User Interface Design Goals

### Overall UX Vision

TaskFlow embraces a **clean, minimalist interface** that prioritizes content over chrome. The design philosophy is "invisible UI"�users focus on their tasks, not learning the tool. The application uses a **left-sidebar navigation pattern** (similar to Linear or Notion) with primary views accessible via single clicks. The color palette emphasizes **neutral grays with accent colors for status indicators**, avoiding the visual noise of overly colorful dashboards. Every screen supports **keyboard shortcuts for power users** while remaining fully mouse-navigable for casual users. The interface scales from solo freelancer simplicity to team collaboration without requiring UI restructuring�team features progressively disclose as users invite collaborators.

### Key Interaction Paradigms

- **Inline editing everywhere**: Click any field to edit in-place without modal dialogs (task names, descriptions, due dates, status)
- **Contextual actions**: Right-click or hover menus for task operations (assign, move, delete, start timer)
- **Drag-and-drop fluidity**: Reparent tasks in tree view, adjust dates in Gantt view, reorder priorities in list view�all via natural drag gestures
- **Real-time visual feedback**: Timer shows live elapsed time, progress bars update instantly, status changes animate smoothly
- **Search-first discovery**: Global search bar (Cmd/Ctrl+K) for instant task finding without navigating hierarchies
- **Persistent state**: Views remember filter/sort preferences per user, last active view restores on login

### Core Screens and Views

- **Login/Registration Screen**: Simple email/password form with minimal friction
- **My Tasks Dashboard**: Default landing page showing user's assigned tasks across all projects
- **Project List View**: Primary workhorse�sortable/filterable table of tasks with inline actions
- **Task Detail Panel**: Slide-out panel (not separate page) showing full task details, comments, time log, activity history
- **Timeline/Gantt View**: Date-based visual planning interface with drag-to-adjust dates
- **Hierarchy Tree View**: Expandable/collapsible tree visualization of parent-child relationships
- **User Profile Settings**: Basic profile editing, password change, notification preferences (post-MVP)

### Accessibility

**Target Level**: WCAG AA compliance

- Keyboard navigation for all interactive elements (Tab, Enter, Escape, Arrow keys)
- Screen reader support with proper ARIA labels and semantic HTML
- Color contrast ratios meeting WCAG AA standards (4.5:1 for normal text)
- Focus indicators visible for keyboard navigation
- Form validation errors announced to assistive technologies

### Branding

**Style Guide**: Material Design 3 or PrimeNG default theming (zero-budget constraint)

- **Color Palette**: Neutral grays (#F5F5F5 background, #333 text) with status accent colors (green=Done, yellow=In Progress, red=Blocked, blue=Waiting)
- **Typography**: System font stack (San Francisco on macOS, Segoe UI on Windows, Roboto on Android) for performance and native feel
- **Iconography**: Material Icons or PrimeNG icon set for consistency
- **Logo**: Simple text-based logo "TaskFlow" with subtle icon (no custom branding budget)
- **Tone**: Professional but approachable�this is a tool for getting work done, not a playful consumer app

### Target Device and Platforms

**Primary**: Web Responsive (desktop-first, mobile-optimized)

- **Desktop browsers** (Chrome, Firefox, Safari, Edge on Windows/macOS): Primary usage context�users managing complex task hierarchies and timelines
- **Tablet browsers** (iPad Safari, Android tablets): List view and task detail fully functional, Gantt view usable but not optimized
- **Mobile browsers** (iPhone Safari, Chrome Android): Simplified mobile-first layouts for quick task capture, timer start/stop, and task completion�full Gantt view hidden or read-only on mobile

**Progressive Web App (PWA)** capabilities for add-to-home-screen and offline task viewing (post-MVP full offline sync).

**Explicitly out of scope**: Native iOS/Android apps (post-MVP v2.0+ expansion)

---

## Technical Assumptions

### Repository Structure: Monorepo

**Structure**: Single Git repository containing both Angular frontend and .NET backend projects as separate folders

**Rationale**: Simplifies version control coordination between frontend and backend changes, enables atomic commits affecting both layers, reduces overhead of managing multiple repos for solo developer. Independent deployment pipelines can still be configured despite shared repository. Shared TypeScript/C# contract models for API DTOs can live in /shared folder for type safety across the stack.

### Service Architecture

**Architecture**: Monolithic .NET 8+ Web API with layered service pattern

**Components**:
- **API Layer**: RESTful endpoints with resource-based routing (/api/tasks, /api/users, /api/timeentries, /api/comments)
- **Service Layer**: Business logic encapsulation (TaskService, UserService, TimeTrackingService, CommentService)
- **Repository Layer**: Data access abstraction via Entity Framework Core with repository pattern
- **Database**: SQL Server or PostgreSQL via EF Core ORM with migrations

**Rationale**: Monolithic architecture avoids microservices complexity for MVP�no need for inter-service communication, distributed transactions, or service discovery. Single deployment unit simplifies CI/CD and debugging. Service layer pattern provides clear separation of concerns while maintaining simplicity. Entity Framework Core handles SQL injection prevention and provides cross-database portability (SQL Server ? PostgreSQL).

### Testing Requirements

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

### Additional Technical Assumptions and Requests

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

## Epic List

### Epic 1: Foundation & Basic Task Management

**Goal**: Establish project infrastructure (authentication, database, API foundation) while delivering a functional task tracking system where users can register, create tasks, set priorities and statuses, and mark work complete�providing immediate value as a simple but working to-do system.

### Epic 2: Task Organization & Time Tracking

**Goal**: Enable professional project management through unlimited task hierarchy for organizing work into projects/milestones, multi-user assignment for team collaboration, and integrated time tracking (timer + manual entry) with automatic parent rollup�transforming the simple to-do list into a billable hours tracking and project organization tool.

### Epic 3: Advanced Views & Team Collaboration

**Goal**: Complete the professional task management experience by adding multiple data visualization methods (sortable/filterable list view and visual Gantt timeline) and team collaboration features (comments, mentions, activity log) that enable teams to coordinate work and stakeholders to track progress without requiring status meetings.

---

## Epic 1: Foundation & Basic Task Management

**Epic Goal**: Establish the foundational technical infrastructure including authentication, database schema, and API framework, while simultaneously delivering a functional basic task management system. By the end of this epic, users can register, securely log in, create/edit/delete tasks with core fields (name, description, due date, priority, status), and have a deployed working application that provides immediate value as a simple but secure task tracker�validating the core technical stack before building advanced features.

### Story 1.1: Project Setup and Development Environment

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

### Story 1.2: User Registration and Authentication Backend

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

### Story 1.3: Authentication Frontend and Protected Routes

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

### Story 1.4: Core Task Data Model and API

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

### Story 1.5: Task Management Frontend - Create and List

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

### Story 1.6: Task Management Frontend - Edit and Delete

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

### Story 1.7: Task Search and Basic Filtering

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

### Story 1.8: Deployment Pipeline and Production Environment

**As a** developer,
**I want** automated deployment to production hosting,
**so that** users can access the live application and I can iterate quickly.

**Acceptance Criteria:**

1. Angular production build configured with optimization, minification, and environment variables
2. Frontend deployed to Firebase Hosting or Netlify (free tier) with HTTPS enabled
3. Backend .NET API deployed to hosting provider (Azure App Service free tier, DigitalOcean, or self-hosted)
4. PostgreSQL database provisioned on ElephantSQL or Supabase (free tier)
5. Production environment variables configured (JWT secret, database connection string, CORS origin)
6. GitHub Actions workflow deploys frontend automatically on merge to main branch
7. Backend deployment process documented (automated or manual script)
8. Production API accessible via HTTPS with valid SSL certificate (Let's Encrypt if self-hosted)
9. CORS configured to allow only production frontend domain
10. Health check endpoint accessible at production URL
11. Basic monitoring/logging configured to capture errors (Application Insights free tier or console logging)
12. Production application end-to-end tested: register, login, create task, edit task, delete task, search tasks

---

## Epic 2: Task Organization & Time Tracking

**Epic Goal**: Transform the basic task tracker into a professional project management tool by implementing unlimited task hierarchy (parent-child nesting with visual tree rendering and drag-and-drop reorganization), multi-user assignment capabilities for team collaboration, and comprehensive time tracking with both active timers and manual entry. By the end of this epic, freelancers can organize client work into project hierarchies, track billable hours with precision, and teams can assign work to multiple members while automatically rolling up time investment to parent tasks�delivering TaskFlow's core competitive differentiators.

### Story 2.1: Recursive Hierarchy Backend Support

**As a** user,
**I want** the backend to support parent-child task relationships with unlimited nesting,
**so that** I can organize tasks into projects, milestones, and subtasks hierarchically.

**Acceptance Criteria:**

1. ParentTaskId foreign key relationship enforced in database (self-referencing Task.Id)
2. TaskService methods updated to support parent assignment: SetParentTask(taskId, parentTaskId), RemoveParent(taskId)
3. Recursive query implemented using Common Table Expression (CTE) to fetch task hierarchy with depth calculation
4. API endpoint created: GET /api/tasks/:id/children returns immediate children of a task
5. API endpoint created: GET /api/tasks/:id/ancestors returns parent chain up to root
6. API endpoint created: GET /api/tasks/:id/descendants returns full subtree using recursive CTE
7. Validation prevents circular references (task cannot be its own ancestor)
8. Validation prevents setting a descendant as parent (would create cycle)
9. Hierarchy depth limit enforced at 15 levels to prevent performance issues
10. Task list endpoint (GET /api/tasks) includes ParentTaskId and HasChildren fields
11. Unit tests cover circular reference detection and depth limit enforcement
12. Integration tests validate hierarchy queries with nested test data (3+ levels deep)

### Story 2.2: Task Tree Visualization

**As a** user,
**I want** to view my tasks in an expandable tree structure,
**so that** I can see project organization and navigate hierarchies visually.

**Acceptance Criteria:**

1. Tree view component created using Angular tree library (@circlon/angular-tree-component or Angular Material Tree)
2. Tree view displays tasks hierarchically with expand/collapse icons for parent tasks
3. Tree nodes show task Name, Status icon, and Priority indicator
4. Root tasks (no parent) displayed at top level, children indented beneath parents
5. Expand/collapse state persists per user session (expanded nodes remain expanded on navigation)
6. Clicking task name in tree opens task detail panel (slide-out or modal)
7. Visual indicators distinguish task types: Projects (folder icon), Milestones (flag icon), Tasks (checkbox icon)
8. Tree view toggle button added to dashboard to switch between tree view and list view
9. Tree loads hierarchical data efficiently (single API call fetching full tree, not lazy-loaded for MVP)
10. Deep hierarchies (5+ levels) render with appropriate indentation without UI breaking
11. Empty tree state displayed when user has no tasks
12. Tree view responsive�works on desktop (primary) and collapses/simplifies on mobile

### Story 2.3: Drag-and-Drop Task Reparenting

**As a** user,
**I want** to drag tasks in the tree view to change their parent,
**so that** I can reorganize my project structure easily.

**Acceptance Criteria:**

1. Drag-and-drop functionality enabled on tree view nodes using Angular CDK Drag-Drop or tree library's built-in support
2. Dragging task shows visual feedback (ghost image, drop zones highlighted)
3. Dropping task on valid parent updates ParentTaskId via API PUT /api/tasks/:id/parent
4. Dropping task on root area (not on another task) removes parent (sets ParentTaskId to null)
5. Invalid drop targets prevented (cannot drop task on itself or its descendants)
6. Visual indicators show valid vs. invalid drop zones during drag
7. Successful reparenting updates tree view immediately without full page reload
8. API validation prevents circular references and enforces depth limit during reparenting
9. Error messages displayed for invalid reparenting attempts ("Cannot move task under its own child")
10. Undo toast notification displayed after reparenting with "Undo" action (optional enhancement)
11. Drag-and-drop works smoothly without lag for trees with 50+ tasks
12. Mobile users have alternative method to reparent tasks (edit form with parent selector dropdown)

### Story 2.4: Multi-Assignment Backend System

**As a** team lead,
**I want** to assign tasks to multiple team members simultaneously,
**so that** I can reflect shared responsibility and collaborative work.

**Acceptance Criteria:**

1. TaskAssignment entity created with fields: TaskId (FK), UserId (FK), AssignedDate, AssignedByUserId (FK�who made the assignment)
2. Many-to-many relationship configured between Task and User via TaskAssignment junction table
3. Database migration created for TaskAssignment table with composite primary key (TaskId, UserId)
4. TaskService methods created: AssignUser(taskId, userId), UnassignUser(taskId, userId), GetTaskAssignees(taskId)
5. API endpoint created: POST /api/tasks/:id/assignments accepts userId to assign
6. API endpoint created: DELETE /api/tasks/:id/assignments/:userId to remove assignment
7. API endpoint created: GET /api/tasks/:id/assignments returns list of assigned users with names
8. Task list endpoint updated to include assignee information (array of assigned user objects)
9. Authorization enforced�only task owner or existing assignees can modify assignments
10. Validation prevents assigning non-existent users
11. "My Tasks" filter updated to show tasks where current user is assigned (not just CreatedByUserId)
12. Unit tests cover assignment/unassignment logic and authorization
13. Integration tests validate assignment endpoints with multiple users

### Story 2.5: Assignment UI and "My Tasks" View

**As a** user,
**I want** to assign tasks to myself or team members and filter to see only my assigned tasks,
**so that** I can focus on my personal workload.

**Acceptance Criteria:**

1. Task detail panel includes "Assignees" section showing current assignees with avatar/name
2. "Add Assignee" button opens user picker (dropdown or autocomplete search)
3. User picker searches all users in system by name or email
4. Selecting user adds them to task assignees immediately (API call)
5. Remove assignee button (X icon) next to each assignee removes them
6. "My Tasks" filter button added to dashboard showing count of assigned tasks
7. Clicking "My Tasks" filters list to show only tasks assigned to current user
8. Tasks display assignee avatars in list view (stacked for multiple assignees, max 3 shown with +N indicator)
9. Unassigned tasks show "No assignees" placeholder
10. Task creator automatically assigned to task on creation (optional default behavior)
11. Assignment changes show brief success notification
12. Error handling for failed assignments (user not found, permission denied)

### Story 2.6: Time Tracking Backend and Data Model

**As a** freelancer,
**I want** the backend to store time entries for tasks with user attribution,
**so that** my billable hours are accurately tracked and attributed.

**Acceptance Criteria:**

1. TimeEntry entity created with fields: Id (GUID), TaskId (FK), UserId (FK), Minutes (int), EntryDate (datetime), Note (nullable, max 500 chars), EntryType (enum: Timer/Manual)
2. Database migration created for TimeEntry table with indexes on TaskId and UserId
3. TimeEntryService created with methods: LogTime(taskId, userId, minutes, note, entryType), GetTaskTimeEntries(taskId), DeleteTimeEntry(entryId)
4. API endpoint created: POST /api/tasks/:id/timeentries to log time
5. API endpoint created: GET /api/tasks/:id/timeentries returns all time entries for task
6. API endpoint created: DELETE /api/timeentries/:id to delete specific entry
7. Task entity updated with computed LoggedMinutes field (sum of associated TimeEntry minutes)
8. Task list endpoint includes TotalLoggedMinutes calculated from TimeEntry sum
9. Authorization enforced�users can only create time entries for themselves, only entry creator can delete
10. Validation enforces positive minutes (> 0) and reasonable maximum (< 24 hours per entry)
11. Time entries include user name for display in time log
12. Unit tests cover time logging logic and authorization
13. Integration tests validate time entry endpoints with multiple entries per task

### Story 2.7: Active Timer UI

**As a** user,
**I want** to start, pause, and stop a timer on tasks,
**so that** I can track time as I work without manually entering minutes.

**Acceptance Criteria:**

1. "Start Timer" button added to task list view and task detail panel
2. Clicking "Start Timer" initiates browser-based timer showing elapsed time (HH:MM:SS format)
3. Timer displays prominently in UI (sticky header or floating widget) showing active task name
4. Timer updates every second without performance issues
5. "Pause" button allows pausing timer without losing elapsed time
6. "Resume" button continues timer from paused elapsed time
7. "Stop" button ends timer and prompts to save time entry with optional note
8. Saving timer creates TimeEntry via API with EntryType=Timer and calculated minutes (rounded up to nearest minute)
9. Only one timer can run at a time (starting new timer stops current timer with confirmation)
10. Timer state persists in browser localStorage (survives page refresh during active timing)
11. Timer displays even when navigating to different pages within application
12. Successfully saved time entry updates task's LoggedMinutes display immediately
13. Timer shows visual indicator (pulsing dot, color change) when active

### Story 2.8: Manual Time Entry UI

**As a** user,
**I want** to manually log time for past work without using a timer,
**so that** I can record hours when I forgot to start the timer.

**Acceptance Criteria:**

1. "Log Time" button added to task detail panel
2. Clicking "Log Time" opens form with fields: Hours (number), Minutes (number), Note (textarea), Date (date picker defaulting to today)
3. Form validates total time is > 0 and < 24 hours
4. Submitting form creates TimeEntry via API with EntryType=Manual
5. Time entries displayed in task detail panel showing: User, Date, Duration (formatted as "2h 30m"), Note, Type icon (timer/manual)
6. Time entry list sorted by EntryDate descending (most recent first)
7. Delete button on each time entry (only for entry creator) with confirmation
8. Deleting time entry updates task's LoggedMinutes immediately
9. Time log shows total logged time for task prominently (e.g., "Total: 12h 45m")
10. Quick log buttons for common durations (15m, 30m, 1h, 2h) pre-fill form
11. Empty state displayed when task has no time entries ("No time logged yet")
12. Mobile-friendly time entry form

### Story 2.9: Automatic Time Rollup to Parent Tasks

**As a** project manager,
**I want** parent task logged time to automatically include all child task time,
**so that** I can see total project time investment at any hierarchy level.

**Acceptance Criteria:**

1. Task entity LoggedMinutes calculation includes direct time entries PLUS recursive sum of all descendant time entries
2. Backend implements recursive aggregation query using CTE to sum time across hierarchy
3. API endpoint optimized to calculate rollup efficiently (< 1 second for 100-task hierarchy)
4. Task list view displays rolled-up time for parent tasks with visual indicator (e.g., "5h 30m total")
5. Task detail panel shows breakdown: "Direct: 2h 30m | Children: 3h 00m | Total: 5h 30m"
6. Adding time entry to child task updates all ancestor LoggedMinutes immediately
7. Deleting time entry from child task updates all ancestor LoggedMinutes immediately
8. Tree view optionally displays LoggedMinutes next to each task node
9. Filter/sort by logged time uses total rolled-up time for parent tasks
10. Performance acceptable�rollup calculation does not slow down task list loading (< 500ms)
11. Unit tests verify recursive time aggregation logic with nested hierarchies
12. Integration tests validate rollup with real hierarchy and time entries

---

## Epic 3: Advanced Views & Team Collaboration

**Epic Goal**: Complete the professional task management experience by implementing powerful data visualization methods (comprehensive filterable/sortable list view and visual Gantt timeline) and team collaboration infrastructure (comment threads with @mentions and activity logging). By the end of this epic, teams can coordinate asynchronously through task comments, track all changes via activity logs, view work through multiple lenses (list/tree/timeline), and utilize advanced filtering/sorting to find relevant tasks instantly�transforming TaskFlow into a full-featured team collaboration platform competitive with Asana and Linear.

### Story 3.1: Advanced Filtering and Sorting Backend

**As a** user,
**I want** the backend to support comprehensive filtering and sorting on all task fields,
**so that** I can query tasks by any combination of criteria efficiently.

**Acceptance Criteria:**

1. Task list API endpoint (GET /api/tasks) accepts query parameters: ?assignee=userId&status=InProgress&priority=High&dueDateFrom=2026-01-01&dueDateTo=2026-12-31&type=Task&sortBy=dueDate&sortOrder=asc
2. Filtering implemented for: assignee (UserId), status (enum value), priority (enum value), type (enum value), due date range (from/to dates), search text (Name/Description)
3. Sorting supported on: name, createdDate, dueDate, priority, status, loggedMinutes (with null handling)
4. Multiple filters combinable (AND logic�all criteria must match)
5. Case-insensitive text search using EF Core Contains() or SQL LIKE
6. Null due date handling�tasks without due dates included/excluded based on filter logic
7. Query optimization with appropriate database indexes on filterable/sortable columns
8. Pagination parameters supported: ?page=1&pageSize=50 (default pageSize=50, max=200)
9. Response includes pagination metadata: { items: [...], totalCount: 234, page: 1, pageSize: 50, totalPages: 5 }
10. Performance target met: <500ms response time for 500 tasks with multiple filters
11. Invalid query parameters return 400 Bad Request with validation messages
12. Unit tests cover filter combination logic and sorting
13. Integration tests validate all filter/sort combinations with test data

### Story 3.2: Enhanced List View UI with Filters and Sorting

**As a** user,
**I want** a powerful list view with multi-criteria filtering, column sorting, and pagination,
**so that** I can find and organize tasks efficiently as my list grows large.

**Acceptance Criteria:**

1. List view redesigned as data table with columns: Name, Assignees, Status, Priority, Due Date, Logged Time, Actions
2. Column headers clickable to sort ascending/descending with visual indicator (arrow icon)
3. Filter panel displayed above list with controls: Assignee (multi-select dropdown), Status (multi-select), Priority (multi-select), Type (multi-select), Due Date Range (date pickers)
4. "Apply Filters" button executes filtered query, "Clear Filters" resets to default view
5. Active filters displayed as removable chips/badges (e.g., "Status: In Progress ?")
6. Pagination controls at bottom: Previous/Next buttons, page number indicator, page size selector (25/50/100/200)
7. Quick actions column includes: Edit (pencil icon), Delete (trash icon), Start Timer (clock icon), View Details (eye icon)
8. Hovering over row highlights it for easier scanning of dense data
9. Loading state displayed during filter/sort operations
10. Filtered results count displayed (e.g., "Showing 12 of 234 tasks")
11. Filter/sort/pagination state persists in URL query parameters (bookmarkable, shareable)
12. Mobile responsive�filters collapse into dropdown menu, table scrolls horizontally or simplifies to cards
13. Empty state displayed when filters produce no results ("No tasks match your filters")
14. Performance: UI updates within 100ms of pagination/sort clicks

### Story 3.3: Timeline View Backend Support

**As a** user,
**I want** the backend to provide task data optimized for timeline/Gantt visualization,
**so that** the frontend can render date-based views efficiently.

**Acceptance Criteria:**

1. Task list API endpoint supports timeline query parameters: ?view=timeline&startDate=2026-01-01&endDate=2026-03-31
2. Timeline endpoint returns only tasks with due dates within specified date range
3. Response includes calculated fields for Gantt rendering: startDate (CreatedDate or assigned date), endDate (DueDate), duration (days between start/end)
4. Tasks without due dates excluded from timeline view response
5. Hierarchy preserved in response�parent tasks included if any children match date range
6. Parent task duration calculated as span from earliest child start to latest child end (if no explicit parent due date)
7. API supports filtering timeline by assignee, status, priority (same as list view)
8. Response optimized for rendering: includes minimal fields (id, name, start, end, status, assignees, parentId) to reduce payload size
9. Performance target: <2 seconds response time for 100 tasks in date range
10. Date range validation enforces reasonable limits (max 2-year range to prevent excessive data)
11. Unit tests verify date range filtering and duration calculations
12. Integration tests validate timeline data with hierarchical tasks spanning multiple months

### Story 3.4: Gantt Chart Library Integration

**As a** user,
**I want** to see my tasks displayed in a visual timeline/Gantt chart,
**so that** I can understand project schedules and deadlines visually.

**Acceptance Criteria:**

1. Open-source Gantt library evaluated and selected (Frappe Gantt, DHTMLX Gantt free tier, or ng-gantt) based on MIT/Apache license, TypeScript support, and customizability
2. Gantt library integrated into Angular project with npm package installation
3. Timeline view page created accessible from main navigation ("Timeline" or "Gantt" menu item)
4. Gantt chart renders tasks as horizontal bars positioned by CreatedDate (start) and DueDate (end)
5. Task bars display task name overlaid or beside bar
6. Task bars color-coded by status: To Do (gray), In Progress (blue), Blocked (red), Waiting (yellow), Done (green)
7. Y-axis displays task names or hierarchy structure (rows per task)
8. X-axis displays date scale with configurable view (day, week, month)
9. Parent-child relationships visualized (indentation, dependency lines, or parent bars spanning children)
10. Today indicator line shown on chart (vertical line highlighting current date)
11. Tasks load from API using timeline endpoint with date range matching visible viewport
12. Loading state displayed while fetching timeline data
13. Empty state displayed when no tasks have due dates ("Add due dates to see tasks in timeline")
14. Gantt renders without performance issues for 50 tasks

### Story 3.5: Interactive Gantt Features

**As a** user,
**I want** to drag task bars to adjust dates and zoom the timeline view,
**so that** I can plan schedules interactively.

**Acceptance Criteria:**

1. Clicking task bar in Gantt chart opens task detail panel (same as list view)
2. Drag-and-drop enabled on task bars to adjust dates horizontally
3. Dragging task bar updates DueDate via API PUT /api/tasks/:id with new calculated date
4. Visual feedback during drag (semi-transparent bar, snap-to-grid guidelines)
5. Successful date change updates task immediately in Gantt without full reload
6. Zoom controls added: "Day", "Week", "Month" buttons change X-axis granularity
7. Zoom level persists in user session (returns to last used zoom on page revisit)
8. Horizontal scrolling enabled to navigate beyond visible date range
9. Scroll position persists during task updates (chart doesn't jump to top)
10. Keyboard shortcuts: +/- to zoom in/out, arrow keys to scroll timeline
11. Date change validation�prevents setting due date before creation date with error message
12. Parent task due dates automatically adjusted when child dates exceed parent range (or warning displayed)
13. Drag disabled on completed tasks (Done status) with visual indicator (locked icon)
14. Mobile users see read-only Gantt (no drag-and-drop) or simplified calendar view

### Story 3.6: Comments and Mentions Backend

**As a** team member,
**I want** to comment on tasks and mention other users,
**so that** I can have async discussions and notify relevant people.

**Acceptance Criteria:**

1. Comment entity created with fields: Id (GUID), TaskId (FK), UserId (FK), Text (required, max 2000 chars), CreatedDate, UpdatedDate (nullable), IsEdited (bool), IsDeleted (bool for soft delete)
2. Database migration created for Comment table with indexes on TaskId and UserId
3. CommentService created with methods: CreateComment(taskId, userId, text), UpdateComment(commentId, text), DeleteComment(commentId), GetTaskComments(taskId)
4. API endpoint created: POST /api/tasks/:id/comments to create comment
5. API endpoint created: PUT /api/comments/:id to edit comment (only by author)
6. API endpoint created: DELETE /api/comments/:id to delete comment (soft delete, only by author)
7. API endpoint created: GET /api/tasks/:id/comments returns comments sorted by CreatedDate ascending (chronological thread)
8. Comment text parsed for @mentions (e.g., "@username" or "@email") and UserIds extracted
9. Mention validation ensures mentioned users exist in system
10. Comment response includes author name, avatar URL, created/updated timestamps, isEdited flag
11. Authorization enforced�users can only edit/delete their own comments
12. Comments excluded from deleted tasks (or cascade delete based on design decision)
13. Unit tests cover mention parsing and authorization logic
14. Integration tests validate comment CRUD operations with multiple users and mentions

### Story 3.7: Comment Thread UI

**As a** user,
**I want** to view and participate in comment threads on tasks,
**so that** I can collaborate with teammates asynchronously.

**Acceptance Criteria:**

1. Comment section added to task detail panel below task fields
2. Comment thread displays all comments chronologically (oldest first) with author avatar, name, timestamp
3. Edited comments show "(edited)" indicator next to timestamp
4. Comment compose box at bottom of thread with text area and "Post Comment" button
5. @mention autocomplete triggers when typing "@" followed by characters (searches users by name/email)
6. Selecting user from autocomplete inserts mention as "@Username" with special formatting (highlight, link)
7. Clicking mentioned username navigates to user profile or filters tasks to that user
8. Posted comment appears in thread immediately without full page reload
9. Edit button appears on user's own comments (pencil icon)
10. Clicking edit converts comment to editable text area with Save/Cancel buttons
11. Delete button appears on user's own comments (trash icon) with confirmation prompt
12. Deleted comments show as "[Comment deleted]" placeholder or removed entirely from thread
13. Comment count badge displayed on task list showing number of comments per task (e.g., "?? 5")
14. Empty state displayed when task has no comments ("Be the first to comment")
15. Long comment threads scrollable within task detail panel
16. Mobile-friendly comment composition and reading

### Story 3.8: Activity Log Backend

**As a** user,
**I want** the system to track all changes to tasks automatically,
**so that** I have an audit trail and history of what happened.

**Acceptance Criteria:**

1. ActivityLog entity created with fields: Id (GUID), TaskId (FK), UserId (FK), ActivityType (enum: Created/Updated/Deleted/StatusChanged/Assigned/Unassigned/TimeLogged/Commented), Description (string), ChangedField (nullable), OldValue (nullable), NewValue (nullable), Timestamp
2. Database migration created for ActivityLog table with indexes on TaskId and Timestamp
3. ActivityLogService created with method: LogActivity(taskId, userId, activityType, description, ...)
4. Activity logging triggered automatically via service layer hooks or database triggers for: task creation, task field updates, status changes, assignment/unassignment, time entry creation, comment creation
5. Activity descriptions human-readable (e.g., "Sarah changed status from In Progress to Done", "Marcus logged 2 hours 30 minutes")
6. Field-level change tracking for task updates (captures which field changed and before/after values)
7. API endpoint created: GET /api/tasks/:id/activity returns activity log sorted by Timestamp descending (most recent first)
8. Activity log pagination supported for tasks with extensive history
9. Activity log includes actor name for display ("John Doe assigned this task to Jane Smith")
10. Bulk operations (if implemented) log individual activities per affected task
11. Deleted tasks retain activity logs for audit purposes (or cascade delete based on design)
12. Performance: activity logging does not slow down task operations (async processing or fast inserts)
13. Unit tests verify activity creation for each trigger scenario
14. Integration tests validate activity log captures full workflow sequence

### Story 3.9: Activity Log UI and Status Indicators

**As a** user,
**I want** to see task activity history and clear visual status indicators throughout the application,
**so that** I understand what happened and can quickly identify task states.

**Acceptance Criteria:**

1. Activity log section added to task detail panel showing chronological activity feed
2. Activity items displayed with: Actor avatar, Activity description, Timestamp (relative: "2 hours ago" or absolute date)
3. Activity types have distinct icons (created: ?, updated: ??, status changed: ??, assigned: ??, time logged: ??, commented: ??)
4. Field changes expanded to show details (e.g., "Status changed from In Progress to Done")
5. Activity log scrollable with "Load More" button for tasks with extensive history (pagination)
6. Status-specific visual indicators implemented throughout UI: status badges (colored pills), icons (? for Done, ? for Blocked, ? for Waiting)
7. Status color coding consistent: To Do (gray), In Progress (blue), Blocked (red), Waiting (yellow), Done (green)
8. Priority indicators added to task list: Critical (red flag), High (orange), Medium (yellow), Low (gray)
9. Task cards/rows show multiple visual indicators simultaneously (status badge + priority icon)
10. Gantt chart bars use status colors matching list view
11. Tree view nodes show status/priority icons consistently
12. Dashboard summary widget displays task counts by status with color-coded badges (optional enhancement)
13. Empty activity log state: "No activity yet"
14. Activity log updates in real-time when changes made in same session (or on next refresh)
15. Mobile-friendly activity log display (condensed format, icons emphasized)

---

## Checklist Results Report

### Executive Summary

**Overall PRD Completeness**: 92%

**MVP Scope Appropriateness**: Just Right - The scope is well-balanced for a 6-week MVP, with clear delineation of must-haves vs. post-MVP features. The 3-epic structure provides logical incremental value delivery.

**Readiness for Architecture Phase**: READY - The PRD provides comprehensive guidance for architectural design with clear technical constraints, non-functional requirements, and identified complexity areas.

**Most Critical Gaps or Concerns**:
- Gantt library evaluation should be spiked earlier (currently deferred to Story 3.4)
- Backend hosting decision needs finalization ($6/month VPS vs. strict zero-budget)
- Database free tier limits (ElephantSQL 20MB) may be insufficient for time entry logs
- No explicit guidance on dark mode support (Material/PrimeNG provide it)

---

### Category Analysis

| Category                         | Status  | Critical Issues                                                          |
| -------------------------------- | ------- | ------------------------------------------------------------------------ |
| 1. Problem Definition & Context  | PASS    | None - Brief provides excellent foundation                               |
| 2. MVP Scope Definition          | PASS    | Minor: Gantt library choice deferred to implementation                   |
| 3. User Experience Requirements  | PASS    | Minor: Dark mode support not specified                                   |
| 4. Functional Requirements       | PASS    | None - 25 FRs comprehensively cover MVP features                         |
| 5. Non-Functional Requirements   | PASS    | None - 20 NFRs with specific performance targets                         |
| 6. Epic & Story Structure        | PASS    | None - 3 epics, 26 stories, all properly sequenced                       |
| 7. Technical Guidance            | PARTIAL | Medium: Backend hosting budget unclear, database limit concerns          |
| 8. Cross-Functional Requirements | PASS    | None - Data model, integrations, operations well-defined                 |
| 9. Clarity & Communication       | PASS    | None - Clear language, well-structured, comprehensive                    |

**Overall Assessment**: 8/9 categories PASS, 1 category PARTIAL (Technical Guidance has minor clarifications needed but not blockers)

---

### Issues by Priority

**BLOCKERS** (Must fix before architect can proceed):
- None identified

**HIGH** (Should fix for quality):
1. **Backend Hosting Decision**: Clarify whether $6/month DigitalOcean VPS is acceptable or if strict zero-budget requires Azure free tier (limited runtime hours). Recommendation: Document explicit choice and backup plan.
2. **Gantt Library Evaluation**: Consider conducting technical spike before Epic 3 to derisk library selection (Frappe Gantt vs. DHTMLX vs. custom). Recommendation: Add Story 0 "Technical Spikes" to Epic 1 or pre-work.

**MEDIUM** (Would improve clarity):
1. **Database Capacity Planning**: ElephantSQL free tier (20MB) may hit limits quickly with TimeEntry logs. Recommendation: Document monitoring plan and migration trigger to Supabase (500MB free).
2. **Dark Mode Support**: Material/PrimeNG provide dark mode, but PRD doesn't specify if MVP includes it. Recommendation: Add to UI Design Goals or explicitly defer to post-MVP.
3. **Real-time Updates**: Polling every 30 seconds may create unnecessary API load. Recommendation: Consider longer intervals (60s) or defer to post-MVP if not critical.

**LOW** (Nice to have):
1. **Undo Functionality**: Story 2.3 AC 10 mentions optional undo for reparenting - clarify if MVP or post-MVP.
2. **Dashboard Summary Widget**: Story 3.9 AC 12 marks as optional enhancement - remove if not MVP.
3. **File Attachment Placeholder**: Architecture doc might benefit from noting future Firebase Storage integration points.

---

### MVP Scope Assessment

**Scope Validation**: ✅ APPROPRIATE

**Features That Could Be Cut** (if timeline at risk):
- **Comments @mentions** (Stories 3.6-3.7): Core commenting could work without mention parsing/autocomplete - deferring @mentions would reduce complexity while keeping async collaboration
- **Gantt Interactive Features** (Story 3.5): Read-only Gantt (Story 3.4 only) still provides timeline visualization value; drag-to-adjust dates could be post-MVP
- **Activity Log** (Stories 3.8-3.9): Provides audit trail but not critical for core task management MVP - could simplify to comment-based history only

**Missing Essential Features**: None - All personas' core needs are addressed

**Complexity Concerns**:
- **Recursive CTE Performance** (Stories 2.1, 2.9): 10-15 level hierarchy with rollup calculations needs performance testing - PostgreSQL should handle but requires validation
- **Gantt Library Integration** (Story 3.4): Unknown complexity until library selected - could take 6-8 hours vs. estimated 2-4
- **Timer Persistence** (Story 2.7): localStorage-based approach brittle - page clear loses timing data

**Timeline Realism**: ✅ ACHIEVABLE
- 26 stories × 3 hours average = 78 hours
- 6 weeks × 20 hours/week (part-time) = 120 hours total
- 42-hour buffer for testing, deployment, rework, and complexity overruns
- Epic 1: 8 stories (24h), Epic 2: 9 stories (27h), Epic 3: 9 stories (27h) = balanced

---

### Technical Readiness

**Clarity of Technical Constraints**: ✅ EXCELLENT
- Zero-budget constraint drives all technical choices (open-source only, free tiers)
- PostgreSQL over SQL Server justified (CTE performance, free hosting)
- Monorepo + monolithic architecture appropriate for solo developer
- Specific versions: Angular 17+, .NET 8, PostgreSQL

**Identified Technical Risks** (properly documented):
1. **Recursive hierarchy query performance** - Mitigated by indexing, pagination, CTE optimization
2. **Firebase free tier limits** - Mitigated by monitoring, alternative hosting documented
3. **JWT token security (XSS)** - Mitigated by Angular sanitization, HTTPS, CSP headers
4. **Gantt library licensing** - Mitigated by open-source requirement (MIT/Apache only)
5. **Real-time collaboration conflicts** - Mitigated by deferring WebSockets to post-MVP

**Areas Needing Architect Investigation**:
- Database schema optimization for recursive queries (indexes, CTE tuning)
- Angular component library selection (Material vs. PrimeNG) - both viable, architect should choose
- Tree view library evaluation (@circlon/angular-tree-component vs. Angular Material Tree)
- Authentication flow security hardening (refresh tokens, HttpOnly cookies vs. localStorage)
- Caching strategy for time rollups (computed on-demand vs. pre-aggregated)

**Architect Has Sufficient Guidance**: ✅ YES
- Technical Assumptions section provides comprehensive stack details
- Non-Functional Requirements specify performance targets
- Testing Requirements define unit/integration/E2E approach
- Each story includes acceptance criteria with technical specificity

---

### Recommendations

**Immediate Actions** (before architect handoff):
1. ✅ **PRD Approved** - No blocking issues, proceed to architecture phase
2. **Clarify Backend Hosting Budget**: Document explicit choice (VPS $6/mo acceptable? Azure free tier? Heroku alternatives?) and migration plan if free tier exhausted
3. **Schedule Gantt Library Spike**: Conduct 2-hour evaluation of Frappe Gantt, DHTMLX, ng-gantt before Epic 3 to derisk Story 3.4

**Suggested Improvements** (non-blocking):
1. **Add Technical Spikes Section**: Document pre-Epic work like Gantt evaluation, tree library comparison, database CTE performance testing
2. **Clarify Database Monitoring Plan**: Add explicit trigger for ElephantSQL → Supabase migration (e.g., "migrate at 15MB to allow buffer")
3. **Document Dark Mode Decision**: Add to UI Design Goals as "Post-MVP" or specify Material theming approach
4. **Refine Polling Interval**: Consider 60-second polling vs. 30-second to reduce API load (or make configurable)

**Next Steps**:
1. **UX Expert Handoff**: Provide PRD to UX expert for wireframe/mockup creation (optional, not blocking for architecture)
2. **Architect Handoff**: Provide PRD + Project Brief to dev-agent in create architecture mode
3. **Technical Spikes**: Schedule Gantt library evaluation and database performance testing as pre-Epic 3 work

---

### Final Decision

✅ **READY FOR ARCHITECT**

The PRD and epics are comprehensive, properly structured, and ready for architectural design. The minor clarifications identified (hosting budget, Gantt library spike) do not block architecture work and can be resolved in parallel. The architect has sufficient guidance on:

- Clear functional and non-functional requirements
- Well-sequenced epics and stories with acceptance criteria
- Explicit technical constraints and stack choices
- Performance targets and scalability expectations
- Security requirements and testing approach
- Known technical risks with mitigation strategies

**Confidence Level**: HIGH - This PRD provides a solid foundation for a successful MVP development cycle.

---

## Next Steps

### UX Expert Prompt

```
@ux I need your help designing the user interface for TaskFlow based on the PRD.

Context: TaskFlow is a lightweight task management system with hierarchical tasks, time tracking, and team collaboration. Target users are freelancers and small teams who need professional features without enterprise complexity.

Key Documents:
- docs/prd.md (Product Requirements Document)
- docs/brief.md (Project Brief with personas)

Primary Request:
Review the PRD's "User Interface Design Goals" section and create wireframes/mockups for these core screens:
1. Login/Registration
2. My Tasks Dashboard (list view)
3. Task Detail Panel (slide-out)
4. Tree View (hierarchy visualization)
5. Timeline/Gantt View
6. Time Tracking UI (timer widget)

Design Priorities:
- Minimalist, content-focused interface (Linear/Notion aesthetic)
- Inline editing everywhere (no modal dialogs)
- Status/priority visual indicators consistent across views
- Mobile-responsive layouts
- Material Design 3 or PrimeNG component library (zero-budget constraint)

Deliverables:
- Wireframes for core screens
- Component library recommendation (Material vs. PrimeNG)
- Navigation structure
- Interaction patterns documentation
- Accessibility compliance notes (WCAG AA)

Timeline: Optional, not blocking architecture work. Deliver when ready.
```

---

### Architect Prompt

```
@dev enter create architecture mode

I've completed the PRD for TaskFlow, a lightweight task management system with hierarchical tasks, integrated time tracking, and team collaboration features. The project is ready for architecture design.

Key Documents:
- docs/prd.md (Product Requirements Document) - READ THIS FIRST
- docs/brief.md (Project Brief with detailed context)

Project Context:
- **Goal**: MVP in 6 weeks, solo developer, zero budget constraint
- **Stack**: Angular 17+ frontend, .NET 8 Web API backend, PostgreSQL database
- **Deployment**: Firebase/Netlify (frontend), Azure/VPS (backend), ElephantSQL/Supabase (database)
- **Key Features**: Recursive task hierarchy (unlimited nesting), multi-user assignment, dual time tracking (timer + manual), Gantt view, comments with @mentions, activity logging

Critical Requirements:
- 25 Functional Requirements (FR1-FR25) - see PRD Requirements section
- 20 Non-Functional Requirements (NFR1-NFR20) - performance, security, scalability targets
- 3 Epics, 26 Stories with detailed acceptance criteria - see Epic sections

Technical Priorities:
1. **Recursive Hierarchy Performance**: Design database schema with CTE optimization for 10-15 level nesting
2. **Time Tracking Precision**: Architecture for timer persistence and time aggregation rollup
3. **Security**: JWT authentication, bcrypt password hashing, HTTPS everywhere, CSRF/XSS protection
4. **Zero-Budget Constraints**: All dependencies must be open-source (MIT/Apache), free tier hosting

Architecture Deliverables Needed:
- Database schema (ER diagram with all entities, relationships, indexes)
- API endpoint specifications (RESTful routing, request/response schemas)
- Frontend component architecture (Angular modules, services, state management)
- Security architecture (auth flow, token handling, authorization patterns)
- Deployment architecture (CI/CD pipeline, hosting configuration)
- Performance optimization strategy (caching, pagination, query optimization)
- Testing strategy (unit, integration, E2E approaches)

Known Complexity Areas:
- Recursive CTE queries for hierarchy (Task.ParentTaskId self-reference)
- Time rollup calculations across parent-child chains
- Gantt library selection and integration (Frappe Gantt vs. DHTMLX vs. custom)
- Real-time timer persistence using localStorage

Please review the PRD comprehensively and create the architecture document following your standard architecture template. Focus on pragmatic solutions that balance the zero-budget constraint with professional-grade technical quality.

Start by confirming you've read the PRD and brief, then proceed with architecture creation.
```
