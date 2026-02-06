using Microsoft.EntityFrameworkCore;
using TaskFlow.Abstractions.Entities;
using TaskFlow.Abstractions.Interfaces.Repositories;
using TaskFlow.Infrastructure.Data;

namespace TaskFlow.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for Comment entity operations.
/// </summary>
public class CommentRepository : ICommentRepository
{
    private readonly ApplicationDbContext _context;

    public CommentRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async System.Threading.Tasks.Task<Comment> CreateAsync(Comment comment, CancellationToken cancellationToken)
    {
        await _context.Comments.AddAsync(comment, cancellationToken);
        return comment;
    }

    public async System.Threading.Tasks.Task<Comment?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await _context.Comments
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async System.Threading.Tasks.Task<List<Comment>> GetByTaskIdAsync(Guid taskId, CancellationToken cancellationToken)
    {
        return await _context.Comments
            .AsNoTracking()
            .Include(c => c.User)
            .Where(c => c.TaskId == taskId)
            .OrderBy(c => c.CreatedDate)
            .ToListAsync(cancellationToken);
    }

    public System.Threading.Tasks.Task UpdateAsync(Comment comment, CancellationToken cancellationToken)
    {
        _context.Comments.Update(comment);
        return System.Threading.Tasks.Task.CompletedTask;
    }
}