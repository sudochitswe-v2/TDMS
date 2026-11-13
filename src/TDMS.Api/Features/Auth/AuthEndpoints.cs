using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace TDMS.Api.Features.Auth;

public record LoginRequest(string Email, string Password);

public record RegisterLearnerRequest(
    string FullName,
    string Email,
    string Password,
    string AccountSubType, // "Parent" or "Student"
    string? GradeLevel = null,
    decimal PreferredMaxHourlyFee = 50.0m,
    string PreferredTeachingMode = "Both"
);

public record RegisterTutorRequest(
    string FullName,
    string Email,
    string Password,
    string? Headline = null,
    string? Biography = null,
    int YearsOfExperience = 1,
    decimal HourlyFee = 35.0m,
    string TeachingMode = "Online"
);

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/auth").WithTags("Authentication");

        // POST /api/auth/login
        group.MapPost("/login", async (LoginRequest request, Login feature) =>
        {
            var result = await feature.ExecuteAsync(request);
            return result.ToHttpResult();
        })
        .AllowAnonymous();

        // POST /api/auth/register/learner
        group.MapPost("/register/learner", async (RegisterLearnerRequest request, RegisterLearner feature) =>
        {
            var result = await feature.ExecuteAsync(request);
            return result.ToHttpResult();
        })
        .AllowAnonymous();

        // POST /api/auth/register/tutor
        group.MapPost("/register/tutor", async (RegisterTutorRequest request, RegisterTutor feature) =>
        {
            var result = await feature.ExecuteAsync(request);
            return result.ToHttpResult();
        })
        .AllowAnonymous();

        // GET /api/auth/me
        group.MapGet("/me", async (GetCurrentUser feature) =>
        {
            var result = await feature.ExecuteAsync();
            return result.ToHttpResult();
        })
        .RequireAuthorization();

        return endpoints;
    }
}
