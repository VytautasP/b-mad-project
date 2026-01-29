using Microsoft.EntityFrameworkCore;
using TaskFlow.Abstractions.Constants;
using TaskFlow.Abstractions.DTOs.Task;
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
}