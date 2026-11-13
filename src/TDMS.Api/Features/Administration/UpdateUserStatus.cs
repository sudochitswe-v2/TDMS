using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;

namespace TDMS.Api.Features.Administration;

public class UpdateUserStatus
{
    private readonly AppDbContext _context;

    public UpdateUserStatus(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ServiceResult<MessageResponse>> ExecuteAsync(string id, UpdateUserStatusRequest request)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null) return ServiceResult<MessageResponse>.NotFound("User not found");

        // Protected rule: cannot deactivate SystemAdmin
        var isSysAdmin = user.UserRoles.Any(ur => ur.Role.Name == "SystemAdmin");
        if (isSysAdmin && !request.IsActive)
        {
            return ServiceResult<MessageResponse>.BadRequest("Cannot deactivate core System Admin user account");
        }

        user.IsActive = request.IsActive;
        await _context.SaveChangesAsync();

        return ServiceResult<MessageResponse>.Ok(new MessageResponse($"User status updated to {(user.IsActive ? "Active" : "Suspended")}"));
    }
}
