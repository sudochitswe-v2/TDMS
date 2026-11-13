using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;

namespace TDMS.Api.Features.Account;

public class GetLearnerProfile
{
    private readonly AppDbContext _context;
    private readonly ICurrentUser _currentUser;

    public GetLearnerProfile(AppDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<ServiceResult<LearnerProfileResponse>> ExecuteAsync()
    {
        if (string.IsNullOrEmpty(_currentUser.UserId))
        {
            return ServiceResult<LearnerProfileResponse>.Unauthorized();
        }

        var profile = await _context.LearnerProfiles
            .Include(p => p.RequirementCategories)
            .Include(p => p.ScheduleSlots)
            .FirstOrDefaultAsync(p => p.UserId == _currentUser.UserId);

        if (profile == null)
        {
            return ServiceResult<LearnerProfileResponse>.NotFound("Learner profile not found");
        }

        var response = new LearnerProfileResponse(
            Id: profile.Id,
            UserId: profile.UserId,
            AccountSubType: profile.AccountSubType,
            GradeLevel: profile.GradeLevel,
            PreferredMaxHourlyFee: profile.PreferredMaxHourlyFee,
            PreferredTeachingMode: profile.PreferredTeachingMode,
            LearningGoalsNote: profile.LearningGoalsNote,
            CategoryIds: profile.RequirementCategories.Select(rc => rc.CategoryId).ToList(),
            ScheduleSlots: profile.ScheduleSlots.Select(s => new ScheduleSlotDto(
                s.DayOfWeek,
                s.StartTime.ToString(@"hh\:mm"),
                s.EndTime.ToString(@"hh\:mm")
            )).ToList()
        );

        return ServiceResult<LearnerProfileResponse>.Ok(response);
    }
}
