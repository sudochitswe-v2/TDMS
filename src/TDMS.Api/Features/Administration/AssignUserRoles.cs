using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;
using TDMS.Api.Database.Entities;

namespace TDMS.Api.Features.Administration;

public class AssignUserRoles
{
    private readonly AppDbContext _context;

    public AssignUserRoles(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ServiceResult<MessageResponse>> ExecuteAsync(string id, AssignRolesRequest request)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null) return ServiceResult<MessageResponse>.NotFound("User not found");

        var targetRoleNames = (request.RoleNames ?? []).Distinct().ToList();
        var targetRoles = await _context.Roles
            .Where(r => targetRoleNames.Contains(r.Name))
            .ToListAsync();

        // Protected rule: cannot strip SystemAdmin role from the last active SystemAdmin
        var currentIsSysAdmin = user.UserRoles.Any(ur => ur.Role.Name == "SystemAdmin");
        var targetWillHaveSysAdmin = targetRoles.Any(r => r.Name == "SystemAdmin");

        if (currentIsSysAdmin && !targetWillHaveSysAdmin)
        {
            var activeSysAdminCount = await _context.UserRoles
                .CountAsync(ur => ur.Role.Name == "SystemAdmin");

            if (activeSysAdminCount <= 1)
            {
                return ServiceResult<MessageResponse>.BadRequest("Cannot remove SystemAdmin role: at least one System Admin must exist");
            }
        }

        _context.UserRoles.RemoveRange(user.UserRoles);
        foreach (var role in targetRoles)
        {
            _context.UserRoles.Add(new UserRole
            {
                UserId = user.Id,
                RoleId = role.Id
            });
        }

        await _context.SaveChangesAsync();
        return ServiceResult<MessageResponse>.Ok(new MessageResponse("User roles updated successfully"));
    }
}
