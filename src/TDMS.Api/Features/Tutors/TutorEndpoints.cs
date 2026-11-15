using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using TDMS.Api.Features.Account;

namespace TDMS.Api.Features.Tutors;

public record TutorCardDto(
    string Id,
    string UserId,
    string FullName,
    string Email,
    string? Headline,
    string? Biography,
    int YearsOfExperience,
    decimal HourlyFee,
    string TeachingMode,
    string VerificationStatus,
    decimal AverageRating,
    int TotalReviewsCount,
    double MatchScore,
    IReadOnlyList<string> Categories,
    string? TierName,
    int PriorityBoost,
    string? ProfilePictureUrl = null
);

public record UpdateTeachingInfoRequest(
    decimal HourlyFee,
    string TeachingMode,
    int YearsOfExperience,
    List<string> CategoryIds,
    List<ScheduleSlotDto> ScheduleSlots
);

public record UpdateCustomizationRequest(
    string? Headline,
    string? Biography,
    string? LayoutThemeJson,
    bool IsPublished
);

public record UpdateProfilePictureRequest(string ProfilePictureBase64);
public record UploadTutorDocumentRequest(string DocumentType, string? FileName, string FileBase64);

public static class TutorEndpoints
{
    public static IEndpointRouteBuilder MapTutorEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/tutors").WithTags("Tutors");

        // GET /api/tutors/search
        group.MapGet("/search", async (
            string? categoryId,
            decimal? minFee,
            decimal? maxFee,
            string? teachingMode,
            byte? dayOfWeek,
            string? search,
            SearchTutors feature) =>
        {
            var results = await feature.ExecuteAsync(categoryId, minFee, maxFee, teachingMode, dayOfWeek, search);
            return Results.Ok(results);
        })
        .AllowAnonymous();

        // GET /api/tutors/{id}
        group.MapGet("/{id}", async (string id, GetTutorById feature) =>
        {
            var result = await feature.ExecuteAsync(id);
            return result.ToHttpResult();
        })
        .AllowAnonymous();

        // GET /api/tutors/me
        group.MapGet("/me", async (GetMyTutorProfile feature) =>
        {
            var result = await feature.ExecuteAsync();
            return result.ToHttpResult();
        })
        .RequireAuthorization("tutors:update");

        // PUT /api/tutors/me/teaching-info
        group.MapPut("/me/teaching-info", async (UpdateTeachingInfoRequest request, UpdateTeachingInfo feature) =>
        {
            var result = await feature.ExecuteAsync(request);
            return result.ToHttpResult();
        })
        .RequireAuthorization("tutors:update");

        // PUT /api/tutors/me/customization
        group.MapPut("/me/customization", async (UpdateCustomizationRequest request, UpdateCustomization feature) =>
        {
            var result = await feature.ExecuteAsync(request);
            return result.ToHttpResult();
        })
        .RequireAuthorization("tutors:update");

        // PUT /api/tutors/me/profile-picture
        group.MapPut("/me/profile-picture", async (UpdateProfilePictureRequest request, UpdateProfilePicture feature) =>
        {
            var result = await feature.ExecuteAsync(request);
            return result.ToHttpResult();
        })
        .RequireAuthorization("tutors:update");

        // POST /api/tutors/me/documents
        group.MapPost("/me/documents", async (UploadTutorDocumentRequest request, UploadTutorDocument feature) =>
        {
            var result = await feature.ExecuteAsync(request);
            return result.ToHttpResult();
        })
        .RequireAuthorization("tutors:update");

        // DELETE /api/tutors/me/documents/{documentId}
        group.MapDelete("/me/documents/{documentId}", async (string documentId, DeleteTutorDocument feature) =>
        {
            var result = await feature.ExecuteAsync(documentId);
            return result.ToHttpResult();
        })
        .RequireAuthorization("tutors:update");

        // POST /api/tutors/me/reverify
        group.MapPost("/me/reverify", async (ReverifyTutor feature) =>
        {
            var result = await feature.ExecuteAsync();
            return result.ToHttpResult();
        })
        .RequireAuthorization("tutors:update");

        return endpoints;
    }
}
