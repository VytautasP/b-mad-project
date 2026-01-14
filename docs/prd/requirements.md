# Requirements

## Functional Requirements

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

## Non-Functional Requirements

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
