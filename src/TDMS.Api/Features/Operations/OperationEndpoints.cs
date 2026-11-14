using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace TDMS.Api.Features.Operations;

public record VerifyTutorRequest(string Decision, string? RejectionReason);
public record CreateCategoryRequest(string Name, string? Description, bool IsActive = true);
public record UpdateCategoryRequest(string Name, string? Description, bool IsActive);
public record SaveSubscriptionPackageRequest(
    string TierName,
    int DurationDays,
    decimal DisplayFee,
    int MaxActiveSubjects,
    int PrioritySearchBoost,
    List<string>? Features,
    bool IsActive = true
);
public record PurchaseSubscriptionRequest(
    int PackageId,
    string PaymentMethod,
    string TransactionLast6,
    string ScreenshotBase64,
    string? Notes
);
public record RejectSubscriptionPaymentRequest(string RejectionReason);

public static class OperationEndpoints
{
    public static IEndpointRouteBuilder MapOperationEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api").WithTags("Operations");

        // --- Tutor Verification ---
        // GET /api/operations/tutors/pending
        group.MapGet("/operations/tutors/pending", async (string? status, GetPendingTutors feature) =>
        {
            var result = await feature.ExecuteAsync(status);
            return Results.Ok(result);
        })
        .RequireAuthorization("tutors:verify");

        // PUT /api/operations/tutors/{tutorId}/verify
        group.MapPut("/operations/tutors/{tutorId}/verify", async (string tutorId, VerifyTutorRequest request, VerifyTutor feature) =>
        {
            var result = await feature.ExecuteAsync(tutorId, request);
            return result.ToHttpResult();
        })
        .RequireAuthorization("tutors:verify");

        // --- Categories Management ---
        // GET /api/categories (Public)
        group.MapGet("/categories", async (GetCategories feature) =>
        {
            var result = await feature.ExecuteAsync();
            return Results.Ok(result);
        })
        .AllowAnonymous();

        // POST /api/categories
        group.MapPost("/categories", async (CreateCategoryRequest request, CreateCategory feature) =>
        {
            var result = await feature.ExecuteAsync(request);
            return result.ToHttpResult();
        })
        .RequireAuthorization("categories:create");

        // PUT /api/categories/{id}
        group.MapPut("/categories/{id:int}", async (int id, UpdateCategoryRequest request, UpdateCategory feature) =>
        {
            var result = await feature.ExecuteAsync(id, request);
            return result.ToHttpResult();
        })
        .RequireAuthorization("categories:update");

        // DELETE /api/categories/{id}
        group.MapDelete("/categories/{id:int}", async (int id, DeleteCategory feature) =>
        {
            var result = await feature.ExecuteAsync(id);
            return result.ToHttpResult();
        })
        .RequireAuthorization("categories:delete");

        // --- Subscription Packages & Payments ---
        // GET /api/subscriptions (Public)
        group.MapGet("/subscriptions", async (GetSubscriptions feature) =>
        {
            var result = await feature.ExecuteAsync();
            return Results.Ok(result);
        })
        .AllowAnonymous();

        // POST /api/subscriptions
        group.MapPost("/subscriptions", async (SaveSubscriptionPackageRequest request, CreateSubscriptionPackage feature) =>
        {
            var result = await feature.ExecuteAsync(request);
            return result.ToHttpResult();
        })
        .RequireAuthorization("subscriptions:create");

        // PUT /api/subscriptions/{id}
        group.MapPut("/subscriptions/{id:int}", async (int id, SaveSubscriptionPackageRequest request, UpdateSubscriptionPackage feature) =>
        {
            var result = await feature.ExecuteAsync(id, request);
            return result.ToHttpResult();
        })
        .RequireAuthorization("subscriptions:update");

        // GET /api/subscriptions/payment-info (Public)
        group.MapGet("/subscriptions/payment-info", (GetPaymentInfo feature) =>
        {
            var result = feature.Execute();
            return Results.Ok(result);
        });

        // POST /api/subscriptions/{packageId}/select
        group.MapPost("/subscriptions/{packageId:int}/select", async (int packageId, SelectSubscriptionPackage feature) =>
        {
            var result = await feature.ExecuteAsync(packageId);
            return result.ToHttpResult();
        })
        .RequireAuthorization("subscriptions:select");

        // POST /api/subscriptions/purchase
        group.MapPost("/subscriptions/purchase", async (PurchaseSubscriptionRequest request, PurchaseSubscription feature) =>
        {
            var result = await feature.ExecuteAsync(request);
            return result.ToHttpResult();
        })
        .RequireAuthorization("subscriptions:select");

        // GET /api/subscriptions/my-payments
        group.MapGet("/subscriptions/my-payments", async (GetMyPayments feature) =>
        {
            var result = await feature.ExecuteAsync();
            return result.ToHttpResult();
        })
        .RequireAuthorization("subscriptions:select");

        // GET /api/operations/subscriptions/payments
        group.MapGet("/operations/subscriptions/payments", async (string? status, GetOperationsPayments feature) =>
        {
            var result = await feature.ExecuteAsync(status);
            return Results.Ok(result);
        })
        .RequireAuthorization("subscriptions:read");

        // PUT /api/operations/subscriptions/payments/{paymentId:int}/confirm
        group.MapPut("/operations/subscriptions/payments/{paymentId:int}/confirm", async (int paymentId, ConfirmSubscriptionPayment feature) =>
        {
            var result = await feature.ExecuteAsync(paymentId);
            return result.ToHttpResult();
        })
        .RequireAuthorization("subscriptions:update");

        // PUT /api/operations/subscriptions/payments/{paymentId:int}/reject
        group.MapPut("/operations/subscriptions/payments/{paymentId:int}/reject", async (int paymentId, RejectSubscriptionPaymentRequest request, RejectSubscriptionPayment feature) =>
        {
            var result = await feature.ExecuteAsync(paymentId, request);
            return result.ToHttpResult();
        })
        .RequireAuthorization("subscriptions:update");

        // --- Operational Reports ---
        // GET /api/operations/reports
        group.MapGet("/operations/reports", async (GetOperationsReport feature) =>
        {
            var result = await feature.ExecuteAsync();
            return Results.Ok(result);
        })
        .RequireAuthorization("reports:read");

        // GET /api/operations/reports/payments
        group.MapGet("/operations/reports/payments", async (GetPaymentReport feature) =>
        {
            var result = await feature.ExecuteAsync();
            return Results.Ok(result);
        })
        .RequireAuthorization("reports:read");

        // GET /api/operations/reports/subscriptions
        group.MapGet("/operations/reports/subscriptions", async (GetSubscriptionReport feature) =>
        {
            var result = await feature.ExecuteAsync();
            return Results.Ok(result);
        })
        .RequireAuthorization("reports:read");

        return endpoints;
    }
}
