using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;

namespace TDMS.Api.Features.Tutors;

public record ReverifyResponse(string Message, string Status);

public class ReverifyTutor
{
    private readonly AppDbContext _context;
    private readonly ICurrentUser _currentUser;

    public ReverifyTutor(AppDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<ServiceResult<ReverifyResponse>> ExecuteAsync()
    {
        if (string.IsNullOrEmpty(_currentUser.UserId)) return ServiceResult<ReverifyResponse>.Unauthorized();

        var tutor = await _context.TutorProfiles
            .Include(t => t.Documents)
            .FirstOrDefaultAsync(t => t.UserId == _currentUser.UserId);
        if (tutor == null) return ServiceResult<ReverifyResponse>.NotFound("Tutor profile not found");

        if (tutor.Documents.Count == 0 && string.IsNullOrEmpty(tutor.ProfilePictureUrl))
        {
            return ServiceResult<ReverifyResponse>.BadRequest(
                "Please upload at least one academic certificate, tutoring proof document, or profile photo before submitting for verification.");
        }

        tutor.VerificationStatus = "Pending";
        tutor.RejectionReason = null;
        tutor.VerifiedByUserId = null;
        tutor.VerifiedAt = null;
        tutor.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return ServiceResult<ReverifyResponse>.Ok(new ReverifyResponse(
            "Your credentials and verification documents have been submitted for review.",
            tutor.VerificationStatus
        ));
    }
}
