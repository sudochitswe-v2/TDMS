using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;
using TDMS.Api.Database.Entities;

namespace TDMS.Api.Features.Reviews;

public record SubmitReviewResponse(string Message, string Id);

public class SubmitReview
{
    private readonly AppDbContext _context;
    private readonly ICurrentUser _currentUser;

    public SubmitReview(AppDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<ServiceResult<SubmitReviewResponse>> ExecuteAsync(string tutorId, SubmitReviewRequest request)
    {
        if (string.IsNullOrEmpty(_currentUser.UserId)) return ServiceResult<SubmitReviewResponse>.Unauthorized();

        if (request.StarRating < 1 || request.StarRating > 5)
        {
            return ServiceResult<SubmitReviewResponse>.BadRequest("Star rating must be between 1 and 5");
        }

        if (string.IsNullOrWhiteSpace(request.Comment))
        {
            return ServiceResult<SubmitReviewResponse>.BadRequest("Review comment cannot be empty");
        }

        var tutor = await _context.TutorProfiles.FirstOrDefaultAsync(t => t.Id == tutorId || t.UserId == tutorId);
        if (tutor == null) return ServiceResult<SubmitReviewResponse>.NotFound("Tutor not found");

        if (tutor.UserId == _currentUser.UserId)
        {
            return ServiceResult<SubmitReviewResponse>.BadRequest("You cannot review your own tutor profile");
        }

        // Check unique review constraint
        var existingReview = await _context.Reviews
            .FirstOrDefaultAsync(r => r.TutorProfileId == tutor.Id && r.LearnerUserId == _currentUser.UserId);

        if (existingReview != null)
        {
            return ServiceResult<SubmitReviewResponse>.Conflict("You have already reviewed this tutor. Please update your existing review instead.");
        }

        var review = new Review
        {
            LearnerUserId = _currentUser.UserId,
            TutorProfileId = tutor.Id,
            StarRating = request.StarRating,
            Comment = request.Comment.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _context.Reviews.Add(review);
        await _context.SaveChangesAsync();

        // Recalculate TutorProfile AverageRating & TotalReviewsCount
        await ReviewRatingCalculator.RecalculateTutorRatingAsync(tutor.Id, _context);

        return ServiceResult<SubmitReviewResponse>.Ok(new SubmitReviewResponse("Review submitted successfully", review.Id));
    }
}
