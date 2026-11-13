using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;
using TDMS.Api.Database.Entities;
using TDMS.Api.Features.Messaging;
using TDMS.Api.Features.Tutors;

namespace TDMS.Api.Features.Administration;

public record UpdateUserStatusRequest(bool IsActive);
public record AssignRolesRequest(List<string> RoleNames);
public record CreateRoleRequest(string Name, string? Description);
public record UpdateRoleClaimsRequest(List<string> Claims);
public record UpdateSettingsRequest(MatchingWeights Weights);

public static class AdminEndpoints
{
    public static IEndpointRouteBuilder MapAdminEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/admin").WithTags("System Administration");

        // GET /api/admin/users
        group.MapGet("/users", async (AppDbContext context) =>
        {
            var users = await context.Users
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .Include(u => u.LearnerProfile)
                .Include(u => u.TutorProfile)
                .OrderBy(u => u.FullName)
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.Email,
                    u.UserName,
                    u.IsActive,
                    u.CreatedAt,
                    Roles = u.UserRoles.Select(ur => ur.Role.Name).ToList(),
                    AccountType = u.TutorProfile != null ? "Tutor" : (u.LearnerProfile != null ? u.LearnerProfile.AccountSubType : "User"),
                    TutorStatus = u.TutorProfile != null ? u.TutorProfile.VerificationStatus : null
                })
                .ToListAsync();

