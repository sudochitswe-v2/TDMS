using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;
using TDMS.Api.Database.Entities;

namespace TDMS.Api.Features.Account;

public record ScheduleSlotDto(byte DayOfWeek, string StartTime, string EndTime);

public record UpdateLearnerProfileRequest(
    string AccountSubType,
    string? GradeLevel,
    decimal PreferredMaxHourlyFee,
    string PreferredTeachingMode,
    string? LearningGoalsNote,
    List<int> CategoryIds,
    List<ScheduleSlotDto> ScheduleSlots
);

public record LearnerProfileResponse(
    string Id,
    string UserId,
    string AccountSubType,
    string? GradeLevel,
    decimal PreferredMaxHourlyFee,
    string PreferredTeachingMode,
    string? LearningGoalsNote,
    List<int> CategoryIds,
    List<ScheduleSlotDto> ScheduleSlots
);

public static class AccountEndpoints
{
    public static IEndpointRouteBuilder MapAccountEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/account").WithTags("Learner Account");

        // GET /api/account/learner-profile
        group.MapGet("/learner-profile", async (ICurrentUser currentUser, AppDbContext context) =>
        {
            if (string.IsNullOrEmpty(currentUser.UserId))
            {
                return Results.Unauthorized();
            }

            var profile = await context.LearnerProfiles
                .Include(p => p.RequirementCategories)
                .Include(p => p.ScheduleSlots)
                .FirstOrDefaultAsync(p => p.UserId == currentUser.UserId);

            if (profile == null)
            {
                return Results.NotFound(new { error = "Learner profile not found" });
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

            return Results.Ok(response);
        })
        .RequireAuthorization("learner_profiles:read");

        // PUT /api/account/learner-profile
        group.MapPut("/learner-profile", async (UpdateLearnerProfileRequest request, ICurrentUser currentUser, AppDbContext context) =>
        {
            if (string.IsNullOrEmpty(currentUser.UserId))
            {
                return Results.Unauthorized();
            }

            var profile = await context.LearnerProfiles
                .Include(p => p.RequirementCategories)
                .Include(p => p.ScheduleSlots)
                .FirstOrDefaultAsync(p => p.UserId == currentUser.UserId);

            if (profile == null)
            {
                return Results.NotFound(new { error = "Learner profile not found" });
            }

            profile.AccountSubType = request.AccountSubType.Equals("Parent", StringComparison.OrdinalIgnoreCase) ? "Parent" : "Student";
            profile.GradeLevel = request.GradeLevel;
            profile.PreferredMaxHourlyFee = request.PreferredMaxHourlyFee;
            profile.PreferredTeachingMode = request.PreferredTeachingMode;
            profile.LearningGoalsNote = request.LearningGoalsNote;

            // Sync categories
            context.LearnerRequirementCategories.RemoveRange(profile.RequirementCategories);
            if (request.CategoryIds != null)
            {
                foreach (var catId in request.CategoryIds.Distinct())
                {
                    context.LearnerRequirementCategories.Add(new LearnerRequirementCategory
                    {
                        LearnerProfileId = profile.Id,
                        CategoryId = catId
                    });
                }
            }

            // Sync schedule slots
            context.LearnerScheduleSlots.RemoveRange(profile.ScheduleSlots);
            if (request.ScheduleSlots != null)
            {
                foreach (var slot in request.ScheduleSlots)
                {
                    if (TimeSpan.TryParse(slot.StartTime, out var start) && TimeSpan.TryParse(slot.EndTime, out var end))
                    {
                        context.LearnerScheduleSlots.Add(new LearnerScheduleSlot
                        {
                            LearnerProfileId = profile.Id,
                            DayOfWeek = slot.DayOfWeek,
                            StartTime = start,
                            EndTime = end
                        });
                    }
                }
            }

            await context.SaveChangesAsync();
            return Results.Ok(new { message = "Learner profile updated successfully" });
        })
        .RequireAuthorization("learner_profiles:update");

        return endpoints;
    }
}
