using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;
using TDMS.Api.Features.Account;

namespace TDMS.Api.Features.Tutors;

public record TutorSubscriptionPackageDto(
    int Id,
    string TierName,
    int MaxActiveSubjects,
    int PrioritySearchBoost
);

public record TutorStudioProfileDto(
    string Id,
    string UserId,
    string? Headline,
    string? Biography,
    int YearsOfExperience,
    decimal HourlyFee,
    string TeachingMode,
    string VerificationStatus,
    string? RejectionReason,
    string? ProfilePictureUrl,
    decimal AverageRating,
    int TotalReviewsCount,
    bool IsPublished,
    string? LayoutThemeJson,
    int? CurrentSubscriptionPackageId,
    TutorSubscriptionPackageDto? SubscriptionPackage,
    List<TutorCategoryItemDto> Categories,
    List<ScheduleSlotDto> ScheduleSlots,
    List<TutorDocumentItemDto> Documents
);

public class GetMyTutorProfile
{
    private readonly AppDbContext _context;
    private readonly ICurrentUser _currentUser;

    public GetMyTutorProfile(AppDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<ServiceResult<TutorStudioProfileDto>> ExecuteAsync()
    {
        if (string.IsNullOrEmpty(_currentUser.UserId)) return ServiceResult<TutorStudioProfileDto>.Unauthorized();

        var tutor = await _context.TutorProfiles
            .Include(t => t.User)
            .Include(t => t.Categories).ThenInclude(tc => tc.Category)
            .Include(t => t.ScheduleSlots)
            .Include(t => t.Documents)
            .Include(t => t.CurrentSubscriptionPackage)
            .FirstOrDefaultAsync(t => t.UserId == _currentUser.UserId);

        if (tutor == null) return ServiceResult<TutorStudioProfileDto>.NotFound("Tutor profile not found");

        var result = new TutorStudioProfileDto(
            Id: tutor.Id,
            UserId: tutor.UserId,
            Headline: tutor.Headline,
            Biography: tutor.Biography,
            YearsOfExperience: tutor.YearsOfExperience,
            HourlyFee: tutor.HourlyFee,
            TeachingMode: tutor.TeachingMode,
            VerificationStatus: tutor.VerificationStatus,
            RejectionReason: tutor.RejectionReason,
            ProfilePictureUrl: tutor.ProfilePictureUrl,
            AverageRating: tutor.AverageRating,
            TotalReviewsCount: tutor.TotalReviewsCount,
            IsPublished: tutor.IsPublished,
            LayoutThemeJson: tutor.LayoutThemeJson,
            CurrentSubscriptionPackageId: tutor.CurrentSubscriptionPackageId,
            SubscriptionPackage: tutor.CurrentSubscriptionPackage != null ? new TutorSubscriptionPackageDto(
                tutor.CurrentSubscriptionPackage.Id,
                tutor.CurrentSubscriptionPackage.TierName,
                tutor.CurrentSubscriptionPackage.MaxActiveSubjects,
                tutor.CurrentSubscriptionPackage.PrioritySearchBoost
            ) : null,
            Categories: tutor.Categories.Select(c => new TutorCategoryItemDto(c.CategoryId, c.Category.Name, c.GradeLevelTarget)).ToList(),
            ScheduleSlots: tutor.ScheduleSlots.Select(s => new ScheduleSlotDto(s.DayOfWeek, s.StartTime.ToString(@"hh\:mm"), s.EndTime.ToString(@"hh\:mm"))).ToList(),
            Documents: tutor.Documents.Select(d => new TutorDocumentItemDto(d.Id, d.DocumentType, d.FileName, d.FileUrl, d.FileSizeBytes, d.UploadedAt)).ToList()
        );

        return ServiceResult<TutorStudioProfileDto>.Ok(result);
    }
}
