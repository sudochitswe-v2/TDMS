using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;

namespace TDMS.Api.Features.Operations;

public record ConfirmPaymentResponse(
    string Message,
    string Status,
    int PackageId,
    string TierName
);

public class ConfirmSubscriptionPayment
{
    private readonly AppDbContext _context;
    private readonly ICurrentUser _currentUser;

    public ConfirmSubscriptionPayment(AppDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<ServiceResult<ConfirmPaymentResponse>> ExecuteAsync(int paymentId)
    {
        var payment = await _context.SubscriptionPayments
            .Include(p => p.TutorProfile).ThenInclude(t => t.User)
            .Include(p => p.SubscriptionPackage)
            .FirstOrDefaultAsync(p => p.Id == paymentId);

        if (payment == null)
        {
            return ServiceResult<ConfirmPaymentResponse>.NotFound("Subscription payment record not found");
        }

        payment.Status = "Confirmed";
        payment.RejectionReason = null;
        payment.ReviewedByUserId = _currentUser.UserId;
        payment.ReviewedAt = DateTime.UtcNow;

        // Activate subscription on tutor profile
        payment.TutorProfile.CurrentSubscriptionPackageId = payment.SubscriptionPackageId;
        payment.TutorProfile.SubscriptionUpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return ServiceResult<ConfirmPaymentResponse>.Ok(new ConfirmPaymentResponse(
            $"Payment confirmed successfully. '{payment.SubscriptionPackage.TierName}' tier is now active for {payment.TutorProfile.User.FullName ?? payment.TutorProfile.User.UserName}.",
            "Confirmed",
            payment.SubscriptionPackageId,
            payment.SubscriptionPackage.TierName
        ));
    }
}
