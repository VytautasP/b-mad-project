# Epic 2: Task Organization & Time Tracking

**Epic Goal**: Transform the basic task tracker into a professional project management tool by implementing unlimited task hierarchy (parent-child nesting with visual tree rendering and drag-and-drop reorganization), multi-user assignment capabilities for team collaboration, and comprehensive time tracking with both active timers and manual entry. By the end of this epic, freelancers can organize client work into project hierarchies, track billable hours with precision, and teams can assign work to multiple members while automatically rolling up time investment to parent tasks�delivering TaskFlow's core competitive differentiators.

## Story 2.1: Recursive Hierarchy Backend Support

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

## Story 2.2: Task Tree Visualization

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

## Story 2.3: Drag-and-Drop Task Reparenting

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

## Story 2.4: Multi-Assignment Backend System

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

## Story 2.5: Assignment UI and "My Tasks" View

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

## Story 2.6: Time Tracking Backend and Data Model

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

## Story 2.7: Active Timer UI

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

## Story 2.8: Manual Time Entry UI

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

## Story 2.9: Automatic Time Rollup to Parent Tasks

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
