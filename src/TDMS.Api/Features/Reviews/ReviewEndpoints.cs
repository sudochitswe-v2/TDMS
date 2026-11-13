using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;
using TDMS.Api.Database.Entities;

namespace TDMS.Api.Features.Reviews;

public record SubmitReviewRequest(int StarRating, string Comment);
public record UpdateReviewRequest(int StarRating, string Comment);

public static class ReviewEndpoints
{
    public static IEndpointRouteBuilder MapReviewEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api").WithTags("Reviews");

        // GET /api/tutors/{tutorId}/reviews
        group.MapGet("/tutors/{tutorId}/reviews", async (string tutorId, ICurrentUser currentUser, AppDbContext context) =>
        {
            var tutor = await context.TutorProfiles.FirstOrDefaultAsync(t => t.Id == tutorId || t.UserId == tutorId);
            if (tutor == null) return Results.NotFound(new { error = "Tutor not found" });

            var reviews = await context.Reviews
                .Include(r => r.LearnerUser)
                .Where(r => r.TutorProfileId == tutor.Id)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.Id,
                    r.LearnerUserId,
                    LearnerName = currentUser.IsAuthenticated ? r.LearnerUser.FullName : "Student",
                    r.StarRating,
                    Comment = currentUser.IsAuthenticated ? r.Comment : null,
                    r.CreatedAt,
                    r.UpdatedAt
                })
                .ToListAsync();

            var breakdown = new Dictionary<int, int>
            {
                [5] = reviews.Count(r => r.StarRating == 5),
                [4] = reviews.Count(r => r.StarRating == 4),
                [3] = reviews.Count(r => r.StarRating == 3),
                [2] = reviews.Count(r => r.StarRating == 2),
                [1] = reviews.Count(r => r.StarRating == 1),
            };

            return Results.Ok(new
            {
                TutorId = tutor.Id,
                AverageRating = tutor.AverageRating,
                TotalReviewsCount = tutor.TotalReviewsCount,
                RatingBreakdown = breakdown,
                Reviews = reviews
            });
        })
        .AllowAnonymous();

        // POST /api/tutors/{tutorId}/reviews
        group.MapPost("/tutors/{tutorId}/reviews", async (
            string tutorId,
            SubmitReviewRequest request,
            ICurrentUser currentUser,
            AppDbContext context) =>
        {
            if (string.IsNullOrEmpty(currentUser.UserId)) return Results.Unauthorized();

            if (request.StarRating < 1 || request.StarRating > 5)
            {
                return Results.BadRequest(new { error = "Star rating must be between 1 and 5" });
            }

            if (string.IsNullOrWhiteSpace(request.Comment))
            {
                return Results.BadRequest(new { error = "Review comment cannot be empty" });
            }

            var tutor = await context.TutorProfiles.FirstOrDefaultAsync(t => t.Id == tutorId || t.UserId == tutorId);
            if (tutor == null) return Results.NotFound(new { error = "Tutor not found" });

            if (tutor.UserId == currentUser.UserId)
            {
                return Results.BadRequest(new { error = "You cannot review your own tutor profile" });
            }

            // Check unique review constraint
            var existingReview = await context.Reviews
                .FirstOrDefaultAsync(r => r.TutorProfileId == tutor.Id && r.LearnerUserId == currentUser.UserId);

            if (existingReview != null)
            {
                return Results.Conflict(new { error = "You have already reviewed this tutor. Please update your existing review instead." });
            }

            var review = new Review
            {
                LearnerUserId = currentUser.UserId,
                TutorProfileId = tutor.Id,
                StarRating = request.StarRating,
                Comment = request.Comment.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            context.Reviews.Add(review);
            await context.SaveChangesAsync();

            // Recalculate TutorProfile AverageRating & TotalReviewsCount
            await RecalculateTutorRatingAsync(tutor.Id, context);

            return Results.Ok(new { message = "Review submitted successfully", review.Id });
        })
        .RequireAuthorization("reviews:create");

        // PUT /api/reviews/{reviewId}
        group.MapPut("/reviews/{reviewId}", async (
            string reviewId,
            UpdateReviewRequest request,
            ICurrentUser currentUser,
            AppDbContext context) =>
        {
            if (string.IsNullOrEmpty(currentUser.UserId)) return Results.Unauthorized();

            if (request.StarRating < 1 || request.StarRating > 5)
            {
                return Results.BadRequest(new { error = "Star rating must be between 1 and 5" });
            }

            if (string.IsNullOrWhiteSpace(request.Comment))
            {
                return Results.BadRequest(new { error = "Review comment cannot be empty" });
            }

            var review = await context.Reviews.FirstOrDefaultAsync(r => r.Id == reviewId);
            if (review == null) return Results.NotFound(new { error = "Review not found" });

            if (review.LearnerUserId != currentUser.UserId && !currentUser.IsSystemAdmin)
            {
                return Results.Forbid();
            }

            review.StarRating = request.StarRating;
            review.Comment = request.Comment.Trim();
            review.UpdatedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();
            await RecalculateTutorRatingAsync(review.TutorProfileId, context);

            return Results.Ok(new { message = "Review updated successfully" });
        })
        .RequireAuthorization("reviews:update");

        // GET /api/reviews/me
        group.MapGet("/reviews/me", async (ICurrentUser currentUser, AppDbContext context) =>
        {
            if (string.IsNullOrEmpty(currentUser.UserId)) return Results.Unauthorized();

            // Reviews authored by the user
            var authored = await context.Reviews
                .Include(r => r.TutorProfile).ThenInclude(tp => tp.User)
                .Where(r => r.LearnerUserId == currentUser.UserId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.Id,
                    r.TutorProfileId,
                    TutorName = r.TutorProfile.User.FullName,
                    r.StarRating,
                    r.Comment,
                    r.CreatedAt,
                    r.UpdatedAt
                })
                .ToListAsync();

            // Reviews received by the tutor (if current user is a tutor)
            var received = await context.Reviews
                .Include(r => r.LearnerUser)
                .Where(r => r.TutorProfile.UserId == currentUser.UserId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new
                {
                    r.Id,
                    r.LearnerUserId,
                    LearnerName = r.LearnerUser.FullName,
                    r.StarRating,
                    r.Comment,
                    r.CreatedAt,
                    r.UpdatedAt
                })
                .ToListAsync();

            return Results.Ok(new { AuthoredReviews = authored, ReceivedReviews = received });
        })
        .RequireAuthorization("reviews:read");

        return endpoints;
    }

    public static async Task RecalculateTutorRatingAsync(string tutorProfileId, AppDbContext context)
    {
        var tutor = await context.TutorProfiles.FirstOrDefaultAsync(t => t.Id == tutorProfileId);
        if (tutor == null) return;

        var ratings = await context.Reviews
            .Where(r => r.TutorProfileId == tutorProfileId)
            .Select(r => r.StarRating)
            .ToListAsync();

        if (ratings.Count == 0)
        {
            tutor.AverageRating = 0.00m;
            tutor.TotalReviewsCount = 0;
        }
        else
        {
            tutor.TotalReviewsCount = ratings.Count;
            tutor.AverageRating = Math.Round((decimal)ratings.Average(), 2);
        }

        await context.SaveChangesAsync();
    }
}
