using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace TDMS.Api.Abstructions;

public class PermissionRequirement : IAuthorizationRequirement
{
    public string Permission { get; }

    public PermissionRequirement(string permission)
    {
        Permission = permission;
    }
}

public class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        // SystemAdmin role bypasses all permission checks per AGENTS.md
        var isSystemAdmin = context.User.IsInRole("SystemAdmin") ||
                            context.User.HasClaim("role", "SystemAdmin") ||
                            context.User.HasClaim(ClaimTypes.Role, "SystemAdmin");

        if (isSystemAdmin)
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        // Check if user has discrete permission claim
        var hasClaim = context.User.HasClaim(c =>
            c.Type == requirement.Permission &&
            (c.Value.Equals("true", StringComparison.OrdinalIgnoreCase) || !string.IsNullOrWhiteSpace(c.Value)));

        if (hasClaim)
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}
