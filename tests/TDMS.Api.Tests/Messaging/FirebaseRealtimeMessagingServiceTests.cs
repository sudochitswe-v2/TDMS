using System.Net;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TDMS.Api.Features.Messaging;
using Xunit;

namespace TDMS.Api.Tests.Messaging;

public class FirebaseRealtimeMessagingServiceTests
{
    private class MockHttpMessageHandler : HttpMessageHandler
    {
        public List<HttpRequestMessage> Requests { get; } = new();
        public HttpRequestMessage? LastRequest => Requests.LastOrDefault();
        public string? LastRequestBody { get; private set; }
        public HttpResponseMessage ResponseToReturn { get; set; } = new(HttpStatusCode.OK)
        {
            Content = new StringContent("{}")
        };

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Requests.Add(request);
            if (request.Content != null)
            {
                LastRequestBody = await request.Content.ReadAsStringAsync(cancellationToken);
            }
            return ResponseToReturn;
        }
    }

    [Fact]
    public async Task InitializeThreadAsync_WithAuthToken_AppendsAuthParamToUrl()
    {
        // Arrange
        var handler = new MockHttpMessageHandler();
        var httpClient = new HttpClient(handler);
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Firebase:DatabaseUrl"] = "https://test-project-default-rtdb.firebaseio.com",
                ["Firebase:AuthToken"] = "test-secret-token"
            })
            .Build();

        var service = new FirebaseRealtimeMessagingService(httpClient, config, NullLogger<FirebaseRealtimeMessagingService>.Instance);

        // Act
        await service.InitializeThreadAsync("thread_123", "learner_1", "tutor_1", "inquiry_1");

        // Assert
        Assert.NotNull(handler.LastRequest);
        Assert.Equal(HttpMethod.Put, handler.LastRequest.Method);
        Assert.Equal(
            "https://test-project-default-rtdb.firebaseio.com/threads/thread_123/metadata.json?auth=test-secret-token",
            handler.LastRequest.RequestUri?.ToString()
        );
    }

    [Fact]
    public async Task SendMessageAsync_WithDatabaseSecret_AppendsAuthParamToUrl()
    {
        // Arrange
        var handler = new MockHttpMessageHandler();
        var httpClient = new HttpClient(handler);
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Firebase:DatabaseUrl"] = "https://test-project-default-rtdb.firebaseio.com",
                ["Firebase:DatabaseSecret"] = "legacy-secret-key"
            })
            .Build();

        var service = new FirebaseRealtimeMessagingService(httpClient, config, NullLogger<FirebaseRealtimeMessagingService>.Instance);

        // Act
        var result = await service.SendMessageAsync("thread_456", "user_1", "Alex", "Hello Tutor!");

        // Assert
        var putRequest = handler.Requests.FirstOrDefault(r => r.Method == HttpMethod.Put);
        Assert.NotNull(putRequest);
        Assert.StartsWith("https://test-project-default-rtdb.firebaseio.com/threads/thread_456/messages/", putRequest.RequestUri?.ToString());
        Assert.EndsWith(".json?auth=legacy-secret-key", putRequest.RequestUri?.ToString());
        Assert.Equal("Alex", result.SenderName);
        Assert.Equal("Hello Tutor!", result.Text);
    }

    [Fact]
    public async Task GetMessagesAsync_WithoutAuthToken_DoesNotIncludeAuthParam()
    {
        // Arrange
        var handler = new MockHttpMessageHandler
        {
            ResponseToReturn = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(JsonSerializer.Serialize(new Dictionary<string, MessageDto>
                {
                    ["msg_1"] = new("msg_1", "thread_789", "user_1", "Alex", "Hi", DateTime.UtcNow)
                }))
            }
        };
        var httpClient = new HttpClient(handler);
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Firebase:DatabaseUrl"] = "https://test-project-default-rtdb.firebaseio.com"
            })
            .Build();

        var service = new FirebaseRealtimeMessagingService(httpClient, config, NullLogger<FirebaseRealtimeMessagingService>.Instance);

        // Act
        var messages = await service.GetMessagesAsync("thread_789");

        // Assert
        Assert.NotNull(handler.LastRequest);
        Assert.Equal(HttpMethod.Get, handler.LastRequest.Method);
        Assert.Equal(
            "https://test-project-default-rtdb.firebaseio.com/threads/thread_789/messages.json",
            handler.LastRequest.RequestUri?.ToString()
        );
        Assert.Single(messages);
        Assert.Equal("Hi", messages[0].Text);
    }

    [Fact]
    public void ProviderName_IdentifiesFirebaseAdminSDK()
    {
        var httpClient = new HttpClient(new MockHttpMessageHandler());
        var config = new ConfigurationBuilder().Build();
        var service = new FirebaseRealtimeMessagingService(httpClient, config, NullLogger<FirebaseRealtimeMessagingService>.Instance);

        Assert.Equal("Production Firebase Realtime Database Provider (Firebase Admin SDK)", service.ProviderName);
    }

    [Fact]
    public async Task TestRealFirebaseCredentialLoading()
    {
        var jsonPath = Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "src", "TDMS.Api", "firebase.service.json");
        var fullPath = Path.GetFullPath(jsonPath);
        Assert.True(File.Exists(fullPath), $"File should exist at {fullPath}");

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Firebase:DatabaseUrl"] = "https://tdms-svc-default-rtdb.asia-southeast1.firebasedatabase.app",
                ["Firebase:CredentialFile"] = fullPath
            })
            .Build();

        var service = new FirebaseRealtimeMessagingService(new HttpClient(), config, NullLogger<FirebaseRealtimeMessagingService>.Instance);

        // Try getting a real message list or sending message
        var messages = await service.GetMessagesAsync("test_thread");
        Assert.NotNull(messages);
    }

    [Fact]
    public async Task TestRealFirebaseCredentialLoading_WithRelativeFileName()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Firebase:DatabaseUrl"] = "https://tdms-svc-default-rtdb.asia-southeast1.firebasedatabase.app",
                ["Firebase:CredentialFile"] = "firebase.service.json"
            })
            .Build();

        var service = new FirebaseRealtimeMessagingService(new HttpClient(), config, NullLogger<FirebaseRealtimeMessagingService>.Instance);

        // This will test if relative filename works when running from test runner directory!
        var sent = await service.SendMessageAsync("test_thread_integration", "user_1", "Test User", "Hello from integration test");
        Assert.NotNull(sent);
    }

    [Fact]
    public async Task SendAndGetMessagesAsync_RealFirebase_PersistsMessageAndReturnsIt()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Firebase:DatabaseUrl"] = "https://tdms-svc-default-rtdb.asia-southeast1.firebasedatabase.app",
                ["Firebase:CredentialFile"] = "firebase.service.json"
            })
            .Build();

        var service = new FirebaseRealtimeMessagingService(new HttpClient(), config, NullLogger<FirebaseRealtimeMessagingService>.Instance);
        var threadId = "thread_3ed91fd8397d4dea87f803fd9ca067aa";

        var sent = await service.SendMessageAsync(threadId, "8a2e59ba-ccbd-407d-a732-01034da98a69", "Dr. Chit Swe", "Hello Aung Kaung! Your lesson is scheduled.");
        Assert.NotNull(sent);
        Assert.Equal("Dr. Chit Swe", sent.SenderName);

        var messages = await service.GetMessagesAsync(threadId);
        Assert.NotEmpty(messages);
        Assert.Contains(messages, m => m.Id == sent.Id && m.Text == "Hello Aung Kaung! Your lesson is scheduled.");
    }
}
