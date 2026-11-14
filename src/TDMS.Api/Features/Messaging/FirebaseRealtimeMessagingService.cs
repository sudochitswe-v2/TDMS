using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace TDMS.Api.Features.Messaging;

public class FirebaseRealtimeMessagingService : IFirebaseMessagingService
{
    private readonly HttpClient _httpClient;
    private readonly string _databaseUrl;
    private readonly GoogleCredential? _credential;
    private readonly string? _legacyAuthToken;
    private readonly ILogger<FirebaseRealtimeMessagingService> _logger;

    public string ProviderName => "Production Firebase Realtime Database Provider (Firebase Admin SDK)";

    public FirebaseRealtimeMessagingService(HttpClient httpClient, IConfiguration configuration, ILogger<FirebaseRealtimeMessagingService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _databaseUrl = (configuration["Firebase:DatabaseUrl"] ?? string.Empty).TrimEnd('/');
        _legacyAuthToken = configuration["Firebase:AuthToken"]
            ?? configuration["Firebase:DatabaseSecret"]
            ?? configuration["Firebase:Secret"];

        // Try loading Google Service Account Credentials for Firebase Admin SDK
        var credentialFile = configuration["Firebase:CredentialFile"];
        var credentialJson = configuration["Firebase:CredentialJson"];

        if (!string.IsNullOrWhiteSpace(credentialFile) && File.Exists(credentialFile))
        {
            try
            {
                _credential = CredentialFactory.FromFile<ServiceAccountCredential>(credentialFile)
                    .ToGoogleCredential()
                    .CreateScoped("https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/firebase.database");
                InitFirebaseApp(_credential);
                _logger.LogInformation("Firebase Admin SDK initialized from service account file: {FilePath}", credentialFile);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load Firebase credentials from file: {FilePath}", credentialFile);
            }
        }
        else if (!string.IsNullOrWhiteSpace(credentialJson))
        {
            try
            {
                _credential = CredentialFactory.FromJson<ServiceAccountCredential>(credentialJson)
                    .ToGoogleCredential()
                    .CreateScoped("https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/firebase.database");
                InitFirebaseApp(_credential);
                _logger.LogInformation("Firebase Admin SDK initialized from JSON credential configuration");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load Firebase credentials from JSON configuration");
            }
        }
        else if (!string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS")))
        {
            try
            {
                _credential = GoogleCredential.GetApplicationDefault()
                    .CreateScoped("https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/firebase.database");
                InitFirebaseApp(_credential);
                _logger.LogInformation("Firebase Admin SDK initialized from GOOGLE_APPLICATION_CREDENTIALS environment");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load Firebase credentials from GOOGLE_APPLICATION_CREDENTIALS");
            }
        }
    }

    private static void InitFirebaseApp(GoogleCredential credential)
    {
        if (FirebaseApp.DefaultInstance == null)
        {
            try
            {
                FirebaseApp.Create(new AppOptions
                {
                    Credential = credential
                });
            }
            catch
            {
                // Ignored if already initialized in another thread/test
            }
        }
    }

    private async Task<string?> GetAccessTokenAsync(CancellationToken cancellationToken = default)
    {
        if (_credential is ITokenAccess tokenAccess)
        {
            try
            {
                return await tokenAccess.GetAccessTokenForRequestAsync(cancellationToken: cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to acquire OAuth2 access token via Firebase Admin SDK");
            }
        }
        return null;
    }

    private async Task<HttpRequestMessage> CreateRequestAsync(HttpMethod method, string relativePath, HttpContent? content = null, CancellationToken cancellationToken = default)
    {
        var url = $"{_databaseUrl}/{relativePath.TrimStart('/')}";
        var token = await GetAccessTokenAsync(cancellationToken);

        if (!string.IsNullOrWhiteSpace(_legacyAuthToken) && string.IsNullOrWhiteSpace(token))
        {
            url += $"?auth={Uri.EscapeDataString(_legacyAuthToken)}";
        }

        var request = new HttpRequestMessage(method, url);
        if (content != null)
        {
            request.Content = content;
        }

        if (!string.IsNullOrWhiteSpace(token))
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }

        return request;
    }

    public async Task InitializeThreadAsync(string threadId, string learnerUserId, string tutorUserId, string inquiryId, CancellationToken cancellationToken = default)
    {
        var payload = new
        {
            learnerUserId,
            tutorUserId,
            inquiryId,
            createdAt = DateTime.UtcNow.ToString("o")
        };

        var content = JsonContent.Create(payload);
        using var request = await CreateRequestAsync(HttpMethod.Put, $"threads/{threadId}/metadata.json", content, cancellationToken);
        var response = await _httpClient.SendAsync(request, cancellationToken);
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

        var content = JsonContent.Create(message);
        using var request = await CreateRequestAsync(HttpMethod.Put, $"threads/{threadId}/messages/{messageId}.json", content, cancellationToken);
        var response = await _httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
        return message;
    }

    public async Task<IReadOnlyList<MessageDto>> GetMessagesAsync(string threadId, CancellationToken cancellationToken = default)
    {
        using var request = await CreateRequestAsync(HttpMethod.Get, $"threads/{threadId}/messages.json", null, cancellationToken);
        var response = await _httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            return [];
        }

        var dict = await response.Content.ReadFromJsonAsync<Dictionary<string, MessageDto>>(cancellationToken: cancellationToken);
        if (dict == null) return [];

        return dict.Values.OrderBy(m => m.Timestamp).ToList();
    }
}
