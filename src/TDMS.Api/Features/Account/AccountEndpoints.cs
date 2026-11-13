using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using TDMS.Api.Abstructions;

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
        group.MapGet("/learner-profile", async (GetLearnerProfile feature) =>
        {
            var result = await feature.ExecuteAsync();
            return result.ToHttpResult();
        })
        .RequireAuthorization("learner_profiles:read");

        // PUT /api/account/learner-profile
        group.MapPut("/learner-profile", async (UpdateLearnerProfileRequest request, UpdateLearnerProfile feature) =>
        {
            var result = await feature.ExecuteAsync(request);
            return result.ToHttpResult();
        })
        .RequireAuthorization("learner_profiles:update");

        return endpoints;
    }
}
