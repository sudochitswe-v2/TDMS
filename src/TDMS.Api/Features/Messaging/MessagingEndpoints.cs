using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;

namespace TDMS.Api.Features.Messaging;

public record SendMessageRequest(string Text);

public static class MessagingEndpoints
{
    public static IEndpointRouteBuilder MapMessagingEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/messages").WithTags("Messaging");

        // POST /api/messages/{inquiryId}
        group.MapPost("/{inquiryId}", async (
            string inquiryId,
            SendMessageRequest request,
            ICurrentUser currentUser,
            AppDbContext context,
            IFirebaseMessagingService messagingService) =>
        {
            if (string.IsNullOrEmpty(currentUser.UserId)) return Results.Unauthorized();
            if (string.IsNullOrWhiteSpace(request.Text))
            {
                return Results.BadRequest(new { error = "Message text cannot be empty" });
            }

            var inquiry = await context.Inquiries
                .Include(i => i.TutorProfile)
                .FirstOrDefaultAsync(i => i.Id == inquiryId);

            if (inquiry == null)
            {
                return Results.NotFound(new { error = "Inquiry not found" });
            }

            // Verify participation
            bool isLearner = inquiry.LearnerUserId == currentUser.UserId;
            bool isTutor = inquiry.TutorProfile.UserId == currentUser.UserId;

            if (!isLearner && !isTutor && !currentUser.IsSystemAdmin)
            {
                return Results.Forbid();
            }

            // Message unlocked only if inquiry is Accepted
            if (inquiry.Status != "Accepted")
            {
                return Results.BadRequest(new { error = "Messaging is locked until the tutor accepts the inquiry" });
            }

            var senderUser = await context.Users.FindAsync(currentUser.UserId);
            var senderName = senderUser?.FullName ?? "User";

            var message = await messagingService.SendMessageAsync(
                inquiry.FirebaseThreadId,
                currentUser.UserId,
                senderName,
                request.Text.Trim()
            );

            return Results.Ok(message);
        })
        .RequireAuthorization("messages:create");

        // GET /api/messages/{inquiryId}
        group.MapGet("/{inquiryId}", async (
            string inquiryId,
            ICurrentUser currentUser,
            AppDbContext context,
            IFirebaseMessagingService messagingService) =>
        {
            if (string.IsNullOrEmpty(currentUser.UserId)) return Results.Unauthorized();

            var inquiry = await context.Inquiries
                .Include(i => i.TutorProfile)
                .FirstOrDefaultAsync(i => i.Id == inquiryId);

            if (inquiry == null) return Results.NotFound(new { error = "Inquiry not found" });

            bool isLearner = inquiry.LearnerUserId == currentUser.UserId;
            bool isTutor = inquiry.TutorProfile.UserId == currentUser.UserId;

            if (!isLearner && !isTutor && !currentUser.IsSystemAdmin)
            {
                return Results.Forbid();
            }

            var messages = await messagingService.GetMessagesAsync(inquiry.FirebaseThreadId);
            return Results.Ok(messages);
        })
        .RequireAuthorization("messages:read");

        return endpoints;
    }
}
