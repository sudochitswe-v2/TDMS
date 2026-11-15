using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;
using TDMS.Api.Features.Messaging;

namespace TDMS.Api.Features.Inquiries;

public record RespondInquiryResponse(string Message, string Status, string FirebaseThreadId);

public class RespondInquiry
{
    private readonly AppDbContext _context;
    private readonly ICurrentUser _currentUser;
    private readonly IFirebaseMessagingService _messagingService;

    public RespondInquiry(AppDbContext context, ICurrentUser currentUser, IFirebaseMessagingService messagingService)
    {
        _context = context;
        _currentUser = currentUser;
        _messagingService = messagingService;
    }

    public async Task<ServiceResult<RespondInquiryResponse>> ExecuteAsync(string id, RespondInquiryRequest request)
    {
        if (string.IsNullOrEmpty(_currentUser.UserId)) return ServiceResult<RespondInquiryResponse>.Unauthorized();

        var inquiry = await _context.Inquiries
            .Include(i => i.TutorProfile)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (inquiry == null)
        {
            return ServiceResult<RespondInquiryResponse>.NotFound("Inquiry not found");
        }

        // Only assigned tutor can respond
        if (inquiry.TutorProfile.UserId != _currentUser.UserId && !_currentUser.IsSystemAdmin)
        {
            return ServiceResult<RespondInquiryResponse>.Forbid();
        }

        if (inquiry.Status != "Pending")
        {
            return ServiceResult<RespondInquiryResponse>.BadRequest($"Inquiry is already {inquiry.Status}");
        }

        var isAccept = request.Decision.Equals("Accepted", StringComparison.OrdinalIgnoreCase);
        var isDecline = request.Decision.Equals("Declined", StringComparison.OrdinalIgnoreCase);

        if (!isAccept && !isDecline)
        {
            return ServiceResult<RespondInquiryResponse>.BadRequest("Decision must be 'Accepted' or 'Declined'");
        }

        inquiry.Status = isAccept ? "Accepted" : "Declined";
        inquiry.RespondedAt = DateTime.UtcNow;

        // Sync decision to Firebase Realtime Database
        try
        {
            if (isAccept)
            {
                await _messagingService.InitializeThreadAsync(
                    inquiry.FirebaseThreadId,
                    inquiry.LearnerUserId,
                    inquiry.TutorProfile.UserId,
                    inquiry.Id
                );
            }

            await _messagingService.UpdateThreadStatusAsync(
                inquiry.FirebaseThreadId,
                inquiry.Status
            );
        }
        catch
        {
            // Non-blocking fallback
        }

        await _context.SaveChangesAsync();
        return ServiceResult<RespondInquiryResponse>.Ok(new RespondInquiryResponse(
            $"Inquiry {inquiry.Status}",
            inquiry.Status,
            inquiry.FirebaseThreadId
        ));
    }
}
