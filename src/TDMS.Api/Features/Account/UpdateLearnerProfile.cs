using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;
using TDMS.Api.Database.Entities;

namespace TDMS.Api.Features.Account;

public class UpdateLearnerProfile
{
    private readonly AppDbContext _context;
    private readonly ICurrentUser _currentUser;

    public UpdateLearnerProfile(AppDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<ServiceResult<MessageResponse>> ExecuteAsync(UpdateLearnerProfileRequest request)
    {
        if (string.IsNullOrEmpty(_currentUser.UserId))
        {
            return ServiceResult<MessageResponse>.Unauthorized();
        }

        var profile = await _context.LearnerProfiles
            .Include(p => p.RequirementCategories)
            .Include(p => p.ScheduleSlots)
            .FirstOrDefaultAsync(p => p.UserId == _currentUser.UserId);

        if (profile == null)
        {
            return ServiceResult<MessageResponse>.NotFound("Learner profile not found");
        }

        profile.AccountSubType = request.AccountSubType.Equals("Parent", StringComparison.OrdinalIgnoreCase) ? "Parent" : "Student";
        profile.GradeLevel = request.GradeLevel;
        profile.PreferredMaxHourlyFee = request.PreferredMaxHourlyFee;
        profile.PreferredTeachingMode = request.PreferredTeachingMode;
        profile.LearningGoalsNote = request.LearningGoalsNote;

        // Sync categories
        _context.LearnerRequirementCategories.RemoveRange(profile.RequirementCategories);
        if (request.CategoryIds != null)
        {
            foreach (var catId in request.CategoryIds.Distinct())
            {
                _context.LearnerRequirementCategories.Add(new LearnerRequirementCategory
                {
                    LearnerProfileId = profile.Id,
                    CategoryId = catId
                });
            }
        }

        // Sync schedule slots
        _context.LearnerScheduleSlots.RemoveRange(profile.ScheduleSlots);
        if (request.ScheduleSlots != null)
        {
            foreach (var slot in request.ScheduleSlots)
            {
                if (TimeSpan.TryParse(slot.StartTime, out var start) && TimeSpan.TryParse(slot.EndTime, out var end))
                {
                    _context.LearnerScheduleSlots.Add(new LearnerScheduleSlot
                    {
                        LearnerProfileId = profile.Id,
                        DayOfWeek = slot.DayOfWeek,
                        StartTime = start,
                        EndTime = end
                    });
                }
            }
        }

        await _context.SaveChangesAsync();
        return ServiceResult<MessageResponse>.Ok(new MessageResponse("Learner profile updated successfully"));
    }
}
