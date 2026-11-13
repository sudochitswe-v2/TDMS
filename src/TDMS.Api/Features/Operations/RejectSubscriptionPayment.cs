using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;

namespace TDMS.Api.Features.Operations;

public record RejectPaymentResponse(
    string Message,
    string Status,
    string RejectionReason
);

public class RejectSubscriptionPayment
{
    private readonly AppDbContext _context;
    private readonly ICurrentUser _currentUser;

    public RejectSubscriptionPayment(AppDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<ServiceResult<RejectPaymentResponse>> ExecuteAsync(int paymentId, RejectSubscriptionPaymentRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RejectionReason))
        {
            return ServiceResult<RejectPaymentResponse>.BadRequest("A reason for rejecting the payment must be provided.");
        }

        var payment = await _context.SubscriptionPayments
            .Include(p => p.SubscriptionPackage)
            .FirstOrDefaultAsync(p => p.Id == paymentId);

        if (payment == null)
        {
            return ServiceResult<RejectPaymentResponse>.NotFound("Subscription payment record not found");
        }

        payment.Status = "Rejected";
        payment.RejectionReason = request.RejectionReason.Trim();
        payment.ReviewedByUserId = _currentUser.UserId;
        payment.ReviewedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return ServiceResult<RejectPaymentResponse>.Ok(new RejectPaymentResponse(
            "Payment rejected and feedback sent to tutor.",
            "Rejected",
            payment.RejectionReason
        ));
    }
}
