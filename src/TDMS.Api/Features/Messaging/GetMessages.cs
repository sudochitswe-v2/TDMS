using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;

namespace TDMS.Api.Features.Messaging;

public class GetMessages
{
    private readonly AppDbContext _context;
    private readonly ICurrentUser _currentUser;
    private readonly IFirebaseMessagingService _messagingService;

    public GetMessages(AppDbContext context, ICurrentUser currentUser, IFirebaseMessagingService messagingService)
    {
        _context = context;
        _currentUser = currentUser;
        _messagingService = messagingService;
    }

    public async Task<ServiceResult<IReadOnlyList<MessageDto>>> ExecuteAsync(string inquiryId)
    {
        if (string.IsNullOrEmpty(_currentUser.UserId)) return ServiceResult<IReadOnlyList<MessageDto>>.Unauthorized();

        var inquiry = await _context.Inquiries
            .Include(i => i.TutorProfile)
            .FirstOrDefaultAsync(i => i.Id == inquiryId);

        if (inquiry == null) return ServiceResult<IReadOnlyList<MessageDto>>.NotFound("Inquiry not found");

        bool isLearner = inquiry.LearnerUserId == _currentUser.UserId;
        bool isTutor = inquiry.TutorProfile.UserId == _currentUser.UserId;

        if (!isLearner && !isTutor && !_currentUser.IsSystemAdmin)
        {
            return ServiceResult<IReadOnlyList<MessageDto>>.Forbid();
        }

        var messages = await _messagingService.GetMessagesAsync(inquiry.FirebaseThreadId);
        return ServiceResult<IReadOnlyList<MessageDto>>.Ok(messages);
    }
}
