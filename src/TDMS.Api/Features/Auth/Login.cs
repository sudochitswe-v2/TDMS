using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;

namespace TDMS.Api.Features.Auth;

public class Login
{
    private readonly AppDbContext _context;
    private readonly ITokenService _tokenService;

    public Login(AppDbContext context, ITokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    public async Task<ServiceResult<AuthResponse>> ExecuteAsync(LoginRequest request)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return ServiceResult<AuthResponse>.BadRequest("Invalid email or password");
        }

        if (!user.IsActive)
        {
            return ServiceResult<AuthResponse>.BadRequest("User account has been suspended");
        }

        var authResponse = await _tokenService.GenerateTokenAsync(user);
        return ServiceResult<AuthResponse>.Ok(authResponse);
    }
}
