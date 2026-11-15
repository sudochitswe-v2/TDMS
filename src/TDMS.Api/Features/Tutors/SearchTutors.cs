using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;
using TDMS.Api.Database.Entities;
using TDMS.Api.Features.Account;

namespace TDMS.Api.Features.Tutors;

public class SearchTutors
{
    private readonly AppDbContext _context;
    private readonly ICurrentUser _currentUser;

    public SearchTutors(AppDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<List<TutorCardDto>> ExecuteAsync(
        string? categoryId,
        decimal? minFee,
        decimal? maxFee,
        string? teachingMode,
        byte? dayOfWeek,
        string? search)
    {
        // 1. Audit search
        try
        {
            _context.SearchAuditLogs.Add(new SearchAuditLog
            {
                CategoryId = categoryId,
                LearnerUserId = _currentUser.UserId,
                SearchedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
        }
        catch { /* non-critical logging */ }

        // 2. Load weights
        MatchingWeights weights = new();
        var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == "MatchingAlgorithmWeights");
        if (setting != null && !string.IsNullOrWhiteSpace(setting.ValueJson))
        {
            try
            {
                var loaded = JsonSerializer.Deserialize<MatchingWeights>(setting.ValueJson);
                if (loaded != null && loaded.IsValid())
                {
                    weights = loaded;
                }
            }
            catch { }
        }

        // Check if ANY explicit search filter was provided
        bool hasExplicitFilters = !string.IsNullOrWhiteSpace(categoryId) ||
                                  minFee.HasValue ||
                                  maxFee.HasValue ||
                                  (!string.IsNullOrWhiteSpace(teachingMode) && !teachingMode.Equals("Both", StringComparison.OrdinalIgnoreCase)) ||
                                  dayOfWeek.HasValue ||
                                  !string.IsNullOrWhiteSpace(search);

        // 3. Resolve Learner or Tutor Profile (if logged in)
        LearnerProfile? learnerProfile = null;
        TutorProfile? myTutorProfile = null;
        if (_currentUser.IsAuthenticated && !string.IsNullOrEmpty(_currentUser.UserId))
        {
            learnerProfile = await _context.LearnerProfiles
                .Include(p => p.RequirementCategories)
                .Include(p => p.ScheduleSlots)
                .FirstOrDefaultAsync(p => p.UserId == _currentUser.UserId);

            if (learnerProfile == null)
            {
                myTutorProfile = await _context.TutorProfiles
                    .Include(p => p.Categories)
                    .Include(p => p.ScheduleSlots)
                    .FirstOrDefaultAsync(p => p.UserId == _currentUser.UserId);
            }
        }

        // 4. Base Query: Verified & Published Tutors
        var query = _context.TutorProfiles
            .Include(t => t.User)
            .Include(t => t.Categories).ThenInclude(tc => tc.Category)
            .Include(t => t.ScheduleSlots)
            .Include(t => t.CurrentSubscriptionPackage)
            .Where(t => t.VerificationStatus == "Verified" && t.IsPublished && t.User.IsActive)
            .AsQueryable();

        LearnerMatchingCriteria learnerCriteria;

        if (hasExplicitFilters)
        {
            if (!string.IsNullOrWhiteSpace(categoryId))
            {
                query = query.Where(t => t.Categories.Any(tc => tc.CategoryId == categoryId));
            }

            if (minFee.HasValue)
            {
                query = query.Where(t => t.HourlyFee >= minFee.Value);
            }

            if (maxFee.HasValue)
            {
                query = query.Where(t => t.HourlyFee <= maxFee.Value);
            }

            if (!string.IsNullOrWhiteSpace(teachingMode) && !teachingMode.Equals("Both", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(t => t.TeachingMode == teachingMode || t.TeachingMode == "Both");
            }

            if (dayOfWeek.HasValue)
            {
                query = query.Where(t => t.ScheduleSlots.Any(s => s.DayOfWeek == dayOfWeek.Value));
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.ToLower();
                query = query.Where(t => t.User.FullName.ToLower().Contains(s) || (t.Headline != null && t.Headline.ToLower().Contains(s)));
            }

            if (learnerProfile != null)
            {
                var reqCats = !string.IsNullOrWhiteSpace(categoryId)
                    ? new List<string> { categoryId }
                    : learnerProfile.RequirementCategories.Select(rc => rc.CategoryId).ToList();

                var slots = dayOfWeek.HasValue
                    ? new List<LearnerScheduleCriteria> { new(dayOfWeek.Value, TimeSpan.Zero, new TimeSpan(23, 59, 59)) }
                    : learnerProfile.ScheduleSlots.Select(s => new LearnerScheduleCriteria(s.DayOfWeek, s.StartTime, s.EndTime)).ToList();

                learnerCriteria = new LearnerMatchingCriteria(
                    CategoryIds: reqCats,
                    PreferredMaxHourlyFee: maxFee ?? learnerProfile.PreferredMaxHourlyFee,
                    PreferredTeachingMode: !string.IsNullOrWhiteSpace(teachingMode) ? teachingMode : learnerProfile.PreferredTeachingMode,
                    PreferredSlots: slots
                );
            }
            else
            {
                learnerCriteria = BuildFallbackCriteria(categoryId, maxFee, teachingMode, dayOfWeek);
            }
        }
        else if (learnerProfile != null || myTutorProfile != null)
        {
            if (learnerProfile != null)
            {
                var reqCats = learnerProfile.RequirementCategories.Select(rc => rc.CategoryId).ToList();
                learnerCriteria = new LearnerMatchingCriteria(
                    CategoryIds: reqCats,
                    PreferredMaxHourlyFee: learnerProfile.PreferredMaxHourlyFee,
                    PreferredTeachingMode: learnerProfile.PreferredTeachingMode,
                    PreferredSlots: learnerProfile.ScheduleSlots.Select(s => new LearnerScheduleCriteria(s.DayOfWeek, s.StartTime, s.EndTime)).ToList()
                );
            }
            else
            {
                var tutorCats = myTutorProfile!.Categories.Select(c => c.CategoryId).ToList();
                learnerCriteria = new LearnerMatchingCriteria(
                    CategoryIds: tutorCats,
                    PreferredMaxHourlyFee: myTutorProfile.HourlyFee,
                    PreferredTeachingMode: myTutorProfile.TeachingMode,
                    PreferredSlots: myTutorProfile.ScheduleSlots.Select(s => new LearnerScheduleCriteria(s.DayOfWeek, s.StartTime, s.EndTime)).ToList()
                );
            }
        }
        else
        {
            learnerCriteria = BuildFallbackCriteria(null, null, null, null);
        }

        var tutors = await query.ToListAsync();

        // 5. Calculate Match Score & Rank
        var scoredTutors = tutors.Select(t =>
        {
            var candidate = new TutorCandidateInfo(
                TutorProfileId: t.Id,
                HourlyFee: t.HourlyFee,
                TeachingMode: t.TeachingMode,
                CategoryIds: t.Categories.Select(c => c.CategoryId).ToList(),
                AvailableSlots: t.ScheduleSlots.Select(s => new LearnerScheduleCriteria(s.DayOfWeek, s.StartTime, s.EndTime)).ToList()
            );

            var match = MatchingEngine.CalculateMatch(learnerCriteria, candidate, weights);
            var boost = t.CurrentSubscriptionPackage?.PrioritySearchBoost ?? 0;
            var tierFee = t.CurrentSubscriptionPackage?.DisplayFee ?? 0m;

            return new
            {
                Dto = new TutorCardDto(
                    Id: t.Id,
                    UserId: t.UserId,
                    FullName: t.User.FullName,
                    Email: t.User.Email,
                    Headline: t.Headline,
                    Biography: t.Biography,
                    YearsOfExperience: t.YearsOfExperience,
                    HourlyFee: t.HourlyFee,
                    TeachingMode: t.TeachingMode,
                    VerificationStatus: t.VerificationStatus,
                    AverageRating: t.AverageRating,
                    TotalReviewsCount: t.TotalReviewsCount,
                    MatchScore: match.OverallPercentage,
                    Categories: t.Categories.Select(c => c.Category.Name).ToList(),
                    TierName: t.CurrentSubscriptionPackage?.TierName,
                    PriorityBoost: boost,
                    ProfilePictureUrl: t.ProfilePictureUrl
                ),
                TierFee = tierFee,
                PriorityBoost = boost,
                MatchScore = match.OverallPercentage,
                AverageRating = t.AverageRating,
                TotalReviewsCount = t.TotalReviewsCount,
                YearsOfExperience = t.YearsOfExperience,
                HourlyFee = t.HourlyFee
            };
        });

        List<TutorCardDto> results;
        if (!hasExplicitFilters && learnerProfile == null && myTutorProfile == null)
        {
            results = scoredTutors
                .OrderByDescending(x => x.TierFee)
                .ThenByDescending(x => x.PriorityBoost)
                .ThenByDescending(x => x.AverageRating)
                .ThenByDescending(x => x.TotalReviewsCount)
                .ThenByDescending(x => x.YearsOfExperience)
                .ThenBy(x => x.HourlyFee)
                .Select(x => x.Dto)
                .ToList();
        }
        else
        {
            results = scoredTutors
                .OrderByDescending(x => x.MatchScore)
                .ThenByDescending(x => x.PriorityBoost)
                .ThenByDescending(x => x.AverageRating)
                .ThenByDescending(x => x.TotalReviewsCount)
                .Select(x => x.Dto)
                .ToList();
        }

        return results;
    }

    private static LearnerMatchingCriteria BuildFallbackCriteria(string? categoryId, decimal? maxFee, string? teachingMode, byte? dayOfWeek)
    {
        var slots = new List<LearnerScheduleCriteria>();
        if (dayOfWeek.HasValue)
        {
            slots.Add(new LearnerScheduleCriteria(dayOfWeek.Value, new TimeSpan(0, 0, 0), new TimeSpan(23, 59, 59)));
        }

        return new LearnerMatchingCriteria(
            CategoryIds: !string.IsNullOrWhiteSpace(categoryId) ? [categoryId] : [],
            PreferredMaxHourlyFee: maxFee ?? 0m,
            PreferredTeachingMode: teachingMode ?? "Both",
            PreferredSlots: slots
        );
    }
}
