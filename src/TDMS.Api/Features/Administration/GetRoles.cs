using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;

namespace TDMS.Api.Features.Administration;

public record RoleItemDto(string Id, string Name, string? Description, List<string> Claims);

public record AdminRolesResponse(
    List<RoleItemDto> Roles,
    IReadOnlyList<string> AllPermissions,
    IReadOnlyList<string> AllUIControls
);

public class GetRoles
{
    private readonly AppDbContext _context;

    public GetRoles(AppDbContext context)
    {
        _context = context;
    }

    public async Task<AdminRolesResponse> ExecuteAsync()
    {
        var roles = await _context.Roles
            .Include(r => r.RoleClaims)
            .OrderBy(r => r.Name)
            .Select(r => new RoleItemDto(
                r.Id,
                r.Name,
                r.Description,
                r.RoleClaims.Select(rc => rc.ClaimType).ToList()
            ))
            .ToListAsync();

        return new AdminRolesResponse(
            Roles: roles,
            AllPermissions: ResourceNames.AllPermissions,
            AllUIControls: UIControlNames.All
        );
    }
}
