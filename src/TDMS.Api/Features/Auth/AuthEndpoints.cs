using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;
using TDMS.Api.Database.Entities;

namespace TDMS.Api.Features.Auth;

public record LoginRequest(string Email, string Password);

public record RegisterLearnerRequest(
    string FullName,
    string Email,
    string Password,
    string AccountSubType, // "Parent" or "Student"
    string? GradeLevel = null,
    decimal PreferredMaxHourlyFee = 50.0m,
    string PreferredTeachingMode = "Both"
);

public record RegisterTutorRequest(
    string FullName,
    string Email,
    string Password,
    string? Headline = null,
    string? Biography = null,
    int YearsOfExperience = 1,
    decimal HourlyFee = 35.0m,
    string TeachingMode = "Online"
);

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/auth").WithTags("Authentication");

        // POST /api/auth/login
        group.MapPost("/login", async (LoginRequest request, AppDbContext context, ITokenService tokenService) =>
        {
            var user = await context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return Results.BadRequest(new { error = "Invalid email or password" });
            }

            if (!user.IsActive)
            {
                return Results.BadRequest(new { error = "User account has been suspended" });
            }

            var authResponse = await tokenService.GenerateTokenAsync(user);
            return Results.Ok(authResponse);
        })
        .AllowAnonymous();

        // POST /api/auth/register/learner
        group.MapPost("/register/learner", async (RegisterLearnerRequest request, AppDbContext context, ITokenService tokenService) =>
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password) || string.IsNullOrWhiteSpace(request.FullName))
            {
                return Results.BadRequest(new { error = "FullName, Email, and Password are required" });
            }

            var subType = request.AccountSubType.Equals("Parent", StringComparison.OrdinalIgnoreCase) ? "Parent" : "Student";

            var exists = await context.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower());
            if (exists)
            {
                return Results.Conflict(new { error = "An account with this email already exists" });
            }

            var user = new User
            {
                FullName = request.FullName.Trim(),
                Email = request.Email.Trim().ToLower(),
                UserName = request.Email.Trim().ToLower(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                IsActive = true
            };

            context.Users.Add(user);
            await context.SaveChangesAsync();

            // Assign ParentStudent Role
            var parentStudentRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "ParentStudent");
            if (parentStudentRole != null)
            {
                context.UserRoles.Add(new UserRole
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

            context.LearnerProfiles.Add(learnerProfile);
            await context.SaveChangesAsync();

            var authResponse = await tokenService.GenerateTokenAsync(user);
            return Results.Ok(authResponse);
        })
        .AllowAnonymous();

        // POST /api/auth/register/tutor
        group.MapPost("/register/tutor", async (RegisterTutorRequest request, AppDbContext context, ITokenService tokenService) =>
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password) || string.IsNullOrWhiteSpace(request.FullName))
            {
                return Results.BadRequest(new { error = "FullName, Email, and Password are required" });
            }

            var exists = await context.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower());
            if (exists)
            {
                return Results.Conflict(new { error = "An account with this email already exists" });
            }

            var user = new User
            {
                FullName = request.FullName.Trim(),
                Email = request.Email.Trim().ToLower(),
                UserName = request.Email.Trim().ToLower(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                IsActive = true
            };

            context.Users.Add(user);
            await context.SaveChangesAsync();

            // Assign Tutor Role
            var tutorRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Tutor");
            if (tutorRole != null)
            {
                context.UserRoles.Add(new UserRole
                {
                    UserId = user.Id,
                    RoleId = tutorRole.Id
                });
            }

            // Default basic subscription package
            var basicPackage = await context.SubscriptionPackages.FirstOrDefaultAsync(s => s.TierName.Contains("Basic"));

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

            context.TutorProfiles.Add(tutorProfile);
            await context.SaveChangesAsync();

            var authResponse = await tokenService.GenerateTokenAsync(user);
            return Results.Ok(authResponse);
        })
        .AllowAnonymous();

        // GET /api/auth/me
        group.MapGet("/me", async (ICurrentUser currentUser, AppDbContext context, ITokenService tokenService) =>
        {
            if (!currentUser.IsAuthenticated || string.IsNullOrEmpty(currentUser.UserId))
            {
                return Results.Unauthorized();
            }

            var user = await context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == currentUser.UserId);

            if (user == null)
            {
                return Results.NotFound();
            }

            var authResponse = await tokenService.GenerateTokenAsync(user);
            return Results.Ok(authResponse);
        })
        .RequireAuthorization();

        return endpoints;
    }
}
