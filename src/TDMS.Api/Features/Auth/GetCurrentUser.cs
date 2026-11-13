using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;

namespace TDMS.Api.Features.Auth;

public class GetCurrentUser
{
    private readonly AppDbContext _context;
    private readonly ICurrentUser _currentUser;
    private readonly ITokenService _tokenService;

    public GetCurrentUser(AppDbContext context, ICurrentUser currentUser, ITokenService tokenService)
    {
        _context = context;
        _currentUser = currentUser;
        _tokenService = tokenService;
    }

    public async Task<ServiceResult<AuthResponse>> ExecuteAsync()
    {
        if (!_currentUser.IsAuthenticated || string.IsNullOrEmpty(_currentUser.UserId))
        {
            return ServiceResult<AuthResponse>.Unauthorized();
        }

        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == _currentUser.UserId);

        if (user == null)
        {
            return ServiceResult<AuthResponse>.NotFound("User not found");
        }

        var authResponse = await _tokenService.GenerateTokenAsync(user);
        return ServiceResult<AuthResponse>.Ok(authResponse);
    }
}
