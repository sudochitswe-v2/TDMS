using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;
using TDMS.Api.Database.Entities;

namespace TDMS.Api.Features.Tutors;

public class UpdateTeachingInfo
{
    private readonly AppDbContext _context;
    private readonly ICurrentUser _currentUser;

    public UpdateTeachingInfo(AppDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<ServiceResult<MessageResponse>> ExecuteAsync(UpdateTeachingInfoRequest request)
    {
        if (string.IsNullOrEmpty(_currentUser.UserId)) return ServiceResult<MessageResponse>.Unauthorized();

        var tutor = await _context.TutorProfiles
            .Include(t => t.Categories)
            .Include(t => t.ScheduleSlots)
            .Include(t => t.CurrentSubscriptionPackage)
            .FirstOrDefaultAsync(t => t.UserId == _currentUser.UserId);

        if (tutor == null) return ServiceResult<MessageResponse>.NotFound("Tutor profile not found");

        // Validate max active subjects according to subscription package tier
        var maxAllowed = tutor.CurrentSubscriptionPackage?.MaxActiveSubjects ?? 3;
        var targetCategoryIds = (request.CategoryIds ?? []).Distinct().ToList();
        if (targetCategoryIds.Count > maxAllowed)
        {
            return ServiceResult<MessageResponse>.BadRequest(
                $"Your subscription plan limits you to {maxAllowed} active subject categories. Please upgrade your tier to add more subjects.");
        }

        tutor.HourlyFee = request.HourlyFee;
        tutor.TeachingMode = request.TeachingMode;
        tutor.YearsOfExperience = request.YearsOfExperience;

        // Sync categories
        _context.TutorCategories.RemoveRange(tutor.Categories);
        foreach (var cid in targetCategoryIds)
        {
            _context.TutorCategories.Add(new TutorCategory
            {
                TutorProfileId = tutor.Id,
                CategoryId = cid
            });
        }

        // Sync schedule slots
        _context.TutorScheduleSlots.RemoveRange(tutor.ScheduleSlots);
        if (request.ScheduleSlots != null)
        {
            foreach (var slot in request.ScheduleSlots)
            {
                if (TimeSpan.TryParse(slot.StartTime, out var start) && TimeSpan.TryParse(slot.EndTime, out var end))
                {
                    _context.TutorScheduleSlots.Add(new TutorScheduleSlot
                    {
                        TutorProfileId = tutor.Id,
                        DayOfWeek = slot.DayOfWeek,
                        StartTime = start,
                        EndTime = end
                    });
                }
            }
        }

        await _context.SaveChangesAsync();
        return ServiceResult<MessageResponse>.Ok(new MessageResponse("Teaching information updated successfully"));
    }
}
