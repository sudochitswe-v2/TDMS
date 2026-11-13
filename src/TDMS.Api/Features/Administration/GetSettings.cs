using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TDMS.Api.Database;
using TDMS.Api.Features.Tutors;

namespace TDMS.Api.Features.Administration;

public record SettingsResponse(MatchingWeights Weights, DateTime? UpdatedAt);

public class GetSettings
{
    private readonly AppDbContext _context;

    public GetSettings(AppDbContext context)
    {
        _context = context;
    }

    public async Task<SettingsResponse> ExecuteAsync()
    {
        var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == "MatchingAlgorithmWeights");
        MatchingWeights weights = new();

        if (setting != null && !string.IsNullOrWhiteSpace(setting.ValueJson))
        {
            try
            {
                var loaded = JsonSerializer.Deserialize<MatchingWeights>(setting.ValueJson);
                if (loaded != null) weights = loaded;
            }
            catch { }
        }

        return new SettingsResponse(weights, setting?.UpdatedAt);
    }
}
