using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;

namespace TDMS.Api.Features.Inquiries;

public record InquirySummaryDto(
    string Id,
    string LearnerUserId,
    string LearnerName,
    string TutorProfileId,
    string TutorUserId,
    string TutorName,
    string CategoryId,
    string CategoryName,
    string InitialRequirementSummary,
    string Status,
    string FirebaseThreadId,
    DateTime CreatedAt,
    DateTime? RespondedAt
);

public class GetInquiries
{
    private readonly AppDbContext _context;
    private readonly ICurrentUser _currentUser;

    public GetInquiries(AppDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<ServiceResult<List<InquirySummaryDto>>> ExecuteAsync()
    {
        if (string.IsNullOrEmpty(_currentUser.UserId)) return ServiceResult<List<InquirySummaryDto>>.Unauthorized();

        var inquiries = await _context.Inquiries
            .Include(i => i.LearnerUser)
            .Include(i => i.Category)
            .Include(i => i.TutorProfile).ThenInclude(tp => tp.User)
            .Where(i => i.LearnerUserId == _currentUser.UserId || i.TutorProfile.UserId == _currentUser.UserId)
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new InquirySummaryDto(
                i.Id,
                i.LearnerUserId,
                i.LearnerUser.FullName,
                i.TutorProfileId,
                i.TutorProfile.UserId,
                i.TutorProfile.User.FullName,
                i.CategoryId,
                i.Category.Name,
                i.InitialRequirementSummary,
                i.Status,
                i.FirebaseThreadId,
                i.CreatedAt,
                i.RespondedAt
            ))
            .ToListAsync();

        return ServiceResult<List<InquirySummaryDto>>.Ok(inquiries);
    }
}
