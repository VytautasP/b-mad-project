using Microsoft.EntityFrameworkCore;
using TaskFlow.Abstractions.Entities;
using TaskFlow.Abstractions.Interfaces.Repositories;
using TaskFlow.Infrastructure.Data;

namespace TaskFlow.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _context;

    public UserRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken ct = default)
    {
        return await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == email, ct);
    }

    public async Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id, ct);
    }

    public async Task<bool> EmailExistsAsync(string email, CancellationToken ct = default)
    {
        return await _context.Users
            .AsNoTracking()
            .AnyAsync(u => u.Email == email, ct);
    }

    public async Task<User> CreateAsync(User user, CancellationToken ct = default)
    {
        if (user.Id == Guid.Empty)
            user.Id = Guid.NewGuid();
        
        if (user.CreatedDate == default)
            user.CreatedDate = DateTime.UtcNow;

        await _context.Users.AddAsync(user, ct);
        return user;
    }

    public async Task<List<User>> SearchUsersAsync(string query, int limit, CancellationToken ct = default)
    {
        var normalizedQuery = query.ToLower();
        
        return await _context.Users
            .AsNoTracking()
            .Where(u => u.Name.ToLower().Contains(normalizedQuery) || 
                       u.Email.ToLower().Contains(normalizedQuery))
            .OrderBy(u => u.Name)
            .Take(limit)
            .ToListAsync(ct);
    }

    public async Task<List<User>> GetAllUsersAsync(CancellationToken ct = default)
    {
        return await _context.Users
            .AsNoTracking()
            .OrderBy(u => u.Name)
            .ToListAsync(ct);
    }
}