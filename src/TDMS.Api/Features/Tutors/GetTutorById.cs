using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;
using TDMS.Api.Features.Account;

namespace TDMS.Api.Features.Tutors;

public record TutorCategoryItemDto(int CategoryId, string Name, string? GradeLevelTarget);

public record TutorDocumentItemDto(
    int Id,
    string DocumentType,
    string? FileName,
    string FileUrl,
    long FileSizeBytes,
    DateTime UploadedAt
);

public record TutorRecentReviewDto(
    string Id,
    string LearnerUserId,
    string LearnerName,
    int StarRating,
    string? Comment,
    DateTime CreatedAt
);

public record TutorDetailDto(
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
    string? ProfilePictureUrl,
    decimal AverageRating,
    int TotalReviewsCount,
    bool IsPublished,
    string? LayoutThemeJson,
    string? TierName,
    List<TutorCategoryItemDto> Categories,
    List<ScheduleSlotDto> ScheduleSlots,
    List<TutorDocumentItemDto> Documents,
    Dictionary<int, int> RatingBreakdown,
    List<TutorRecentReviewDto> RecentReviews
);

public class GetTutorById
{
    private readonly AppDbContext _context;
    private readonly ICurrentUser _currentUser;

    public GetTutorById(AppDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<ServiceResult<TutorDetailDto>> ExecuteAsync(string id)
    {
        var tutor = await _context.TutorProfiles
            .Include(t => t.User)
            .Include(t => t.Categories).ThenInclude(tc => tc.Category)
            .Include(t => t.ScheduleSlots)
            .Include(t => t.Documents)
            .Include(t => t.CurrentSubscriptionPackage)
            .Include(t => t.Reviews).ThenInclude(r => r.LearnerUser)
            .FirstOrDefaultAsync(t => t.Id == id || t.UserId == id);

        if (tutor == null)
        {
            return ServiceResult<TutorDetailDto>.NotFound("Tutor profile not found");
        }

        var result = new TutorDetailDto(
            Id: tutor.Id,
            UserId: tutor.UserId,
            FullName: tutor.User.FullName,
            Email: tutor.User.Email,
            Headline: tutor.Headline,
            Biography: tutor.Biography,
            YearsOfExperience: tutor.YearsOfExperience,
            HourlyFee: tutor.HourlyFee,
            TeachingMode: tutor.TeachingMode,
            VerificationStatus: tutor.VerificationStatus,
            ProfilePictureUrl: tutor.ProfilePictureUrl,
            AverageRating: tutor.AverageRating,
            TotalReviewsCount: tutor.TotalReviewsCount,
            IsPublished: tutor.IsPublished,
            LayoutThemeJson: tutor.LayoutThemeJson,
            TierName: tutor.CurrentSubscriptionPackage?.TierName,
            Categories: tutor.Categories.Select(c => new TutorCategoryItemDto(c.CategoryId, c.Category.Name, c.GradeLevelTarget)).ToList(),
            ScheduleSlots: tutor.ScheduleSlots.Select(s => new ScheduleSlotDto(s.DayOfWeek, s.StartTime.ToString(@"hh\:mm"), s.EndTime.ToString(@"hh\:mm"))).ToList(),
            Documents: tutor.Documents.Select(d => new TutorDocumentItemDto(d.Id, d.DocumentType, d.FileName, d.FileUrl, d.FileSizeBytes, d.UploadedAt)).ToList(),
            RatingBreakdown: new Dictionary<int, int>
            {
                [5] = tutor.Reviews.Count(r => r.StarRating == 5),
                [4] = tutor.Reviews.Count(r => r.StarRating == 4),
                [3] = tutor.Reviews.Count(r => r.StarRating == 3),
                [2] = tutor.Reviews.Count(r => r.StarRating == 2),
                [1] = tutor.Reviews.Count(r => r.StarRating == 1),
            },
            RecentReviews: tutor.Reviews.OrderByDescending(r => r.CreatedAt).Select(r => new TutorRecentReviewDto(
                r.Id,
                r.LearnerUserId,
                _currentUser.IsAuthenticated ? r.LearnerUser.FullName : "Student",
                r.StarRating,
                _currentUser.IsAuthenticated ? r.Comment : null,
                r.CreatedAt
            )).ToList()
        );

        return ServiceResult<TutorDetailDto>.Ok(result);
    }
}
