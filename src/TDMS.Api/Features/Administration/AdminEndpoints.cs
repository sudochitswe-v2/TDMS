using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using TDMS.Api.Features.Tutors;

namespace TDMS.Api.Features.Administration;

public record UpdateUserStatusRequest(bool IsActive);
public record AssignRolesRequest(List<string> RoleNames);
public record CreateRoleRequest(string Name, string? Description);
public record UpdateRoleClaimsRequest(List<string> Claims);
public record UpdateSettingsRequest(MatchingWeights Weights);

public static class AdminEndpoints
{
    public static IEndpointRouteBuilder MapAdminEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/admin").WithTags("System Administration");

        // GET /api/admin/users
        group.MapGet("/users", async (GetUsers feature) =>
        {
            var result = await feature.ExecuteAsync();
            return Results.Ok(result);
        })
        .RequireAuthorization("users:read");

        // PUT /api/admin/users/{id}/status
        group.MapPut("/users/{id}/status", async (string id, UpdateUserStatusRequest request, UpdateUserStatus feature) =>
        {
            var result = await feature.ExecuteAsync(id, request);
            return result.ToHttpResult();
        })
        .RequireAuthorization("users:update");

        // PUT /api/admin/users/{id}/roles
        group.MapPut("/users/{id}/roles", async (string id, AssignRolesRequest request, AssignUserRoles feature) =>
        {
            var result = await feature.ExecuteAsync(id, request);
            return result.ToHttpResult();
        })
        .RequireAuthorization("users:update");

        // GET /api/admin/roles
        group.MapGet("/roles", async (GetRoles feature) =>
        {
            var result = await feature.ExecuteAsync();
            return Results.Ok(result);
        })
        .RequireAuthorization("roles:read");

        // POST /api/admin/roles
        group.MapPost("/roles", async (CreateRoleRequest request, CreateRole feature) =>
        {
            var result = await feature.ExecuteAsync(request);
            return result.ToHttpResult();
        })
        .RequireAuthorization("roles:create");

        // PUT /api/admin/roles/{id}/claims
        group.MapPut("/roles/{id}/claims", async (string id, UpdateRoleClaimsRequest request, UpdateRoleClaims feature) =>
        {
            var result = await feature.ExecuteAsync(id, request);
            return result.ToHttpResult();
        })
        .RequireAuthorization("roles:update");

        // GET /api/admin/settings
        group.MapGet("/settings", async (GetSettings feature) =>
        {
            var result = await feature.ExecuteAsync();
            return Results.Ok(result);
        })
        .RequireAuthorization("settings:read");

        // PUT /api/admin/settings
        group.MapPut("/settings", async (UpdateSettingsRequest request, UpdateSettings feature) =>
        {
            var result = await feature.ExecuteAsync(request);
            return result.ToHttpResult();
        })
        .RequireAuthorization("settings:update");

        return endpoints;
    }
}
