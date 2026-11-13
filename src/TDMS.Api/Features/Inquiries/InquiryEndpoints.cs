using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace TDMS.Api.Features.Inquiries;

public record CreateInquiryRequest(
    string TutorProfileId,
    int CategoryId,
    string InitialRequirementSummary
);

public record RespondInquiryRequest(string Decision); // "Accepted" or "Declined"

public static class InquiryEndpoints
{
    public static IEndpointRouteBuilder MapInquiryEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/inquiries").WithTags("Inquiries");

        // POST /api/inquiries
        group.MapPost("/", async (CreateInquiryRequest request, CreateInquiry feature) =>
        {
            var result = await feature.ExecuteAsync(request);
            return result.ToHttpResult();
        })
        .RequireAuthorization("inquiries:create");

        // GET /api/inquiries
        group.MapGet("/", async (GetInquiries feature) =>
        {
            var result = await feature.ExecuteAsync();
            return result.ToHttpResult();
        })
        .RequireAuthorization("inquiries:read");

        // PUT /api/inquiries/{id}/respond
        group.MapPut("/{id}/respond", async (string id, RespondInquiryRequest request, RespondInquiry feature) =>
        {
            var result = await feature.ExecuteAsync(id, request);
            return result.ToHttpResult();
        })
        .RequireAuthorization("inquiries:respond");

        return endpoints;
    }
}
