using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace TDMS.Api.Features.Messaging;

public class FirebaseRealtimeMessagingService : IFirebaseMessagingService
{
    private readonly HttpClient _httpClient;
    private readonly string _databaseUrl;
    private readonly ILogger<FirebaseRealtimeMessagingService> _logger;

    public string ProviderName => "Production Firebase Realtime Database Provider";

    public FirebaseRealtimeMessagingService(HttpClient httpClient, IConfiguration configuration, ILogger<FirebaseRealtimeMessagingService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _databaseUrl = (configuration["Firebase:DatabaseUrl"] ?? string.Empty).TrimEnd('/');
    }

    public async Task InitializeThreadAsync(string threadId, string learnerUserId, string tutorUserId, string inquiryId, CancellationToken cancellationToken = default)
    {
        var url = $"{_databaseUrl}/threads/{threadId}/metadata.json";
        var payload = new
        {
            learnerUserId,
            tutorUserId,
            inquiryId,
            createdAt = DateTime.UtcNow.ToString("o")
        };

        var response = await _httpClient.PutAsJsonAsync(url, payload, cancellationToken);
        response.EnsureSuccessStatusCode();
        _logger.LogInformation("Firebase thread {ThreadId} initialized successfully", threadId);
    }

    public async Task<MessageDto> SendMessageAsync(string threadId, string senderUserId, string senderName, string text, CancellationToken cancellationToken = default)
    {
        var messageId = Guid.NewGuid().ToString();
        var message = new MessageDto(
            Id: messageId,
            ThreadId: threadId,
            SenderUserId: senderUserId,
            SenderName: senderName,
            Text: text,
            Timestamp: DateTime.UtcNow
        );

        var url = $"{_databaseUrl}/threads/{threadId}/messages/{messageId}.json";
        var response = await _httpClient.PutAsJsonAsync(url, message, cancellationToken);
        response.EnsureSuccessStatusCode();
        return message;
    }

    public async Task<IReadOnlyList<MessageDto>> GetMessagesAsync(string threadId, CancellationToken cancellationToken = default)
    {
        var url = $"{_databaseUrl}/threads/{threadId}/messages.json";
        var response = await _httpClient.GetAsync(url, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            return [];
        }

        var dict = await response.Content.ReadFromJsonAsync<Dictionary<string, MessageDto>>(cancellationToken: cancellationToken);
        if (dict == null) return [];

        return dict.Values.OrderBy(m => m.Timestamp).ToList();
    }
}
