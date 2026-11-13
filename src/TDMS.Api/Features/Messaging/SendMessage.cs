using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;

namespace TDMS.Api.Features.Messaging;

public class SendMessage
{
    private readonly AppDbContext _context;
    private readonly ICurrentUser _currentUser;
    private readonly IFirebaseMessagingService _messagingService;

    public SendMessage(AppDbContext context, ICurrentUser currentUser, IFirebaseMessagingService messagingService)
    {
        _context = context;
        _currentUser = currentUser;
        _messagingService = messagingService;
    }

    public async Task<ServiceResult<MessageDto>> ExecuteAsync(string inquiryId, SendMessageRequest request)
    {
        if (string.IsNullOrEmpty(_currentUser.UserId)) return ServiceResult<MessageDto>.Unauthorized();
        if (string.IsNullOrWhiteSpace(request.Text))
        {
            return ServiceResult<MessageDto>.BadRequest("Message text cannot be empty");
        }

        var inquiry = await _context.Inquiries
            .Include(i => i.TutorProfile)
            .FirstOrDefaultAsync(i => i.Id == inquiryId);

        if (inquiry == null)
        {
            return ServiceResult<MessageDto>.NotFound("Inquiry not found");
        }

        // Verify participation
        bool isLearner = inquiry.LearnerUserId == _currentUser.UserId;
        bool isTutor = inquiry.TutorProfile.UserId == _currentUser.UserId;

        if (!isLearner && !isTutor && !_currentUser.IsSystemAdmin)
        {
            return ServiceResult<MessageDto>.Forbid();
        }

        // Message unlocked only if inquiry is Accepted
        if (inquiry.Status != "Accepted")
        {
            return ServiceResult<MessageDto>.BadRequest("Messaging is locked until the tutor accepts the inquiry");
        }

        var senderUser = await _context.Users.FindAsync(_currentUser.UserId);
        var senderName = senderUser?.FullName ?? "User";

        var message = await _messagingService.SendMessageAsync(
            inquiry.FirebaseThreadId,
            _currentUser.UserId,
            senderName,
            request.Text.Trim()
        );

        return ServiceResult<MessageDto>.Ok(message);
    }
}
