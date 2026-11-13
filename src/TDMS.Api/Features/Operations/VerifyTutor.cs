using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;

namespace TDMS.Api.Features.Operations;

public record VerifyTutorResponse(
    string Message,
    string Id,
    string VerificationStatus,
    bool IsPublished,
    string? RejectionReason
);

public class VerifyTutor
{
    private readonly AppDbContext _context;
    private readonly ICurrentUser _currentUser;

    public VerifyTutor(AppDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<ServiceResult<VerifyTutorResponse>> ExecuteAsync(string tutorId, VerifyTutorRequest request)
    {
        var tutor = await _context.TutorProfiles
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Id == tutorId);

        if (tutor == null)
        {
            return ServiceResult<VerifyTutorResponse>.NotFound("Tutor profile not found");
        }

        var isApprove = request.Decision.Equals("Approved", StringComparison.OrdinalIgnoreCase);
        var isReject = request.Decision.Equals("Rejected", StringComparison.OrdinalIgnoreCase);

        if (!isApprove && !isReject)
        {
            return ServiceResult<VerifyTutorResponse>.BadRequest("Decision must be either 'Approved' or 'Rejected'");
        }

        if (isApprove)
        {
            tutor.VerificationStatus = "Verified";
            tutor.RejectionReason = null;
            tutor.VerifiedAt = DateTime.UtcNow;
            tutor.VerifiedByUserId = _currentUser.UserId;
            tutor.IsPublished = true;
        }
        else
        {
            tutor.VerificationStatus = "Rejected";
            tutor.RejectionReason = string.IsNullOrWhiteSpace(request.RejectionReason)
                ? "Verification documentation was insufficient."
                : request.RejectionReason.Trim();
            tutor.IsPublished = false;
        }

        await _context.SaveChangesAsync();

        return ServiceResult<VerifyTutorResponse>.Ok(new VerifyTutorResponse(
            $"Tutor verification status updated to {tutor.VerificationStatus}",
            tutor.Id,
            tutor.VerificationStatus,
            tutor.IsPublished,
            tutor.RejectionReason
        ));
    }
}
