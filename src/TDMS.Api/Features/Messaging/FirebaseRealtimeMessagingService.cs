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
        var hasLegacyAuth = !string.IsNullOrWhiteSpace(_legacyAuthToken);

        var resolvedCredentialFile = ResolveCredentialFilePath(credentialFile, hasLegacyAuth);

        if (!string.IsNullOrWhiteSpace(resolvedCredentialFile))
        {
            try
            {
                _credential = CredentialFactory.FromFile<ServiceAccountCredential>(resolvedCredentialFile)
                    .ToGoogleCredential()
                    .CreateScoped("https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/firebase.database");
                InitFirebaseApp(_credential);
                _logger.LogInformation("Firebase Admin SDK initialized from service account file: {FilePath}", resolvedCredentialFile);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to load Firebase credentials from file: {FilePath}", resolvedCredentialFile);
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

    private static string? ResolveCredentialFilePath(string? configuredPath, bool hasLegacyAuthToken)
    {
        var targetFile = configuredPath;
        if (string.IsNullOrWhiteSpace(targetFile))
        {
            if (hasLegacyAuthToken) return null;
            targetFile = "firebase.service.json";
        }

        var candidatePaths = new[]
        {
            targetFile,
            Path.Combine(AppContext.BaseDirectory, targetFile),
            Path.Combine(Directory.GetCurrentDirectory(), targetFile),
            Path.Combine(Directory.GetCurrentDirectory(), "src", "TDMS.Api", targetFile),
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", targetFile),
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "src", "TDMS.Api", targetFile),
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "src", "TDMS.Api", targetFile),
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", targetFile)
        };

        foreach (var path in candidatePaths)
        {
            try
            {
                var full = Path.GetFullPath(path);
                if (File.Exists(full))
                {
                    return full;
                }
            }
            catch
            {
                // Ignore invalid path syntax
            }
        }

        return null;
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
        if (_credential != null)
        {
            try
            {
                if (_credential is ITokenAccess tokenAccess)
                {
                    return await tokenAccess.GetAccessTokenForRequestAsync(cancellationToken: cancellationToken);
                }

                if (_credential.UnderlyingCredential is ITokenAccess underlyingTokenAccess)
                {
                    return await underlyingTokenAccess.GetAccessTokenForRequestAsync(cancellationToken: cancellationToken);
                }
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
        var now = DateTime.UtcNow;
        var payload = new
        {
            threadId,
            learnerUserId,
            tutorUserId,
            inquiryId,
            status = "Pending",
            date = now.ToString("yyyy-MM-dd"),
            createdAt = now.ToString("o"),
            timestamp = now.ToString("o"),
            timestampMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
        };

        var content = JsonContent.Create(payload);
        using var request = await CreateRequestAsync(HttpMethod.Put, $"threads/{threadId}/metadata.json", content, cancellationToken);
        var response = await _httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
        _logger.LogInformation("Firebase thread {ThreadId} initialized successfully", threadId);
    }

    public async Task UpdateThreadStatusAsync(string threadId, string status, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var payload = new
        {
            status,
            date = now.ToString("yyyy-MM-dd"),
            updatedDate = now.ToString("yyyy-MM-dd"),
            respondedAt = now.ToString("o"),
            updatedAt = now.ToString("o"),
            timestamp = now.ToString("o"),
            timestampMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
        };

        var content = JsonContent.Create(payload);
        using var request = await CreateRequestAsync(HttpMethod.Patch, $"threads/{threadId}/metadata.json", content, cancellationToken);
        var response = await _httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
        _logger.LogInformation("Firebase thread {ThreadId} status updated to {Status}", threadId, status);
    }

    public async Task<MessageDto> SendMessageAsync(string threadId, string senderUserId, string senderName, string text, CancellationToken cancellationToken = default)
    {
        var messageId = Guid.NewGuid().ToString();
        var now = DateTime.UtcNow;
        var message = new MessageDto(
            Id: messageId,
            ThreadId: threadId,
            SenderUserId: senderUserId,
            SenderName: senderName,
            Text: text,
            Timestamp: now
        );

        var payload = new
        {
            id = messageId,
            threadId,
            senderUserId,
            senderName,
            text,
            date = now.ToString("yyyy-MM-dd"),
            createdAt = now.ToString("o"),
            timestamp = now.ToString("o"),
            timestampMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
        };

        var content = JsonContent.Create(payload);
        using var request = await CreateRequestAsync(HttpMethod.Put, $"threads/{threadId}/messages/{messageId}.json", content, cancellationToken);
        var response = await _httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();

        // Update thread metadata summary with lastMessage details and current date
        try
        {
            var threadMetadataUpdate = new
            {
                lastMessage = text,
                lastMessageSenderName = senderName,
                lastMessageSenderUserId = senderUserId,
                lastMessageDate = now.ToString("yyyy-MM-dd"),
                lastMessageTimestamp = now.ToString("o"),
                date = now.ToString("yyyy-MM-dd"),
                updatedAt = now.ToString("o"),
                timestamp = now.ToString("o"),
                timestampMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
            };
            using var patchReq = await CreateRequestAsync(HttpMethod.Patch, $"threads/{threadId}/metadata.json", JsonContent.Create(threadMetadataUpdate), cancellationToken);
            await _httpClient.SendAsync(patchReq, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to update thread {ThreadId} metadata with latest message summary", threadId);
        }

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
