using Microsoft.EntityFrameworkCore;
using TaskFlow.Abstractions.Constants;
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
            .Where(t => t.Id == id && !t.IsDeleted)
            .FirstOrDefaultAsync(ct);
    }

    public async System.Threading.Tasks.Task<List<TaskEntity>> GetUserTasksAsync(Guid userId, TaskFlow.Abstractions.Constants.TaskStatus? status, CancellationToken ct = default)
    {
        var query = _context.Tasks
            .AsNoTracking()
            .Where(t => t.CreatedByUserId == userId && !t.IsDeleted);

        if (status.HasValue)
        {
            query = query.Where(t => t.Status == status.Value);
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
}