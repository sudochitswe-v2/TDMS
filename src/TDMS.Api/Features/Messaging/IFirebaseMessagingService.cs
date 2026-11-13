namespace TDMS.Api.Features.Messaging;

public record MessageDto(
    string Id,
    string ThreadId,
    string SenderUserId,
    string SenderName,
    string Text,
    DateTime Timestamp
);

public interface IFirebaseMessagingService
{
    string ProviderName { get; }
    Task InitializeThreadAsync(string threadId, string learnerUserId, string tutorUserId, string inquiryId, CancellationToken cancellationToken = default);
    Task<MessageDto> SendMessageAsync(string threadId, string senderUserId, string senderName, string text, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MessageDto>> GetMessagesAsync(string threadId, CancellationToken cancellationToken = default);
}
