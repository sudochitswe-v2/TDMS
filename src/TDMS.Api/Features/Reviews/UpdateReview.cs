using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;

namespace TDMS.Api.Features.Reviews;

public class UpdateReview
{
    private readonly AppDbContext _context;
    private readonly ICurrentUser _currentUser;

    public UpdateReview(AppDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<ServiceResult<MessageResponse>> ExecuteAsync(string reviewId, UpdateReviewRequest request)
    {
        if (string.IsNullOrEmpty(_currentUser.UserId)) return ServiceResult<MessageResponse>.Unauthorized();

        if (request.StarRating < 1 || request.StarRating > 5)
        {
            return ServiceResult<MessageResponse>.BadRequest("Star rating must be between 1 and 5");
        }

        if (string.IsNullOrWhiteSpace(request.Comment))
        {
            return ServiceResult<MessageResponse>.BadRequest("Review comment cannot be empty");
        }

        var review = await _context.Reviews.FirstOrDefaultAsync(r => r.Id == reviewId);
        if (review == null) return ServiceResult<MessageResponse>.NotFound("Review not found");

        if (review.LearnerUserId != _currentUser.UserId && !_currentUser.IsSystemAdmin)
        {
            return ServiceResult<MessageResponse>.Forbid();
        }

        review.StarRating = request.StarRating;
        review.Comment = request.Comment.Trim();
        review.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await ReviewRatingCalculator.RecalculateTutorRatingAsync(review.TutorProfileId, _context);

        return ServiceResult<MessageResponse>.Ok(new MessageResponse("Review updated successfully"));
    }
}
