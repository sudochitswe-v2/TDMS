using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using TDMS.Api.Database;

namespace TDMS.Api.Features.Reviews;

public record SubmitReviewRequest(int StarRating, string Comment);
public record UpdateReviewRequest(int StarRating, string Comment);

public static class ReviewEndpoints
{
    public static IEndpointRouteBuilder MapReviewEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api").WithTags("Reviews");

        // GET /api/tutors/{tutorId}/reviews
        group.MapGet("/tutors/{tutorId}/reviews", async (string tutorId, GetTutorReviews feature) =>
        {
            var result = await feature.ExecuteAsync(tutorId);
            return result.ToHttpResult();
        })
        .AllowAnonymous();

        // POST /api/tutors/{tutorId}/reviews
        group.MapPost("/tutors/{tutorId}/reviews", async (string tutorId, SubmitReviewRequest request, SubmitReview feature) =>
        {
            var result = await feature.ExecuteAsync(tutorId, request);
            return result.ToHttpResult();
        })
        .RequireAuthorization("reviews:create");

        // PUT /api/reviews/{reviewId}
        group.MapPut("/reviews/{reviewId}", async (string reviewId, UpdateReviewRequest request, UpdateReview feature) =>
        {
            var result = await feature.ExecuteAsync(reviewId, request);
            return result.ToHttpResult();
        })
        .RequireAuthorization("reviews:update");

        // GET /api/reviews/me
        group.MapGet("/reviews/me", async (GetMyReviews feature) =>
        {
            var result = await feature.ExecuteAsync();
            return result.ToHttpResult();
        })
        .RequireAuthorization("reviews:read");

        return endpoints;
    }

    public static async Task RecalculateTutorRatingAsync(string tutorProfileId, AppDbContext context)
    {
        await ReviewRatingCalculator.RecalculateTutorRatingAsync(tutorProfileId, context);
    }
}
