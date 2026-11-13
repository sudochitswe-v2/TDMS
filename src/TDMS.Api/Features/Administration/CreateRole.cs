using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;
using TDMS.Api.Database.Entities;

namespace TDMS.Api.Features.Administration;

public class CreateRole
{
    private readonly AppDbContext _context;

    public CreateRole(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ServiceResult<Role>> ExecuteAsync(CreateRoleRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return ServiceResult<Role>.BadRequest("Role name is required");
        }

        var exists = await _context.Roles.AnyAsync(r => r.Name.ToLower() == request.Name.Trim().ToLower());
        if (exists)
        {
            return ServiceResult<Role>.Conflict("A role with this name already exists");
        }

        var role = new Role
        {
            Name = request.Name.Trim(),
            Description = request.Description?.Trim()
        };

        _context.Roles.Add(role);
        await _context.SaveChangesAsync();
        return ServiceResult<Role>.Ok(role);
    }
}
