# API Specification

This section defines the complete RESTful HTTP API surface for TaskFlow, including all endpoints, request/response schemas, authentication requirements, and error handling patterns. The API follows **resource-oriented design** with standard HTTP verbs (GET, POST, PUT, PATCH, DELETE) and RESTful conventions. All endpoints return JSON and require JWT bearer token authentication (except auth endpoints).

**API Design Principles:**
- **Resource-Based URLs:** `/api/tasks`, `/api/users`, `/api/timeentries`, `/api/comments` follow REST conventions
- **HTTP Verbs Semantics:** GET (read), POST (create), PUT (full update), PATCH (partial update), DELETE (remove)
- **Stateless Authentication:** JWT bearer tokens in `Authorization` header enable horizontal scaling
- **Consistent Error Format:** All errors return `{ error: string, details?: object }` with appropriate HTTP status codes
- **Pagination:** List endpoints support `?page=1&pageSize=50` with response metadata
- **Filtering/Sorting:** Query parameters enable complex queries (`?status=InProgress&sortBy=dueDate&sortOrder=asc`)
- **OpenAPI Documentation:** Swashbuckle auto-generates interactive Swagger UI at `/swagger` for testing

## REST API Specification

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

## Authentication Flow

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

## Error Handling

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

## API Performance Targets

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

