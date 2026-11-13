using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using TDMS.Api.Database;
using TDMS.Api.Database.Entities;

namespace TDMS.Api.Features.Auth;

public record AuthResponse(
    string Token,
    DateTime ExpiresAt,
    string UserId,
    string Email,
    string FullName,
    IReadOnlyList<string> Roles,
    IReadOnlyDictionary<string, string> Claims,
    string? AccountSubType = null,
    string? TutorVerificationStatus = null
);

public interface ITokenService
{
    Task<AuthResponse> GenerateTokenAsync(User user);
}

public class TokenService : ITokenService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public TokenService(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<AuthResponse> GenerateTokenAsync(User user)
    {
        // 1. Resolve roles
        var roles = await _context.UserRoles
            .Where(ur => ur.UserId == user.Id)
            .Include(ur => ur.Role)
            .Select(ur => ur.Role)
            .ToListAsync();

        var roleNames = roles.Select(r => r.Name).ToList();

        // 2. Query all RoleClaim records belonging to those roles & deduplicate
        var roleIds = roles.Select(r => r.Id).ToList();
        var claims = await _context.RoleClaims
            .Where(rc => roleIds.Contains(rc.RoleId))
            .Select(rc => new { rc.ClaimType, rc.ClaimValue })
            .Distinct()
            .ToListAsync();

        var claimsDict = claims.ToDictionary(c => c.ClaimType, c => c.ClaimValue);

        // 3. Assemble JWT claims
        var tokenClaims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Email),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new("userid", user.Id),
            new(ClaimTypes.NameIdentifier, user.Id),
            new("email", user.Email),
            new(ClaimTypes.Email, user.Email),
            new("name", user.FullName),
            new(ClaimTypes.Name, user.FullName)
        };

        // Add discrete role claims
        foreach (var role in roleNames)
        {
            tokenClaims.Add(new Claim("role", role));
            tokenClaims.Add(new Claim(ClaimTypes.Role, role));
        }

        // Add flattened permission claims
        foreach (var claim in claims)
        {
            tokenClaims.Add(new Claim(claim.ClaimType, claim.ClaimValue));
        }

        // 4. Issue signed JWT
        var jwtKey = _configuration["Jwt:Key"] ?? "TDMS_Super_Secret_Jwt_Security_Key_For_Claims_And_RBAC_Authorization_2026_!";
        var issuer = _configuration["Jwt:Issuer"] ?? "TDMS.Api";
        var audience = _configuration["Jwt:Audience"] ?? "TDMS.Spa";
        var expiryMinutes = int.TryParse(_configuration["Jwt:ExpiryMinutes"], out var mins) ? mins : 1440;
        var expiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes);

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(tokenClaims),
            Expires = expiresAt,
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = creds
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var securityToken = tokenHandler.CreateToken(tokenDescriptor);
        var tokenString = tokenHandler.WriteToken(securityToken);

        // Resolve optional profile flags
        var learnerProfile = await _context.LearnerProfiles.FirstOrDefaultAsync(lp => lp.UserId == user.Id);
        var tutorProfile = await _context.TutorProfiles.FirstOrDefaultAsync(tp => tp.UserId == user.Id);

        return new AuthResponse(
            Token: tokenString,
            ExpiresAt: expiresAt,
            UserId: user.Id,
            Email: user.Email,
            FullName: user.FullName,
            Roles: roleNames,
            Claims: claimsDict,
            AccountSubType: learnerProfile?.AccountSubType,
            TutorVerificationStatus: tutorProfile?.VerificationStatus
        );
    }
}
