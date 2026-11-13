using Microsoft.EntityFrameworkCore;
using TDMS.Api.Database;

namespace TDMS.Api.Features.Administration;

public record AdminUserDto(
    string Id,
    string FullName,
    string Email,
    string UserName,
    bool IsActive,
    DateTime CreatedAt,
    List<string> Roles,
    string AccountType,
    string? TutorStatus
);

public class GetUsers
{
    private readonly AppDbContext _context;

    public GetUsers(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<AdminUserDto>> ExecuteAsync()
    {
        var users = await _context.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .Include(u => u.LearnerProfile)
            .Include(u => u.TutorProfile)
            .OrderBy(u => u.FullName)
            .Select(u => new AdminUserDto(
                u.Id,
                u.FullName,
                u.Email,
                u.UserName,
                u.IsActive,
                u.CreatedAt,
                u.UserRoles.Select(ur => ur.Role.Name).ToList(),
                u.TutorProfile != null ? "Tutor" : (u.LearnerProfile != null ? u.LearnerProfile.AccountSubType : "User"),
                u.TutorProfile != null ? u.TutorProfile.VerificationStatus : null
            ))
            .ToListAsync();

        return users;
    }
}
