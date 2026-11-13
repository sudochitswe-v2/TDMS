using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace TDMS.Api.Features.Messaging;

public record SendMessageRequest(string Text);

public static class MessagingEndpoints
{
    public static IEndpointRouteBuilder MapMessagingEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/messages").WithTags("Messaging");

        // POST /api/messages/{inquiryId}
        group.MapPost("/{inquiryId}", async (string inquiryId, SendMessageRequest request, SendMessage feature) =>
        {
            var result = await feature.ExecuteAsync(inquiryId, request);
            return result.ToHttpResult();
        })
        .RequireAuthorization("messages:create");

        // GET /api/messages/{inquiryId}
        group.MapGet("/{inquiryId}", async (string inquiryId, GetMessages feature) =>
        {
            var result = await feature.ExecuteAsync(inquiryId);
            return result.ToHttpResult();
        })
        .RequireAuthorization("messages:read");

        return endpoints;
    }
}
