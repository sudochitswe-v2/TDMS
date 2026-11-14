using Microsoft.EntityFrameworkCore;
using TDMS.Api.Database;

namespace TDMS.Api.Features.Operations;

public record SubscriptionReportSummaryDto(
    int TotalTutors,
    int VerifiedTutors,
    int SubscribedTutorsCount,
    int PaidSubscribersCount,
    int FreeTierTutorsCount,
    int ExpiringSoonCount,
    int ExpiredCount,
    double PaidConversionRate,
    decimal TotalSubscriptionRevenue
);

public record SubscriptionTierDistributionDto(
    int PackageId,
    string TierName,
    decimal DisplayFee,
    int DurationDays,
    int MaxActiveSubjects,
    int PrioritySearchBoost,
    bool IsActive,
    int ActiveTutorsCount,
    double PercentageOfTutors,
    decimal TotalRevenueGenerated
);

public record TutorSubscriptionItemDto(
    string TutorProfileId,
    string TutorName,
    string TutorEmail,
    string VerificationStatus,
    int? PackageId,
    string TierName,
    decimal DisplayFee,
    int DurationDays,
    DateTime? SubscriptionUpdatedAt,
    DateTime? ExpiresAt,
    int? DaysRemaining,
    string Status, // "Active", "ExpiringSoon", "Expired", "FreeTier"
    int ConfirmedPaymentsCount,
    decimal TotalSpent
);

public record SubscriptionReportResponseDto(
    SubscriptionReportSummaryDto Summary,
    List<SubscriptionTierDistributionDto> TierDistribution,
    List<TutorSubscriptionItemDto> Subscriptions
);

public class GetSubscriptionReport
{
    private readonly AppDbContext _context;

    public GetSubscriptionReport(AppDbContext context)
    {
        _context = context;
    }

    public async Task<SubscriptionReportResponseDto> ExecuteAsync()
    {
        var now = DateTime.UtcNow;

        var tutors = await _context.TutorProfiles
            .Include(t => t.User)
            .Include(t => t.CurrentSubscriptionPackage)
            .Include(t => t.SubscriptionPayments)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        var packages = await _context.SubscriptionPackages
            .OrderBy(p => p.DisplayFee)
            .ToListAsync();

        var tutorItems = new List<TutorSubscriptionItemDto>();

        int expiringSoonCount = 0;
        int expiredCount = 0;
        int paidSubscribersCount = 0;
        int freeTierTutorsCount = 0;
        int subscribedTutorsCount = 0;

        foreach (var tutor in tutors)
        {
            var pkg = tutor.CurrentSubscriptionPackage;
            var confirmedPayments = tutor.SubscriptionPayments.Where(p => p.Status == "Confirmed").ToList();
            var confirmedCount = confirmedPayments.Count;
            var totalSpent = confirmedPayments.Sum(p => p.Amount);

            string status;
            DateTime? expiresAt = null;
            int? daysRemaining = null;

            if (pkg == null || pkg.DisplayFee == 0)
            {
                status = "FreeTier";
                freeTierTutorsCount++;
                if (pkg != null) subscribedTutorsCount++;
            }
            else
            {
                subscribedTutorsCount++;

                if (tutor.SubscriptionUpdatedAt.HasValue && pkg.DurationDays > 0)
                {
                    expiresAt = tutor.SubscriptionUpdatedAt.Value.AddDays(pkg.DurationDays);
                    var remaining = (int)Math.Ceiling((expiresAt.Value - now).TotalDays);
                    daysRemaining = remaining;

                    if (now > expiresAt.Value)
                    {
                        status = "Expired";
                        expiredCount++;
                    }
                    else if (remaining <= 7)
                    {
                        status = "ExpiringSoon";
                        expiringSoonCount++;
                        paidSubscribersCount++;
                    }
                    else
                    {
                        status = "Active";
                        paidSubscribersCount++;
                    }
                }
                else
                {
                    status = "Active";
                    paidSubscribersCount++;
                }
            }

            tutorItems.Add(new TutorSubscriptionItemDto(
                tutor.Id,
                tutor.User?.FullName ?? tutor.User?.UserName ?? "Unknown Educator",
                tutor.User?.Email ?? "N/A",
                tutor.VerificationStatus,
                pkg?.Id,
                pkg?.TierName ?? "Free Starter Tier",
                pkg?.DisplayFee ?? 0m,
                pkg?.DurationDays ?? 0,
                tutor.SubscriptionUpdatedAt,
                expiresAt,
                daysRemaining,
                status,
                confirmedCount,
                totalSpent
            ));
        }

        var totalTutors = tutors.Count;
        var verifiedTutors = tutors.Count(t => t.VerificationStatus == "Verified");
        var conversionRate = totalTutors > 0
            ? Math.Round((double)paidSubscribersCount / totalTutors * 100, 1)
            : 0.0;

        var allConfirmedPayments = await _context.SubscriptionPayments
            .Where(p => p.Status == "Confirmed")
            .ToListAsync();

        var totalSubscriptionRevenue = allConfirmedPayments.Sum(p => p.Amount);

        var summary = new SubscriptionReportSummaryDto(
            totalTutors,
            verifiedTutors,
            subscribedTutorsCount,
            paidSubscribersCount,
            freeTierTutorsCount,
            expiringSoonCount,
            expiredCount,
            conversionRate,
            totalSubscriptionRevenue
        );

        // Tier Distribution
        var tierDistribution = packages.Select(pkg =>
        {
            var activeCount = tutors.Count(t => t.CurrentSubscriptionPackageId == pkg.Id);
            var pct = totalTutors > 0
                ? Math.Round((double)activeCount / totalTutors * 100, 1)
                : 0.0;
            var rev = allConfirmedPayments
                .Where(p => p.SubscriptionPackageId == pkg.Id)
                .Sum(p => p.Amount);

            return new SubscriptionTierDistributionDto(
                pkg.Id,
                pkg.TierName,
                pkg.DisplayFee,
                pkg.DurationDays,
                pkg.MaxActiveSubjects,
                pkg.PrioritySearchBoost,
                pkg.IsActive,
                activeCount,
                pct,
                rev
            );
        }).ToList();

        return new SubscriptionReportResponseDto(
            summary,
            tierDistribution,
            tutorItems
        );
    }
}
