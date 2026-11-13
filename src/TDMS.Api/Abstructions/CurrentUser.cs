using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace TDMS.Api.Abstructions;

public interface ICurrentUser
{
    string? UserId { get; }
    string? Email { get; }
    IReadOnlyList<string> Roles { get; }
    bool IsAuthenticated { get; }
    bool IsSystemAdmin { get; }
    bool HasClaim(string claimType, string? claimValue = null);
}

public class CurrentUser : ICurrentUser
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUser(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public string? UserId =>
        User?.FindFirst("userid")?.Value ??
        User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    public string? Email =>
        User?.FindFirst(ClaimTypes.Email)?.Value ??
        User?.FindFirst("email")?.Value;

    public IReadOnlyList<string> Roles =>
        User?.FindAll(ClaimTypes.Role).Select(c => c.Value)
            .Concat(User?.FindAll("role").Select(c => c.Value) ?? [])
            .Distinct()
            .ToList() ?? [];

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;

    public bool IsSystemAdmin => Roles.Contains("SystemAdmin");

    public bool HasClaim(string claimType, string? claimValue = null)
    {
        if (User == null) return false;
        if (IsSystemAdmin) return true;

        if (claimValue == null)
        {
            return User.HasClaim(c => c.Type == claimType);
        }

        return User.HasClaim(claimType, claimValue);
    }
}
