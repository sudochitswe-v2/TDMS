using System.Text.Json;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;
using TDMS.Api.Database.Entities;

namespace TDMS.Api.Features.Operations;

public class CreateSubscriptionPackage
{
    private readonly AppDbContext _context;

    public CreateSubscriptionPackage(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ServiceResult<SubscriptionPackage>> ExecuteAsync(SaveSubscriptionPackageRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TierName))
        {
            return ServiceResult<SubscriptionPackage>.BadRequest("Tier name is required");
        }

        var package = new SubscriptionPackage
        {
            TierName = request.TierName.Trim(),
            DurationDays = request.DurationDays,
            DisplayFee = request.DisplayFee,
            MaxActiveSubjects = request.MaxActiveSubjects,
            PrioritySearchBoost = request.PrioritySearchBoost,
            FeaturesJson = request.Features != null ? JsonSerializer.Serialize(request.Features) : null,
            IsActive = request.IsActive
        };

        _context.SubscriptionPackages.Add(package);
        await _context.SaveChangesAsync();
        return ServiceResult<SubscriptionPackage>.Ok(package);
    }
}
