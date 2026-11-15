using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;
using TDMS.Api.Database.Entities;

namespace TDMS.Api.Features.Operations;

public record PurchaseSubscriptionResponse(
    string Message,
    string PaymentId,
    string PackageName,
    decimal Amount,
    string Status
);

public class PurchaseSubscription
{
    private readonly AppDbContext _context;
    private readonly ICurrentUser _currentUser;

    public PurchaseSubscription(AppDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<ServiceResult<PurchaseSubscriptionResponse>> ExecuteAsync(PurchaseSubscriptionRequest request)
    {
        if (string.IsNullOrEmpty(_currentUser.UserId)) return ServiceResult<PurchaseSubscriptionResponse>.Unauthorized();

        var tutor = await _context.TutorProfiles
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.UserId == _currentUser.UserId);

        if (tutor == null)
        {
            return ServiceResult<PurchaseSubscriptionResponse>.NotFound("Tutor profile not found");
        }

        var package = await _context.SubscriptionPackages.FindAsync(request.PackageId);
        if (package == null || !package.IsActive)
        {
            return ServiceResult<PurchaseSubscriptionResponse>.NotFound("Subscription package not found or inactive");
        }

        // If free tier, immediately activate
        if (package.DisplayFee <= 0)
        {
            tutor.CurrentSubscriptionPackageId = package.Id;
            tutor.SubscriptionUpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return ServiceResult<PurchaseSubscriptionResponse>.Ok(new PurchaseSubscriptionResponse(
                $"Successfully activated {package.TierName} tier",
                string.Empty,
                package.TierName,
                0m,
                "Confirmed"
            ));
        }

        if (string.IsNullOrWhiteSpace(request.PaymentMethod))
        {
            return ServiceResult<PurchaseSubscriptionResponse>.BadRequest("Payment method is required (e.g. KBZPay, WavePay, AYA Pay, CB Pay, Bank Transfer).");
        }

        var last6 = request.TransactionLast6?.Trim();
        if (string.IsNullOrWhiteSpace(last6) || last6.Length < 4)
        {
            return ServiceResult<PurchaseSubscriptionResponse>.BadRequest("Please provide at least the last 4 to 6 characters of your payment transaction reference ID.");
        }

        if (string.IsNullOrWhiteSpace(request.ScreenshotBase64))
        {
            return ServiceResult<PurchaseSubscriptionResponse>.BadRequest("Please attach a clear screenshot of your payment transfer completion receipt.");
        }

        var payment = new SubscriptionPayment
        {
            TutorProfileId = tutor.Id,
            SubscriptionPackageId = package.Id,
            Amount = package.DisplayFee,
            PaymentMethod = request.PaymentMethod.Trim(),
            TransactionLast6 = last6,
            ScreenshotUrl = request.ScreenshotBase64.Trim(),
            Notes = request.Notes?.Trim(),
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        _context.SubscriptionPayments.Add(payment);
        await _context.SaveChangesAsync();

        return ServiceResult<PurchaseSubscriptionResponse>.Created(new PurchaseSubscriptionResponse(
            "Payment proof submitted successfully! Your subscription will be activated upon Operations Admin verification.",
            payment.Id,
            package.TierName,
            payment.Amount,
            payment.Status
        ));
    }
}
