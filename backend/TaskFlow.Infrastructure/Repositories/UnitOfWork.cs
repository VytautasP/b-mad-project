using TaskFlow.Abstractions.Interfaces;
using TaskFlow.Abstractions.Interfaces.Repositories;
using TaskFlow.Infrastructure.Data;

namespace TaskFlow.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    private IUserRepository? _users;
    private ITaskRepository? _tasks;
    private ITaskAssignmentRepository? _taskAssignments;
    private ITimeEntryRepository? _timeEntries;
    private ICommentRepository? _comments;
    private IActivityLogRepository? _activityLogs;

    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
    }

    public IUserRepository Users => _users ??= new UserRepository(_context);
    public ITaskRepository Tasks => _tasks ??= new TaskRepository(_context);
    public ITaskAssignmentRepository TaskAssignments => _taskAssignments ??= new TaskAssignmentRepository(_context);
    public ITimeEntryRepository TimeEntries => _timeEntries ??= new TimeEntryRepository(_context);
    public ICommentRepository Comments => _comments ??= new CommentRepository(_context);
    public IActivityLogRepository ActivityLogs => _activityLogs ??= new ActivityLogRepository(_context);

    public async Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        return await _context.SaveChangesAsync(ct);
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}