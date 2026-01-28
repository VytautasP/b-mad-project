using Microsoft.EntityFrameworkCore;
using TaskFlow.Abstractions.Entities;
using TaskFlow.Abstractions.Interfaces.Repositories;
using TaskFlow.Infrastructure.Data;

namespace TaskFlow.Infrastructure.Repositories;

public class TaskAssignmentRepository : ITaskAssignmentRepository
{
    private readonly ApplicationDbContext _context;

    public TaskAssignmentRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async System.Threading.Tasks.Task<TaskAssignment?> GetAssignmentAsync(Guid taskId, Guid userId, CancellationToken cancellationToken)
    {
        return await _context.TaskAssignments
            .AsNoTracking()
            .Include(ta => ta.User)
            .Include(ta => ta.AssignedByUser)
            .FirstOrDefaultAsync(ta => ta.TaskId == taskId && ta.UserId == userId, cancellationToken);
    }

    public async System.Threading.Tasks.Task<List<TaskAssignment>> GetTaskAssignmentsAsync(Guid taskId, CancellationToken cancellationToken)
    {
        return await _context.TaskAssignments
            .AsNoTracking()
            .Include(ta => ta.User)
            .Include(ta => ta.AssignedByUser)
            .Where(ta => ta.TaskId == taskId)
            .ToListAsync(cancellationToken);
    }

    public async System.Threading.Tasks.Task<List<TaskAssignment>> GetUserAssignmentsAsync(Guid userId, CancellationToken cancellationToken)
    {
        return await _context.TaskAssignments
            .AsNoTracking()
            .Include(ta => ta.Task)
            .Where(ta => ta.UserId == userId)
            .ToListAsync(cancellationToken);
    }

    public async System.Threading.Tasks.Task AddAssignmentAsync(TaskAssignment assignment, CancellationToken cancellationToken)
    {
        await _context.TaskAssignments.AddAsync(assignment, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async System.Threading.Tasks.Task RemoveAssignmentAsync(TaskAssignment assignment, CancellationToken cancellationToken)
    {
        _context.TaskAssignments.Remove(assignment);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async System.Threading.Tasks.Task<bool> IsUserAssignedToTaskAsync(Guid taskId, Guid userId, CancellationToken cancellationToken)
    {
        return await _context.TaskAssignments
            .AsNoTracking()
            .AnyAsync(ta => ta.TaskId == taskId && ta.UserId == userId, cancellationToken);
    }
}
