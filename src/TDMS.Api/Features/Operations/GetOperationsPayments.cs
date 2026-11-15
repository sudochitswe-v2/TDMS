using Microsoft.EntityFrameworkCore;
using TDMS.Api.Database;

namespace TDMS.Api.Features.Operations;

public record OperationPaymentItemDto(
    string Id,
    string TutorProfileId,
    string TutorName,
    string TutorEmail,
    string CurrentTier,
    string PackageId,
    string PackageName,
    decimal PackageFee,
    int DurationDays,
    decimal Amount,
    string PaymentMethod,
    string TransactionLast6,
    string ScreenshotUrl,
    string? Notes,
    string Status,
    string? RejectionReason,
    string? ReviewedBy,
    DateTime? ReviewedAt,
    DateTime CreatedAt
);

public class GetOperationsPayments
{
    private readonly AppDbContext _context;

    public GetOperationsPayments(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<OperationPaymentItemDto>> ExecuteAsync(string? status)
    {
        var query = _context.SubscriptionPayments
            .Include(p => p.TutorProfile).ThenInclude(t => t.User)
            .Include(p => p.TutorProfile).ThenInclude(t => t.CurrentSubscriptionPackage)
            .Include(p => p.SubscriptionPackage)
            .Include(p => p.ReviewedByUser)
            .AsQueryable();

        if (string.Equals(status, "pending", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(p => p.Status == "Pending");
        }
        else if (string.Equals(status, "confirmed", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(p => p.Status == "Confirmed");
        }
        else if (string.Equals(status, "rejected", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(p => p.Status == "Rejected");
        }

        var list = await query
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new OperationPaymentItemDto(
                p.Id,
                p.TutorProfileId,
                p.TutorProfile.User.FullName ?? p.TutorProfile.User.UserName,
                p.TutorProfile.User.Email,
                p.TutorProfile.CurrentSubscriptionPackage != null ? p.TutorProfile.CurrentSubscriptionPackage.TierName : "Basic Tier",
                p.SubscriptionPackageId,
                p.SubscriptionPackage.TierName,
                p.SubscriptionPackage.DisplayFee,
                p.SubscriptionPackage.DurationDays,
                p.Amount,
                p.PaymentMethod,
                p.TransactionLast6,
                p.ScreenshotUrl,
                p.Notes,
                p.Status,
                p.RejectionReason,
                p.ReviewedByUser != null ? (p.ReviewedByUser.FullName ?? p.ReviewedByUser.UserName) : null,
                p.ReviewedAt,
                p.CreatedAt
            ))
            .ToListAsync();

        return list;
    }
}
