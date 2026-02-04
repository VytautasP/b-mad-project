using Microsoft.EntityFrameworkCore;
using TaskFlow.Abstractions.Constants;
using TaskFlow.Abstractions.DTOs.Task;
using TaskFlow.Abstractions.DTOs.Tasks;
using TaskFlow.Abstractions.Entities;
using TaskFlow.Abstractions.Interfaces.Repositories;
using TaskFlow.Infrastructure.Data;
using TaskEntity = TaskFlow.Abstractions.Entities.Task;

namespace TaskFlow.Infrastructure.Repositories;

public class TaskRepository : ITaskRepository
{
    private readonly ApplicationDbContext _context;

    public TaskRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async System.Threading.Tasks.Task<TaskEntity> CreateAsync(TaskEntity task, CancellationToken ct = default)
    {
        if (task.Id == Guid.Empty)
        {
            task.Id = Guid.NewGuid();
        }

        task.CreatedDate = DateTime.UtcNow;
        task.ModifiedDate = DateTime.UtcNow;

        await _context.Tasks.AddAsync(task, ct);
        return task;
    }

    public async System.Threading.Tasks.Task<TaskEntity?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.Tasks
            .AsNoTracking()
            .Where(t => t.Id == id && !t.IsDeleted)
            .FirstOrDefaultAsync(ct);
    }

    public async System.Threading.Tasks.Task<TaskEntity?> GetByIdWithUserAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.Tasks
            .AsNoTracking()
            .Include(t => t.CreatedByUser)
            .Include(t => t.TimeEntries)
            .Where(t => t.Id == id && !t.IsDeleted)
            .FirstOrDefaultAsync(ct);
    }

    public async System.Threading.Tasks.Task<List<TaskEntity>> GetUserTasksAsync(Guid userId, TaskFlow.Abstractions.Constants.TaskStatus? status, string? searchTerm = null, CancellationToken ct = default)
    {
        var query = _context.Tasks
            .AsNoTracking()
            .Include(t => t.TimeEntries)
            .Where(t => t.CreatedByUserId == userId && !t.IsDeleted);

        if (status.HasValue)
        {
            query = query.Where(t => t.Status == status.Value);
        }

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var trimmedSearch = searchTerm.Trim();
            query = query.Where(t => t.Name.ToLower().Contains(trimmedSearch.ToLower()) || 
                                    (t.Description != null && t.Description.ToLower().Contains(trimmedSearch.ToLower())));
        }

        return await query
            .OrderByDescending(t => t.CreatedDate)
            .ToListAsync(ct);
    }

    public async System.Threading.Tasks.Task<List<TaskEntity>> GetAssignedTasksAsync(Guid userId, TaskFlow.Abstractions.Constants.TaskStatus? status, string? searchTerm = null, CancellationToken ct = default)
    {
        var query = _context.Tasks
            .AsNoTracking()
            .Include(t => t.TaskAssignments)
                .ThenInclude(ta => ta.User)
            .Include(t => t.CreatedByUser)
            .Include(t => t.TimeEntries)
            .Where(t => !t.IsDeleted && 
                       (t.CreatedByUserId == userId || t.TaskAssignments.Any(ta => ta.UserId == userId)));

        if (status.HasValue)
        {
            query = query.Where(t => t.Status == status.Value);
        }

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var trimmedSearch = searchTerm.Trim();
            query = query.Where(t => t.Name.ToLower().Contains(trimmedSearch.ToLower()) || 
                                    (t.Description != null && t.Description.ToLower().Contains(trimmedSearch.ToLower())));
        }

        return await query
            .OrderByDescending(t => t.CreatedDate)
            .ToListAsync(ct);
    }

    public async System.Threading.Tasks.Task<(List<TaskEntity> Items, int TotalCount)> GetTasksWithFiltersAsync(
        Guid userId, 
        TaskQueryDto queryDto, 
        CancellationToken ct = default)
    {
        // Base query: user's own tasks OR tasks where user is assigned
        var query = _context.Tasks
            .AsNoTracking()
            .Include(t => t.CreatedByUser)
            .Include(t => t.TaskAssignments)
                .ThenInclude(ta => ta.User)
            .Include(t => t.TimeEntries)
            .Where(t => !t.IsDeleted);

        // Apply authorization filter based on whether assigneeId filter is specified
        if (queryDto.AssigneeId.HasValue)
        {
            // User wants to filter by assignee
            // Get all task IDs where the specified user is assigned
            var assignedTaskIds = _context.TaskAssignments
                .Where(ta => ta.UserId == queryDto.AssigneeId.Value)
                .Select(ta => ta.TaskId)
                .ToList();

            // Filter to tasks where: (user created it OR user is assigned to it) AND task is assigned to the specified user
            var userAssignedTaskIds = _context.TaskAssignments
                .Where(ta => ta.UserId == userId)
                .Select(ta => ta.TaskId)
                .ToList();

            query = query.Where(t => (t.CreatedByUserId == userId || userAssignedTaskIds.Contains(t.Id)) &&
                                     assignedTaskIds.Contains(t.Id));
        }
        else
        {
            // No assignee filter, just show user's accessible tasks
            var userAssignedTaskIds = _context.TaskAssignments
                .Where(ta => ta.UserId == userId)
                .Select(ta => ta.TaskId)
                .ToList();

            query = query.Where(t => t.CreatedByUserId == userId || userAssignedTaskIds.Contains(t.Id));
        }

        if (queryDto.Status.HasValue)
        {
            query = query.Where(t => t.Status == queryDto.Status.Value);
        }

        if (queryDto.Priority.HasValue)
        {
            query = query.Where(t => t.Priority == queryDto.Priority.Value);
        }

        if (queryDto.Type.HasValue)
        {
            query = query.Where(t => t.Type == queryDto.Type.Value);
        }

        if (queryDto.DueDateFrom.HasValue)
        {
            query = query.Where(t => t.DueDate >= queryDto.DueDateFrom.Value);
        }

        if (queryDto.DueDateTo.HasValue)
        {
            query = query.Where(t => t.DueDate <= queryDto.DueDateTo.Value);
        }

        if (!string.IsNullOrWhiteSpace(queryDto.SearchTerm))
        {
            var trimmedSearch = queryDto.SearchTerm.Trim().ToLower();
            
            // Use ToLower() for compatibility with both in-memory and PostgreSQL
            // For production PostgreSQL, consider using EF.Functions.ILike for better performance
            query = query.Where(t => 
                t.Name.ToLower().Contains(trimmedSearch) || 
                (t.Description != null && t.Description.ToLower().Contains(trimmedSearch)));
        }

        // Get total count before pagination
        var totalCount = await query.CountAsync(ct);

        // Apply sorting
        query = ApplySorting(query, queryDto.SortBy, queryDto.SortOrder);

        // Apply pagination
        var items = await query
            .Skip((queryDto.Page - 1) * queryDto.PageSize)
            .Take(queryDto.PageSize)
            .ToListAsync(ct);

        return (items, totalCount);
    }

    private IQueryable<TaskEntity> ApplySorting(IQueryable<TaskEntity> query, string? sortBy, string sortOrder)
    {
        var isDescending = sortOrder.Equals("desc", StringComparison.OrdinalIgnoreCase);

        return sortBy?.ToLower() switch
        {
            "name" => isDescending ? query.OrderByDescending(t => t.Name) : query.OrderBy(t => t.Name),
            "createddate" => isDescending ? query.OrderByDescending(t => t.CreatedDate) : query.OrderBy(t => t.CreatedDate),
            "duedate" => isDescending 
                ? query.OrderByDescending(t => t.DueDate.HasValue).ThenByDescending(t => t.DueDate)
                : query.OrderBy(t => t.DueDate.HasValue).ThenBy(t => t.DueDate),
            "priority" => isDescending ? query.OrderByDescending(t => t.Priority) : query.OrderBy(t => t.Priority),
            "status" => isDescending ? query.OrderByDescending(t => t.Status) : query.OrderBy(t => t.Status),
            "loggedminutes" => isDescending 
                ? query.OrderByDescending(t => t.TimeEntries.Sum(te => te.Minutes))
                : query.OrderBy(t => t.TimeEntries.Sum(te => te.Minutes)),
            _ => query.OrderByDescending(t => t.CreatedDate) // Default sort
        };
    }

    public async System.Threading.Tasks.Task<bool> UpdateAsync(TaskEntity task, CancellationToken ct = default)
    {
        task.ModifiedDate = DateTime.UtcNow;
        _context.Tasks.Update(task);
        return await System.Threading.Tasks.Task.FromResult(true);
    }

    public async System.Threading.Tasks.Task<bool> DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var task = await _context.Tasks
            .Where(t => t.Id == id)
            .FirstOrDefaultAsync(ct);

        if (task == null)
        {
            return false;
        }

        task.IsDeleted = true;
        task.ModifiedDate = DateTime.UtcNow;
        return true;
    }

    public async System.Threading.Tasks.Task<bool> UserOwnsTaskAsync(Guid taskId, Guid userId, CancellationToken ct = default)
    {
        return await _context.Tasks
            .AnyAsync(t => t.Id == taskId && t.CreatedByUserId == userId, ct);
    }

    public async System.Threading.Tasks.Task<List<TaskEntity>> GetChildrenAsync(Guid taskId, CancellationToken ct = default)
    {
        return await _context.Tasks
            .AsNoTracking()
            .Where(t => t.ParentTaskId == taskId && !t.IsDeleted)
            .OrderBy(t => t.CreatedDate)
            .ToListAsync(ct);
    }

    public async System.Threading.Tasks.Task<List<TaskHierarchyDto>> GetAncestorsAsync(Guid taskId, CancellationToken ct = default)
    {
        // Check if we're using a relational database
        if (_context.Database.IsRelational())
        {
            var sql = @"
                WITH RECURSIVE task_ancestors AS (
                    SELECT id, name, parent_task_id, 0 as depth
                    FROM tasks
                    WHERE id = {0} AND is_deleted = false
                    
                    UNION ALL
                    
                    SELECT t.id, t.name, t.parent_task_id, ta.depth + 1
                    FROM tasks t
                    INNER JOIN task_ancestors ta ON t.id = ta.parent_task_id
                    WHERE t.is_deleted = false
                )
                SELECT id as TaskId, name as Name, parent_task_id as ParentTaskId, depth as Depth
                FROM task_ancestors 
                WHERE depth > 0 
                ORDER BY depth DESC";

            return await _context.Database
                .SqlQueryRaw<TaskHierarchyDto>(sql, taskId)
                .ToListAsync(ct);
        }
        else
        {
            // Fallback for in-memory database: manually traverse up the tree
            var ancestors = new List<TaskHierarchyDto>();
            var task = await _context.Tasks.AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == taskId && !t.IsDeleted, ct);
            
            if (task == null) return ancestors;
            
            var depth = 1;
            var currentParentId = task.ParentTaskId;
            
            while (currentParentId.HasValue && depth <= 20) // Safety limit
            {
                var parent = await _context.Tasks.AsNoTracking()
                    .FirstOrDefaultAsync(t => t.Id == currentParentId.Value && !t.IsDeleted, ct);
                    
                if (parent == null) break;
                
                ancestors.Add(new TaskHierarchyDto
                {
                    TaskId = parent.Id,
                    Name = parent.Name,
                    ParentTaskId = parent.ParentTaskId,
                    Depth = depth,
                    HasChildren = true
                });
                
                currentParentId = parent.ParentTaskId;
                depth++;
            }
            
            // Reverse to get farthest ancestor first
            ancestors.Reverse();
            // Re-calculate depths
            for (int i = 0; i < ancestors.Count; i++)
            {
                ancestors[i].Depth = ancestors.Count - i;
            }
            
            return ancestors;
        }
    }

    public async System.Threading.Tasks.Task<List<TaskHierarchyDto>> GetDescendantsAsync(Guid taskId, CancellationToken ct = default)
    {
        // Check if we're using a relational database
        if (_context.Database.IsRelational())
        {
            var sql = @"
                WITH RECURSIVE task_tree AS (
                    SELECT id, name, parent_task_id, 0 as depth
                    FROM tasks
                    WHERE id = {0} AND is_deleted = false
                    
                    UNION ALL
                    
                    SELECT t.id, t.name, t.parent_task_id, tt.depth + 1
                    FROM tasks t
                    INNER JOIN task_tree tt ON t.parent_task_id = tt.id
                    WHERE t.is_deleted = false AND tt.depth < 15
                )
                SELECT id as TaskId, name as Name, parent_task_id as ParentTaskId, depth as Depth
                FROM task_tree 
                WHERE depth > 0 
                ORDER BY depth, name";

            return await _context.Database
                .SqlQueryRaw<TaskHierarchyDto>(sql, taskId)
                .ToListAsync(ct);
        }
        else
        {
            // Fallback for in-memory database: manually traverse down the tree
            var descendants = new List<TaskHierarchyDto>();
            var queue = new Queue<(Guid id, int depth)>();
            queue.Enqueue((taskId, 0));
            
            while (queue.Count > 0)
            {
                var (currentId, currentDepth) = queue.Dequeue();
                
                if (currentDepth >= 15) continue; // Enforce depth limit
                
                var children = await _context.Tasks.AsNoTracking()
                    .Where(t => t.ParentTaskId == currentId && !t.IsDeleted)
                    .ToListAsync(ct);
                
                foreach (var child in children)
                {
                    descendants.Add(new TaskHierarchyDto
                    {
                        TaskId = child.Id,
                        Name = child.Name,
                        ParentTaskId = child.ParentTaskId,
                        Depth = currentDepth + 1,
                        HasChildren = false // Will be updated later
                    });
                    
                    queue.Enqueue((child.Id, currentDepth + 1));
                }
            }
            
            return descendants.OrderBy(d => d.Depth).ThenBy(d => d.Name).ToList();
        }
    }

    public async System.Threading.Tasks.Task<int> GetTaskDepthAsync(Guid taskId, CancellationToken ct = default)
    {
        // Check if we're using a relational database
        if (_context.Database.IsRelational())
        {
            var sql = $@"
                WITH RECURSIVE task_ancestors AS (
                    SELECT id, parent_task_id, 0 as depth
                    FROM tasks
                    WHERE id = '{taskId}' AND is_deleted = false
                    
                    UNION ALL
                    
                    SELECT t.id, t.parent_task_id, ta.depth + 1
                    FROM tasks t
                    INNER JOIN task_ancestors ta ON t.id = ta.parent_task_id
                    WHERE t.is_deleted = false
                )
                SELECT COALESCE(MAX(depth), 0) as ""Value"" FROM task_ancestors";

            var result = await _context.Database
                .SqlQueryRaw<int>(sql)
                .FirstOrDefaultAsync(ct);

            return result;
        }
        else
        {
            // Fallback for in-memory database: manually count ancestors
            var task = await _context.Tasks.AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == taskId && !t.IsDeleted, ct);
            
            if (task == null) return 0;
            
            var depth = 0;
            var currentParentId = task.ParentTaskId;
            
            while (currentParentId.HasValue && depth <= 20) // Safety limit
            {
                var parent = await _context.Tasks.AsNoTracking()
                    .FirstOrDefaultAsync(t => t.Id == currentParentId.Value && !t.IsDeleted, ct);
                    
                if (parent == null) break;
                
                depth++;
                currentParentId = parent.ParentTaskId;
            }
            
            return depth;
        }
    }

    public async System.Threading.Tasks.Task<bool> IsDescendantOfAsync(Guid taskId, Guid potentialAncestorId, CancellationToken ct = default)
    {
        // Check if we're using a relational database
        if (_context.Database.IsRelational())
        {
            var sql = $@"
                WITH RECURSIVE task_tree AS (
                    SELECT id, parent_task_id
                    FROM tasks
                    WHERE id = '{potentialAncestorId}' AND is_deleted = false
                    
                    UNION ALL
                    
                    SELECT t.id, t.parent_task_id
                    FROM tasks t
                    INNER JOIN task_tree tt ON t.parent_task_id = tt.id
                    WHERE t.is_deleted = false
                )
                SELECT COUNT(*) as ""Value"" FROM task_tree WHERE id = '{taskId}'";

            var count = await _context.Database
                .SqlQueryRaw<int>(sql)
                .FirstOrDefaultAsync(ct);

            return count > 0;
        }
        else
        {
            // Fallback for in-memory database: manually check descendants
            var queue = new Queue<Guid>();
            queue.Enqueue(potentialAncestorId);
            var visited = new HashSet<Guid>();
            
            while (queue.Count > 0)
            {
                var currentId = queue.Dequeue();
                
                if (visited.Contains(currentId)) continue;
                visited.Add(currentId);
                
                if (currentId == taskId) return true;
                
                var children = await _context.Tasks.AsNoTracking()
                    .Where(t => t.ParentTaskId == currentId && !t.IsDeleted)
                    .Select(t => t.Id)
                    .ToListAsync(ct);
                
                foreach (var childId in children)
                {
                    queue.Enqueue(childId);
                }
            }
            
            return false;
        }
    }

    public async System.Threading.Tasks.Task<Dictionary<Guid, TaskTimeRollup>> GetTimeRollupsAsync(IEnumerable<Guid> taskIds, CancellationToken ct = default)
    {
        var taskIdList = taskIds.ToList();
        if (!taskIdList.Any())
        {
            return new Dictionary<Guid, TaskTimeRollup>();
        }

        // Check if we're using a relational database
        if (_context.Database.IsRelational())
        {
            // Use recursive CTE to calculate time rollup for all tasks efficiently
            var taskIdsParam = string.Join(",", taskIdList.Select(id => $"'{id}'"));
            
            var sql = $@"
                WITH RECURSIVE task_hierarchy AS (
                    -- Base case: start with requested tasks
                    SELECT id, parent_task_id, id as root_task_id
                    FROM tasks
                    WHERE id = ANY(ARRAY[{taskIdsParam}]::uuid[]) AND is_deleted = false
                    
                    UNION ALL
                    
                    -- Recursive case: find all descendants
                    SELECT t.id, t.parent_task_id, th.root_task_id
                    FROM tasks t
                    INNER JOIN task_hierarchy th ON t.parent_task_id = th.id
                    WHERE t.is_deleted = false
                ),
                direct_time AS (
                    SELECT task_id, SUM(minutes) as direct_minutes
                    FROM time_entries
                    WHERE task_id = ANY(ARRAY[{taskIdsParam}]::uuid[])
                    GROUP BY task_id
                ),
                descendant_time AS (
                    SELECT 
                        th.root_task_id,
                        SUM(te.minutes) as children_minutes
                    FROM task_hierarchy th
                    INNER JOIN time_entries te ON te.task_id = th.id
                    WHERE th.id != th.root_task_id
                    GROUP BY th.root_task_id
                )
                SELECT 
                    t.id as TaskId,
                    COALESCE(dt.direct_minutes, 0)::integer as DirectLoggedMinutes,
                    COALESCE(dest.children_minutes, 0)::integer as ChildrenLoggedMinutes
                FROM tasks t
                LEFT JOIN direct_time dt ON dt.task_id = t.id
                LEFT JOIN descendant_time dest ON dest.root_task_id = t.id
                WHERE t.id = ANY(ARRAY[{taskIdsParam}]::uuid[]) AND t.is_deleted = false";

            var results = await _context.Database
                .SqlQueryRaw<TaskTimeRollup>(sql)
                .ToListAsync(ct);

            return results.ToDictionary(r => r.TaskId, r => r);
        }
        else
        {
            // Fallback for in-memory database: calculate manually
            var results = new Dictionary<Guid, TaskTimeRollup>();
            
            foreach (var taskId in taskIdList)
            {
                var task = await _context.Tasks
                    .AsNoTracking()
                    .Include(t => t.TimeEntries)
                    .FirstOrDefaultAsync(t => t.Id == taskId && !t.IsDeleted, ct);
                
                if (task == null) continue;
                
                var directMinutes = task.TimeEntries?.Sum(te => te.Minutes) ?? 0;
                var childrenMinutes = await CalculateDescendantTimeAsync(taskId, ct);
                
                results[taskId] = new TaskTimeRollup
                {
                    TaskId = taskId,
                    DirectLoggedMinutes = directMinutes,
                    ChildrenLoggedMinutes = childrenMinutes
                };
            }
            
            return results;
        }
    }

    public async System.Threading.Tasks.Task<List<Guid>> GetAncestorIdsAsync(Guid taskId, CancellationToken ct = default)
    {
        // Check if we're using a relational database
        if (_context.Database.IsRelational())
        {
            var sql = @"
                WITH RECURSIVE task_ancestors AS (
                    SELECT id, parent_task_id, 0 as depth
                    FROM tasks
                    WHERE id = {0} AND is_deleted = false
                    
                    UNION ALL
                    
                    SELECT t.id, t.parent_task_id, ta.depth + 1
                    FROM tasks t
                    INNER JOIN task_ancestors ta ON t.id = ta.parent_task_id
                    WHERE t.is_deleted = false AND ta.depth < 15
                )
                SELECT id
                FROM task_ancestors 
                WHERE depth > 0 
                ORDER BY depth DESC";

            var results = await _context.Database
                .SqlQueryRaw<Guid>(sql, taskId)
                .ToListAsync(ct);

            return results;
        }
        else
        {
            // Fallback for in-memory database: manually traverse up
            var ancestors = new List<Guid>();
            var currentTaskId = taskId;
            var maxDepth = 15;
            var depth = 0;
            
            while (depth < maxDepth)
            {
                var task = await _context.Tasks
                    .AsNoTracking()
                    .FirstOrDefaultAsync(t => t.Id == currentTaskId && !t.IsDeleted, ct);
                
                if (task?.ParentTaskId == null) break;
                
                ancestors.Add(task.ParentTaskId.Value);
                currentTaskId = task.ParentTaskId.Value;
                depth++;
            }
            
            return ancestors;
        }
    }

    private async System.Threading.Tasks.Task<int> CalculateDescendantTimeAsync(Guid taskId, CancellationToken ct)
    {
        var children = await _context.Tasks
            .AsNoTracking()
            .Where(t => t.ParentTaskId == taskId && !t.IsDeleted)
            .ToListAsync(ct);
        
        if (!children.Any()) return 0;
        
        var totalMinutes = 0;
        
        foreach (var child in children)
        {
            // Get direct time for this child
            var childTimeEntries = await _context.TimeEntries
                .AsNoTracking()
                .Where(te => te.TaskId == child.Id)
                .ToListAsync(ct);
            
            totalMinutes += childTimeEntries.Sum(te => te.Minutes);
            
            // Recursively calculate descendant time
            totalMinutes += await CalculateDescendantTimeAsync(child.Id, ct);
        }
        
        return totalMinutes;
    }

    public async System.Threading.Tasks.Task<List<TaskEntity>> GetTasksForTimelineAsync(
        Guid userId, 
        TimelineQueryDto queryDto, 
        CancellationToken ct = default)
    {
        // Base query: tasks owned by or assigned to user, with due dates in range
        var query = _context.Tasks
            .AsNoTracking()
            .Include(t => t.TaskAssignments)
                .ThenInclude(ta => ta.User)
            .Include(t => t.ParentTask)
            .Where(t => !t.IsDeleted && t.DueDate != null);

        // Date range filter (only tasks with due dates within range)
        query = query.Where(t => t.DueDate >= queryDto.StartDate && t.DueDate <= queryDto.EndDate);

        // Authorization: user's own tasks OR tasks where user is assigned
        var userAssignedTaskIds = await _context.TaskAssignments
            .Where(ta => ta.UserId == userId)
            .Select(ta => ta.TaskId)
            .ToListAsync(ct);

        query = query.Where(t => t.CreatedByUserId == userId || userAssignedTaskIds.Contains(t.Id));

        // Optional filters
        if (queryDto.AssigneeId.HasValue)
        {
            var assigneeTaskIds = await _context.TaskAssignments
                .Where(ta => ta.UserId == queryDto.AssigneeId.Value)
                .Select(ta => ta.TaskId)
                .ToListAsync(ct);
            
            query = query.Where(t => assigneeTaskIds.Contains(t.Id));
        }

        if (queryDto.Status.HasValue)
        {
            query = query.Where(t => t.Status == queryDto.Status.Value);
        }

        if (queryDto.Priority.HasValue)
        {
            query = query.Where(t => t.Priority == queryDto.Priority.Value);
        }

        // Get matching tasks
        var matchingTasks = await query
            .OrderBy(t => t.DueDate)
            .ToListAsync(ct);

        // Get unique parent task IDs from matching tasks
        var parentTaskIds = matchingTasks
            .Where(t => t.ParentTaskId.HasValue)
            .Select(t => t.ParentTaskId!.Value)
            .Distinct()
            .ToList();

        // Fetch parent tasks (even if their due dates are outside the range)
        var parentTasks = new List<TaskEntity>();
        if (parentTaskIds.Any())
        {
            parentTasks = await _context.Tasks
                .AsNoTracking()
                .Include(t => t.TaskAssignments)
                    .ThenInclude(ta => ta.User)
                .Where(t => parentTaskIds.Contains(t.Id) && !t.IsDeleted)
                .ToListAsync(ct);
        }

        // Combine matching tasks and their parents, removing duplicates
        var allTasks = matchingTasks
            .Concat(parentTasks)
            .GroupBy(t => t.Id)
            .Select(g => g.First())
            .OrderBy(t => t.DueDate ?? DateTime.MaxValue)
            .ToList();

        return allTasks;
    }
}
