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
        public HttpRequestMessage? LastRequest { get; private set; }
        public string? LastRequestBody { get; private set; }
        public HttpResponseMessage ResponseToReturn { get; set; } = new(HttpStatusCode.OK)
        {
            Content = new StringContent("{}")
        };

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            LastRequest = request;
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
        Assert.NotNull(handler.LastRequest);
        Assert.Equal(HttpMethod.Put, handler.LastRequest.Method);
        Assert.StartsWith("https://test-project-default-rtdb.firebaseio.com/threads/thread_456/messages/", handler.LastRequest.RequestUri?.ToString());
        Assert.EndsWith(".json?auth=legacy-secret-key", handler.LastRequest.RequestUri?.ToString());
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
}
