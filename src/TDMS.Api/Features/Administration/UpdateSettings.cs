using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;
using TDMS.Api.Database.Entities;
using TDMS.Api.Features.Tutors;

namespace TDMS.Api.Features.Administration;

public record UpdateSettingsResponse(string Message, MatchingWeights Weights);

public class UpdateSettings
{
    private readonly AppDbContext _context;

    public UpdateSettings(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ServiceResult<UpdateSettingsResponse>> ExecuteAsync(UpdateSettingsRequest request)
    {
        if (request.Weights == null || !request.Weights.IsValid())
        {
            return ServiceResult<UpdateSettingsResponse>.BadRequest(
                "Validation Error: Matching algorithm weights (W_subject + W_fee + W_schedule + W_mode) must sum to exactly 100%");
        }

        var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == "MatchingAlgorithmWeights");
        if (setting == null)
        {
            setting = new SystemSetting
            {
                Key = "MatchingAlgorithmWeights",
                ValueJson = JsonSerializer.Serialize(request.Weights),
                UpdatedAt = DateTime.UtcNow
            };
            _context.SystemSettings.Add(setting);
        }
        else
        {
            setting.ValueJson = JsonSerializer.Serialize(request.Weights);
            setting.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return ServiceResult<UpdateSettingsResponse>.Ok(new UpdateSettingsResponse("System matching algorithm weights updated successfully", request.Weights));
    }
}
