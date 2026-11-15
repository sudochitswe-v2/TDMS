using Microsoft.EntityFrameworkCore;
using TDMS.Api.Database;

namespace TDMS.Api.Features.Operations;

public record PaymentReportSummaryDto(
    decimal TotalRevenue,
    int ConfirmedCount,
    decimal PendingRevenue,
    int PendingCount,
    decimal RejectedRevenue,
    int RejectedCount,
    int TotalTransactions,
    decimal AverageTransactionValue,
    double ConfirmationRate
);

public record PaymentMethodBreakdownDto(
    string Method,
    decimal TotalAmount,
    decimal ConfirmedAmount,
    int TotalCount,
    int ConfirmedCount,
    double SharePercentage
);

public record PaymentPackageBreakdownDto(
    string PackageId,
    string PackageName,
    decimal DisplayFee,
    decimal ConfirmedAmount,
    int ConfirmedCount,
    int TotalCount
);

public record PaymentMonthlyTrendDto(
    string Period,
    string Label,
    decimal Revenue,
    int ConfirmedCount,
    int TotalCount
);

public record PaymentReportItemDto(
    string Id,
    string TutorProfileId,
    string TutorName,
    string TutorEmail,
    string PackageId,
    string PackageName,
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

public record PaymentReportResponseDto(
    PaymentReportSummaryDto Summary,
    List<PaymentMethodBreakdownDto> Methods,
    List<PaymentPackageBreakdownDto> Packages,
    List<PaymentMonthlyTrendDto> MonthlyTrends,
    List<PaymentReportItemDto> Payments
);

public class GetPaymentReport
{
    private readonly AppDbContext _context;

    public GetPaymentReport(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PaymentReportResponseDto> ExecuteAsync()
    {
        var payments = await _context.SubscriptionPayments
            .Include(p => p.TutorProfile).ThenInclude(t => t.User)
            .Include(p => p.SubscriptionPackage)
            .Include(p => p.ReviewedByUser)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        var packages = await _context.SubscriptionPackages.ToListAsync();

        var confirmed = payments.Where(p => p.Status == "Confirmed").ToList();
        var pending = payments.Where(p => p.Status == "Pending").ToList();
        var rejected = payments.Where(p => p.Status == "Rejected").ToList();

        var totalRevenue = confirmed.Sum(p => p.Amount);
        var confirmedCount = confirmed.Count;
        var pendingRevenue = pending.Sum(p => p.Amount);
        var pendingCount = pending.Count;
        var rejectedRevenue = rejected.Sum(p => p.Amount);
        var rejectedCount = rejected.Count;
        var totalTransactions = payments.Count;

        var avgTxValue = confirmedCount > 0 ? Math.Round(totalRevenue / confirmedCount, 2) : 0m;
        var confirmationRate = totalTransactions > 0
            ? Math.Round((double)confirmedCount / totalTransactions * 100, 1)
            : 0.0;

        var summary = new PaymentReportSummaryDto(
            totalRevenue,
            confirmedCount,
            pendingRevenue,
            pendingCount,
            rejectedRevenue,
            rejectedCount,
            totalTransactions,
            avgTxValue,
            confirmationRate
        );

        // Payment Methods Breakdown
        var methods = payments
            .GroupBy(p => string.IsNullOrWhiteSpace(p.PaymentMethod) ? "Unknown" : p.PaymentMethod)
            .Select(g =>
            {
                var methodTotal = g.Sum(p => p.Amount);
                var methodConfirmed = g.Where(p => p.Status == "Confirmed").Sum(p => p.Amount);
                var methodCount = g.Count();
                var methodConfirmedCount = g.Count(p => p.Status == "Confirmed");
                var share = totalRevenue > 0
                    ? Math.Round((double)methodConfirmed / (double)totalRevenue * 100, 1)
                    : 0.0;

                return new PaymentMethodBreakdownDto(
                    g.Key,
                    methodTotal,
                    methodConfirmed,
                    methodCount,
                    methodConfirmedCount,
                    share
                );
            })
            .OrderByDescending(m => m.ConfirmedAmount)
            .ThenByDescending(m => m.TotalCount)
            .ToList();

        // Packages Breakdown
        var packageList = packages.Select(pkg =>
        {
            var pkgPayments = payments.Where(p => p.SubscriptionPackageId == pkg.Id).ToList();
            var pkgConfirmed = pkgPayments.Where(p => p.Status == "Confirmed").Sum(p => p.Amount);
            var pkgConfirmedCount = pkgPayments.Count(p => p.Status == "Confirmed");
            var pkgTotalCount = pkgPayments.Count;

            return new PaymentPackageBreakdownDto(
                pkg.Id,
                pkg.TierName,
                pkg.DisplayFee,
                pkgConfirmed,
                pkgConfirmedCount,
                pkgTotalCount
            );
        })
        .OrderByDescending(p => p.ConfirmedAmount)
        .ToList();

        // Monthly Trends (ordered chronologically)
        var monthlyTrends = payments
            .GroupBy(p => new { p.CreatedAt.Year, p.CreatedAt.Month })
            .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
            .Select(g =>
            {
                var dt = new DateTime(g.Key.Year, g.Key.Month, 1);
                var rev = g.Where(p => p.Status == "Confirmed").Sum(p => p.Amount);
                var cCount = g.Count(p => p.Status == "Confirmed");
                var tCount = g.Count();

                return new PaymentMonthlyTrendDto(
                    dt.ToString("yyyy-MM"),
                    dt.ToString("MMM yyyy"),
                    rev,
                    cCount,
                    tCount
                );
            })
            .ToList();

        // Transaction items
        var paymentItems = payments.Select(p => new PaymentReportItemDto(
            p.Id,
            p.TutorProfileId,
            p.TutorProfile?.User?.FullName ?? p.TutorProfile?.User?.UserName ?? "Unknown Educator",
            p.TutorProfile?.User?.Email ?? "N/A",
            p.SubscriptionPackageId,
            p.SubscriptionPackage?.TierName ?? "Unknown Package",
            p.Amount,
            p.PaymentMethod,
            p.TransactionLast6,
            p.ScreenshotUrl,
            p.Notes,
            p.Status,
            p.RejectionReason,
            p.ReviewedByUser?.FullName ?? p.ReviewedByUser?.UserName,
            p.ReviewedAt,
            p.CreatedAt
        )).ToList();

        return new PaymentReportResponseDto(
            summary,
            methods,
            packageList,
            monthlyTrends,
            paymentItems
        );
    }
}
