using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;
using TDMS.Api.Database.Entities;

namespace TDMS.Api.Features.Administration;

public class UpdateRoleClaims
{
    private readonly AppDbContext _context;

    public UpdateRoleClaims(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ServiceResult<MessageResponse>> ExecuteAsync(string id, UpdateRoleClaimsRequest request)
    {
        var role = await _context.Roles
            .Include(r => r.RoleClaims)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (role == null) return ServiceResult<MessageResponse>.NotFound("Role not found");

        // Protected rule: cannot revoke core claims from SystemAdmin role
        if (role.Name == "SystemAdmin")
        {
            var targetClaims = (request.Claims ?? []).ToHashSet();
            var missingPermissions = ResourceNames.AllPermissions.Where(p => !targetClaims.Contains(p)).ToList();
            var missingControls = UIControlNames.All.Where(c => !targetClaims.Contains(c)).ToList();

            if (missingPermissions.Count > 0 || missingControls.Count > 0)
            {
                return ServiceResult<MessageResponse>.BadRequest("Cannot revoke core System Admin access. SystemAdmin role must retain 100% of platform permissions and UI controls.");
            }
        }

        _context.RoleClaims.RemoveRange(role.RoleClaims);
        var distinctClaims = (request.Claims ?? []).Distinct();

        foreach (var claim in distinctClaims)
        {
            _context.RoleClaims.Add(new RoleClaim
            {
                RoleId = role.Id,
                ClaimType = claim,
                ClaimValue = "true"
            });
        }

        await _context.SaveChangesAsync();
        return ServiceResult<MessageResponse>.Ok(new MessageResponse("Role permissions updated successfully"));
    }
}
