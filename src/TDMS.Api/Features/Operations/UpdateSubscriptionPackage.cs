using System.Text.Json;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;
using TDMS.Api.Database.Entities;

namespace TDMS.Api.Features.Operations;

public class UpdateSubscriptionPackage
{
    private readonly AppDbContext _context;

    public UpdateSubscriptionPackage(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ServiceResult<SubscriptionPackage>> ExecuteAsync(int id, SaveSubscriptionPackageRequest request)
    {
        var package = await _context.SubscriptionPackages.FindAsync(id);
        if (package == null) return ServiceResult<SubscriptionPackage>.NotFound("Subscription package not found");

        package.TierName = request.TierName.Trim();
        package.DurationDays = request.DurationDays;
        package.DisplayFee = request.DisplayFee;
        package.MaxActiveSubjects = request.MaxActiveSubjects;
        package.PrioritySearchBoost = request.PrioritySearchBoost;
        package.FeaturesJson = request.Features != null ? JsonSerializer.Serialize(request.Features) : null;
        package.IsActive = request.IsActive;

        await _context.SaveChangesAsync();
        return ServiceResult<SubscriptionPackage>.Ok(package);
    }
}
