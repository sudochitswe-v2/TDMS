using System.Collections.Concurrent;

namespace TDMS.Api.Features.Messaging;

public class MockFirebaseMessagingService : IFirebaseMessagingService
{
    private readonly ConcurrentDictionary<string, List<MessageDto>> _threads = new();
    private readonly ConcurrentDictionary<string, (string LearnerId, string TutorId, string InquiryId)> _metadata = new();

    public string ProviderName => "In-Memory Mock Firebase Provider";

    public Task InitializeThreadAsync(string threadId, string learnerUserId, string tutorUserId, string inquiryId, CancellationToken cancellationToken = default)
    {
        _metadata[threadId] = (learnerUserId, tutorUserId, inquiryId);
        _threads.TryAdd(threadId, new List<MessageDto>());
        return Task.CompletedTask;
    }

    public Task<MessageDto> SendMessageAsync(string threadId, string senderUserId, string senderName, string text, CancellationToken cancellationToken = default)
    {
        var message = new MessageDto(
            Id: Guid.NewGuid().ToString(),
            ThreadId: threadId,
            SenderUserId: senderUserId,
            SenderName: senderName,
            Text: text,
            Timestamp: DateTime.UtcNow
        );

        var list = _threads.GetOrAdd(threadId, _ => new List<MessageDto>());
        lock (list)
        {
            list.Add(message);
        }

        return Task.FromResult(message);
    }

    public Task<IReadOnlyList<MessageDto>> GetMessagesAsync(string threadId, CancellationToken cancellationToken = default)
    {
        if (_threads.TryGetValue(threadId, out var list))
        {
            lock (list)
            {
                return Task.FromResult<IReadOnlyList<MessageDto>>(list.OrderBy(m => m.Timestamp).ToList());
            }
        }

        return Task.FromResult<IReadOnlyList<MessageDto>>([]);
    }
}
