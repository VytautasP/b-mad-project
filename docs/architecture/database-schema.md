# Database Schema

This section defines the concrete PostgreSQL database schema for TaskFlow, including table definitions with data types, constraints, indexes, and relationships. The schema is designed to support Entity Framework Core code-first migrations while optimizing for query performance per NFR requirements.

**Schema Design Principles:**
- **Normalization:** Third normal form (3NF) to eliminate data duplication and maintain referential integrity
- **Performance:** Strategic indexes on foreign keys, filter columns, and sort columns to meet NFR2 (<500ms list view)
- **Recursive CTEs:** Self-referencing Tasks.ParentTaskId enables unlimited hierarchy with efficient traversal (NFR19)
- **Soft Deletes:** IsDeleted flags preserve historical data for activity logs and reporting while appearing deleted in UI
- **JSONB Fields:** Flexible storage for evolving features (MentionedUserIds, ActivityLog metadata) without schema migrations
- **UUID Primary Keys:** GUIDs prevent ID conflicts in distributed systems and hide sequential patterns
- **Timestamps:** CreatedDate/ModifiedDate on all entities enable audit trails and activity logging (FR22)

## PostgreSQL DDL Schema

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

## Entity Framework Core Configuration

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

## Schema Evolution Strategy

**Migration Workflow:**
1. **Create Migration:** `dotnet ef migrations add InitialCreate`
2. **Review SQL:** Check generated SQL in `Migrations/` folder
3. **Apply to Dev:** `dotnet ef database update`
4. **Apply to Production:** Run migrations on Supabase via CI/CD

**Performance Monitoring:**
- Monitor slow queries via `pg_stat_statements`
- Add indexes based on production query patterns
- Expected performance: Task list <500ms (NFR2), hierarchy queries <1s (NFR19)

