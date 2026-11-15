using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;
using TDMS.Api.Database.Entities;

namespace TDMS.Api.Features.Auth;

public class QuickLogin
{
    private readonly AppDbContext _context;
    private readonly ITokenService _tokenService;

    public QuickLogin(AppDbContext context, ITokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    public async Task<ServiceResult<AuthResponse>> ExecuteAsync(QuickLoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) && string.IsNullOrWhiteSpace(request.UserId))
        {
            return ServiceResult<AuthResponse>.BadRequest("Email or UserId is required");
        }

        var query = _context.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .Include(u => u.LearnerProfile)
            .Include(u => u.TutorProfile)
            .AsQueryable();

        User? user = null;
        if (!string.IsNullOrWhiteSpace(request.UserId))
        {
            user = await query.FirstOrDefaultAsync(u => u.Id == request.UserId);
        }
        else if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var emailLower = request.Email.Trim().ToLower();
            user = await query.FirstOrDefaultAsync(u => u.Email.ToLower() == emailLower);
        }

        if (user == null)
        {
            return ServiceResult<AuthResponse>.NotFound("User account not found");
        }

        if (!user.IsActive)
        {
            return ServiceResult<AuthResponse>.BadRequest("User account has been suspended");
        }

        var authResponse = await _tokenService.GenerateTokenAsync(user);
        return ServiceResult<AuthResponse>.Ok(authResponse);
    }
}
