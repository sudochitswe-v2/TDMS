using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;

namespace TDMS.Api.Features.Operations;

public record SelectPackageResponse(string Message, string TierName, string Status);

public class SelectSubscriptionPackage
{
    private readonly AppDbContext _context;
    private readonly ICurrentUser _currentUser;

    public SelectSubscriptionPackage(AppDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<ServiceResult<SelectPackageResponse>> ExecuteAsync(int packageId)
    {
        if (string.IsNullOrEmpty(_currentUser.UserId)) return ServiceResult<SelectPackageResponse>.Unauthorized();

        var package = await _context.SubscriptionPackages.FindAsync(packageId);
        if (package == null || !package.IsActive)
        {
            return ServiceResult<SelectPackageResponse>.NotFound("Subscription package not found or inactive");
        }

        var tutor = await _context.TutorProfiles.FirstOrDefaultAsync(t => t.UserId == _currentUser.UserId);
        if (tutor == null)
        {
            return ServiceResult<SelectPackageResponse>.NotFound("Tutor profile not found");
        }

        if (package.DisplayFee > 0)
        {
            return ServiceResult<SelectPackageResponse>.BadRequest(
                "Paid subscription tiers require payment verification. Please submit your transaction proof and screenshot via /api/subscriptions/purchase.");
        }

        tutor.CurrentSubscriptionPackageId = package.Id;
        tutor.SubscriptionUpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return ServiceResult<SelectPackageResponse>.Ok(new SelectPackageResponse(
            $"Successfully activated free {package.TierName} tier",
            package.TierName,
            "Confirmed"
        ));
    }
}