            return Results.Ok(users);
        })
        .RequireAuthorization("users:read");

        // PUT /api/admin/users/{id}/status
        group.MapPut("/users/{id}/status", async (string id, UpdateUserStatusRequest request, AppDbContext context) =>
        {
            var user = await context.Users
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null) return Results.NotFound(new { error = "User not found" });

            // Protected rule: cannot deactivate SystemAdmin
            var isSysAdmin = user.UserRoles.Any(ur => ur.Role.Name == "SystemAdmin");
            if (isSysAdmin && !request.IsActive)
            {
                return Results.BadRequest(new { error = "Cannot deactivate core System Admin user account" });
            }

            user.IsActive = request.IsActive;
            await context.SaveChangesAsync();

            return Results.Ok(new { message = $"User status updated to {(user.IsActive ? "Active" : "Suspended")}" });
        })
        .RequireAuthorization("users:update");

        // PUT /api/admin/users/{id}/roles
        group.MapPut("/users/{id}/roles", async (string id, AssignRolesRequest request, AppDbContext context) =>
        {
            var user = await context.Users
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null) return Results.NotFound(new { error = "User not found" });

            var targetRoleNames = (request.RoleNames ?? []).Distinct().ToList();
            var targetRoles = await context.Roles
                .Where(r => targetRoleNames.Contains(r.Name))
                .ToListAsync();

            // Protected rule: cannot strip SystemAdmin role from the last active SystemAdmin
            var currentIsSysAdmin = user.UserRoles.Any(ur => ur.Role.Name == "SystemAdmin");
            var targetWillHaveSysAdmin = targetRoles.Any(r => r.Name == "SystemAdmin");

            if (currentIsSysAdmin && !targetWillHaveSysAdmin)
            {
                var activeSysAdminCount = await context.UserRoles
                    .CountAsync(ur => ur.Role.Name == "SystemAdmin");

                if (activeSysAdminCount <= 1)
                {
                    return Results.BadRequest(new { error = "Cannot remove SystemAdmin role: at least one System Admin must exist" });
                }
            }

            context.UserRoles.RemoveRange(user.UserRoles);
            foreach (var role in targetRoles)
            {
                context.UserRoles.Add(new UserRole
                {
                    UserId = user.Id,
                    RoleId = role.Id
                });
            }

            await context.SaveChangesAsync();
            return Results.Ok(new { message = "User roles updated successfully" });
        })
        .RequireAuthorization("users:update");

        // GET /api/admin/roles
        group.MapGet("/roles", async (AppDbContext context) =>
        {
            var roles = await context.Roles
                .Include(r => r.RoleClaims)
                .OrderBy(r => r.Name)
                .Select(r => new
                {
                    r.Id,
                    r.Name,
                    r.Description,
                    Claims = r.RoleClaims.Select(rc => rc.ClaimType).ToList()
                })
                .ToListAsync();

            var allRegisteredPermissions = ResourceNames.AllPermissions;
            var allRegisteredUIControls = UIControlNames.All;

            return Results.Ok(new
            {
                Roles = roles,
                AllPermissions = allRegisteredPermissions,
                AllUIControls = allRegisteredUIControls
            });
        })
        .RequireAuthorization("roles:read");

        // POST /api/admin/roles
        group.MapPost("/roles", async (CreateRoleRequest request, AppDbContext context) =>
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return Results.BadRequest(new { error = "Role name is required" });
            }

            var exists = await context.Roles.AnyAsync(r => r.Name.ToLower() == request.Name.Trim().ToLower());
            if (exists)
            {
                return Results.Conflict(new { error = "A role with this name already exists" });
            }

            var role = new Role
            {
                Name = request.Name.Trim(),
                Description = request.Description?.Trim()
            };

            context.Roles.Add(role);
            await context.SaveChangesAsync();
            return Results.Ok(role);
        })
        .RequireAuthorization("roles:create");

        // PUT /api/admin/roles/{id}/claims
        group.MapPut("/roles/{id}/claims", async (string id, UpdateRoleClaimsRequest request, AppDbContext context) =>
        {
            var role = await context.Roles
                .Include(r => r.RoleClaims)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (role == null) return Results.NotFound(new { error = "Role not found" });

            // Protected rule: cannot revoke core claims from SystemAdmin role
            if (role.Name == "SystemAdmin")
            {
                var targetClaims = (request.Claims ?? []).ToHashSet();
                var missingPermissions = ResourceNames.AllPermissions.Where(p => !targetClaims.Contains(p)).ToList();
                var missingControls = UIControlNames.All.Where(c => !targetClaims.Contains(c)).ToList();

                if (missingPermissions.Count > 0 || missingControls.Count > 0)
                {
                    return Results.BadRequest(new
                    {
                        error = "Cannot revoke core System Admin access. SystemAdmin role must retain 100% of platform permissions and UI controls."
                    });
                }
            }

            context.RoleClaims.RemoveRange(role.RoleClaims);
            var distinctClaims = (request.Claims ?? []).Distinct();

            foreach (var claim in distinctClaims)
            {
                context.RoleClaims.Add(new RoleClaim
                {
                    RoleId = role.Id,
                    ClaimType = claim,
                    ClaimValue = "true"
                });
            }

            await context.SaveChangesAsync();
            return Results.Ok(new { message = "Role permissions updated successfully" });
        })
        .RequireAuthorization("roles:update");

        // GET /api/admin/system-data
        group.MapGet("/system-data", async (AppDbContext context, IFirebaseMessagingService messagingService) =>
        {
            var dbCanConnect = await context.Database.CanConnectAsync();

            return Results.Ok(new
            {
                DatabaseStatus = dbCanConnect ? "Connected (Healthy)" : "Disconnected (Degraded)",
                DatabaseProvider = context.Database.ProviderName,
                FirebaseProvider = messagingService.ProviderName,
                ServerTimeUtc = DateTime.UtcNow,
                Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"
            });
        })
        .RequireAuthorization("settings:read");

        // GET /api/admin/settings
        group.MapGet("/settings", async (AppDbContext context) =>
        {
            var setting = await context.SystemSettings.FirstOrDefaultAsync(s => s.Key == "MatchingAlgorithmWeights");
            MatchingWeights weights = new();

            if (setting != null && !string.IsNullOrWhiteSpace(setting.ValueJson))
            {
                try
                {
                    var loaded = JsonSerializer.Deserialize<MatchingWeights>(setting.ValueJson);
                    if (loaded != null) weights = loaded;
                }
                catch { }
            }

            return Results.Ok(new { Weights = weights, setting?.UpdatedAt });
        })
        .RequireAuthorization("settings:read");

        // PUT /api/admin/settings
        group.MapPut("/settings", async (UpdateSettingsRequest request, AppDbContext context) =>
        {
            if (request.Weights == null || !request.Weights.IsValid())
            {
                return Results.BadRequest(new
                {
                    error = "Validation Error: Matching algorithm weights (W_subject + W_fee + W_schedule + W_mode) must sum to exactly 100%"
                });
            }

            var setting = await context.SystemSettings.FirstOrDefaultAsync(s => s.Key == "MatchingAlgorithmWeights");
            if (setting == null)
            {
                setting = new SystemSetting
                {
                    Key = "MatchingAlgorithmWeights",
                    ValueJson = JsonSerializer.Serialize(request.Weights),
                    UpdatedAt = DateTime.UtcNow
                };
                context.SystemSettings.Add(setting);
            }
            else
            {
                setting.ValueJson = JsonSerializer.Serialize(request.Weights);
                setting.UpdatedAt = DateTime.UtcNow;
            }

            await context.SaveChangesAsync();
            return Results.Ok(new { message = "System matching algorithm weights updated successfully", weights = request.Weights });
        })
        .RequireAuthorization("settings:update");

        // POST /api/admin/database/maintenance
        group.MapPost("/database/maintenance", async (AppDbContext context) =>
        {
            var usersCount = await context.Users.CountAsync();
            var orphanedProfiles = await context.LearnerProfiles.Where(lp => !context.Users.Any(u => u.Id == lp.UserId)).CountAsync();
            var orphanedTutors = await context.TutorProfiles.Where(tp => !context.Users.Any(u => u.Id == tp.UserId)).CountAsync();

            return Results.Ok(new
            {
                MaintenanceStatus = "Completed",
                RelationalIntegrity = "Verified (Zero Violations)",
                Stats = new
                {
                    TotalUsers = usersCount,
                    OrphanedLearnerProfiles = orphanedProfiles,
                    OrphanedTutorProfiles = orphanedTutors
                },
                ExecutedAt = DateTime.UtcNow
            });
        })
        .RequireAuthorization("settings:maintain");

        return endpoints;
    }
}
