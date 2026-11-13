using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;

namespace TDMS.Api.Features.Reviews;

public record AuthoredReviewDto(
    string Id,
    string TutorProfileId,
    string TutorName,
    int StarRating,
    string Comment,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record ReceivedReviewDto(
    string Id,
    string LearnerUserId,
    string LearnerName,
    int StarRating,
    string Comment,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record MyReviewsResponse(
    List<AuthoredReviewDto> AuthoredReviews,
    List<ReceivedReviewDto> ReceivedReviews
);

public class GetMyReviews
{
    private readonly AppDbContext _context;
    private readonly ICurrentUser _currentUser;

    public GetMyReviews(AppDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<ServiceResult<MyReviewsResponse>> ExecuteAsync()
    {
        if (string.IsNullOrEmpty(_currentUser.UserId)) return ServiceResult<MyReviewsResponse>.Unauthorized();

        // Reviews authored by the user
        var authored = await _context.Reviews
            .Include(r => r.TutorProfile).ThenInclude(tp => tp.User)
            .Where(r => r.LearnerUserId == _currentUser.UserId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new AuthoredReviewDto(
                r.Id,
                r.TutorProfileId,
                r.TutorProfile.User.FullName,
                r.StarRating,
                r.Comment,
                r.CreatedAt,
                r.UpdatedAt
            ))
            .ToListAsync();

        // Reviews received by the tutor (if current user is a tutor)
        var received = await _context.Reviews
            .Include(r => r.LearnerUser)
            .Where(r => r.TutorProfile.UserId == _currentUser.UserId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReceivedReviewDto(
                r.Id,
                r.LearnerUserId,
                r.LearnerUser.FullName,
                r.StarRating,
                r.Comment,
                r.CreatedAt,
                r.UpdatedAt
            ))
            .ToListAsync();

        return ServiceResult<MyReviewsResponse>.Ok(new MyReviewsResponse(authored, received));
    }
}
