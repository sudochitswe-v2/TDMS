using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;
using TDMS.Api.Database.Entities;

namespace TDMS.Api.Features.Auth;

public class RegisterTutor
{
    private readonly AppDbContext _context;
    private readonly ITokenService _tokenService;

    public RegisterTutor(AppDbContext context, ITokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    public async Task<ServiceResult<AuthResponse>> ExecuteAsync(RegisterTutorRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password) || string.IsNullOrWhiteSpace(request.FullName))
        {
            return ServiceResult<AuthResponse>.BadRequest("FullName, Email, and Password are required");
        }

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

        // Assign Tutor Role
        var tutorRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Tutor");
        if (tutorRole != null)
        {
            _context.UserRoles.Add(new UserRole
            {
                UserId = user.Id,
                RoleId = tutorRole.Id
            });
        }

        // Default basic subscription package
        var basicPackage = await _context.SubscriptionPackages.FirstOrDefaultAsync(s => s.TierName.Contains("Basic"));

        // Create Tutor Profile with Pending status
        var tutorProfile = new TutorProfile
        {
            UserId = user.Id,
            Headline = request.Headline ?? "Passionate Educator",
            Biography = request.Biography,
            YearsOfExperience = request.YearsOfExperience,
            HourlyFee = request.HourlyFee,
            TeachingMode = request.TeachingMode,
            VerificationStatus = "Pending",
            CurrentSubscriptionPackageId = basicPackage?.Id,
            IsPublished = false
        };

        _context.TutorProfiles.Add(tutorProfile);
        await _context.SaveChangesAsync();

        var authResponse = await _tokenService.GenerateTokenAsync(user);
        return ServiceResult<AuthResponse>.Ok(authResponse);
    }
}
