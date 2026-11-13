using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;

namespace TDMS.Api.Features.Operations;

public record TutorPaymentRecordDto(
    int Id,
    int SubscriptionPackageId,
    string PackageName,
    decimal Amount,
    string PaymentMethod,
    string TransactionLast6,
    string ScreenshotUrl,
    string? Notes,
    string Status,
    string? RejectionReason,
    DateTime CreatedAt,
    DateTime? ReviewedAt
);

public class GetMyPayments
{
    private readonly AppDbContext _context;
    private readonly ICurrentUser _currentUser;

    public GetMyPayments(AppDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<ServiceResult<List<TutorPaymentRecordDto>>> ExecuteAsync()
    {
        if (string.IsNullOrEmpty(_currentUser.UserId)) return ServiceResult<List<TutorPaymentRecordDto>>.Unauthorized();

        var tutor = await _context.TutorProfiles.FirstOrDefaultAsync(t => t.UserId == _currentUser.UserId);
        if (tutor == null) return ServiceResult<List<TutorPaymentRecordDto>>.NotFound("Tutor profile not found");

        var payments = await _context.SubscriptionPayments
            .Include(p => p.SubscriptionPackage)
            .Where(p => p.TutorProfileId == tutor.Id)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new TutorPaymentRecordDto(
                p.Id,
                p.SubscriptionPackageId,
                p.SubscriptionPackage.TierName,
                p.Amount,
                p.PaymentMethod,
                p.TransactionLast6,
                p.ScreenshotUrl,
                p.Notes,
                p.Status,
                p.RejectionReason,
                p.CreatedAt,
                p.ReviewedAt
            ))
            .ToListAsync();

        return ServiceResult<List<TutorPaymentRecordDto>>.Ok(payments);
    }
}
