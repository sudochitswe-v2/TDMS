using Microsoft.EntityFrameworkCore;
using TDMS.Api.Database;

namespace TDMS.Api.Features.Operations;

public record OperationsSummaryDto(
    int TotalUsers,
    int TotalLearners,
    int TotalTutors,
    int VerifiedTutors,
    int PendingTutors,
    int TotalInquiries,
    int AcceptedInquiries,
    int TotalReviews
);

public record CategoryDemandSupplyDto(
    int CategoryId,
    string CategoryName,
    int SearchDemandCount,
    int TutorSupplyCount,
    double DemandSupplyRatio
);

public record OperationsReportDto(
    OperationsSummaryDto Summary,
    List<CategoryDemandSupplyDto> CategoryDemandSupply
);

public class GetOperationsReport
{
    private readonly AppDbContext _context;

    public GetOperationsReport(AppDbContext context)
    {
        _context = context;
    }

    public async Task<OperationsReportDto> ExecuteAsync()
    {
        var totalUsers = await _context.Users.CountAsync();
        var totalLearners = await _context.LearnerProfiles.CountAsync();
        var totalTutors = await _context.TutorProfiles.CountAsync();
        var verifiedTutors = await _context.TutorProfiles.CountAsync(t => t.VerificationStatus == "Verified");
        var pendingTutors = await _context.TutorProfiles.CountAsync(t => t.VerificationStatus == "Pending");
        var totalInquiries = await _context.Inquiries.CountAsync();
        var acceptedInquiries = await _context.Inquiries.CountAsync(i => i.Status == "Accepted");
        var totalReviews = await _context.Reviews.CountAsync();

        // Demand vs Supply per category
        var categories = await _context.Categories.ToListAsync();
        var searchLogs = await _context.SearchAuditLogs.ToListAsync();
        var tutorCategories = await _context.TutorCategories.Include(tc => tc.TutorProfile).ToListAsync();

        var demandSupply = categories.Select(c =>
        {
            var demandCount = searchLogs.Count(l => l.CategoryId == c.Id);
            var supplyCount = tutorCategories.Count(tc => tc.CategoryId == c.Id && tc.TutorProfile.VerificationStatus == "Verified");
            double ratio = supplyCount > 0 ? Math.Round((double)demandCount / supplyCount, 2) : demandCount;

            return new CategoryDemandSupplyDto(
                c.Id,
                c.Name,
                demandCount,
                supplyCount,
                ratio
            );
        }).ToList();

        return new OperationsReportDto(
            Summary: new OperationsSummaryDto(
                totalUsers,
                totalLearners,
                totalTutors,
                verifiedTutors,
                pendingTutors,
                totalInquiries,
                acceptedInquiries,
                totalReviews
            ),
            CategoryDemandSupply: demandSupply
        );
    }
}
