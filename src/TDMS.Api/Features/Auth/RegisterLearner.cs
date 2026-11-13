using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;
using TDMS.Api.Database.Entities;

namespace TDMS.Api.Features.Auth;

public class RegisterLearner
{
    private readonly AppDbContext _context;
    private readonly ITokenService _tokenService;

    public RegisterLearner(AppDbContext context, ITokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    public async Task<ServiceResult<AuthResponse>> ExecuteAsync(RegisterLearnerRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password) || string.IsNullOrWhiteSpace(request.FullName))
        {
            return ServiceResult<AuthResponse>.BadRequest("FullName, Email, and Password are required");
        }

        var subType = request.AccountSubType.Equals("Parent", StringComparison.OrdinalIgnoreCase) ? "Parent" : "Student";

        var exists = await _context.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower());
        if (exists)
        {
            return ServiceResult<AuthResponse>.Conflict("An account with this email already exists");
        }

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = request.Email.Trim().ToLower(),
            UserName = request.Email.Trim().ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            IsActive = true
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Assign ParentStudent Role
        var parentStudentRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "ParentStudent");
        if (parentStudentRole != null)
        {
            _context.UserRoles.Add(new UserRole
            {
                UserId = user.Id,
                RoleId = parentStudentRole.Id
            });
        }

        // Create Learner Profile
        var learnerProfile = new LearnerProfile
        {
            UserId = user.Id,
            AccountSubType = subType,
            GradeLevel = request.GradeLevel,
            PreferredMaxHourlyFee = request.PreferredMaxHourlyFee,
            PreferredTeachingMode = request.PreferredTeachingMode
        };

        _context.LearnerProfiles.Add(learnerProfile);
        await _context.SaveChangesAsync();

        var authResponse = await _tokenService.GenerateTokenAsync(user);
        return ServiceResult<AuthResponse>.Ok(authResponse);
    }
}
