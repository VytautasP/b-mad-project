# Core Workflows

This section illustrates the key system workflows using sequence diagrams, showing how frontend components, backend services, and infrastructure interact to fulfill critical user journeys from the PRD.

## User Registration and Authentication Flow

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

## Task Creation with Hierarchy and Assignment

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

## Time Tracking: Start Timer → Stop Timer → Time Rollup

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

## Hierarchical Task Query with Recursive CTE

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

## Activity Log and Collaboration Flow

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

## Advanced Filtering and Sorting Flow

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

