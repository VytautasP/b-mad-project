# Epic 3: Advanced Views & Team Collaboration

**Epic Goal**: Complete the professional task management experience by implementing powerful data visualization methods (comprehensive filterable/sortable list view and visual Gantt timeline) and team collaboration infrastructure (comment threads with @mentions and activity logging). By the end of this epic, teams can coordinate asynchronously through task comments, track all changes via activity logs, view work through multiple lenses (list/tree/timeline), and utilize advanced filtering/sorting to find relevant tasks instantly�transforming TaskFlow into a full-featured team collaboration platform competitive with Asana and Linear.

## Story 3.1: Advanced Filtering and Sorting Backend

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

## Story 3.2: Enhanced List View UI with Filters and Sorting

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

## Story 3.3: Timeline View Backend Support

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

## Story 3.4: Gantt Chart Library Integration

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

## Story 3.5: Interactive Gantt Features

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

## Story 3.6: Comments and Mentions Backend

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

## Story 3.7: Comment Thread UI

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

## Story 3.8: Activity Log Backend

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

## Story 3.9: Activity Log UI and Status Indicators

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
