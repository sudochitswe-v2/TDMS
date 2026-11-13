using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;

namespace TDMS.Api.Features.Reviews;

public record ReviewItemDto(
    string Id,
    string LearnerUserId,
    string LearnerName,
    int StarRating,
    string? Comment,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record TutorReviewsResponse(
    string TutorId,
    decimal AverageRating,
    int TotalReviewsCount,
    Dictionary<int, int> RatingBreakdown,
    List<ReviewItemDto> Reviews
);

public class GetTutorReviews
{
    private readonly AppDbContext _context;
    private readonly ICurrentUser _currentUser;

    public GetTutorReviews(AppDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<ServiceResult<TutorReviewsResponse>> ExecuteAsync(string tutorId)
    {
        var tutor = await _context.TutorProfiles.FirstOrDefaultAsync(t => t.Id == tutorId || t.UserId == tutorId);
        if (tutor == null) return ServiceResult<TutorReviewsResponse>.NotFound("Tutor not found");

        var reviews = await _context.Reviews
            .Include(r => r.LearnerUser)
            .Where(r => r.TutorProfileId == tutor.Id)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReviewItemDto(
                r.Id,
                r.LearnerUserId,
                _currentUser.IsAuthenticated ? r.LearnerUser.FullName : "Student",
                r.StarRating,
                _currentUser.IsAuthenticated ? r.Comment : null,
                r.CreatedAt,
                r.UpdatedAt
            ))
            .ToListAsync();

        var breakdown = new Dictionary<int, int>
        {
            [5] = reviews.Count(r => r.StarRating == 5),
            [4] = reviews.Count(r => r.StarRating == 4),
            [3] = reviews.Count(r => r.StarRating == 3),
            [2] = reviews.Count(r => r.StarRating == 2),
            [1] = reviews.Count(r => r.StarRating == 1),
        };

        return ServiceResult<TutorReviewsResponse>.Ok(new TutorReviewsResponse(
            TutorId: tutor.Id,
            AverageRating: tutor.AverageRating,
            TotalReviewsCount: tutor.TotalReviewsCount,
            RatingBreakdown: breakdown,
            Reviews: reviews
        ));
    }
}
