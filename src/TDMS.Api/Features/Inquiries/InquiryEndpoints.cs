using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;
using TDMS.Api.Database.Entities;
using TDMS.Api.Features.Messaging;

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
        group.MapPost("/", async (
            CreateInquiryRequest request,
            ICurrentUser currentUser,
            AppDbContext context) =>
        {
            if (string.IsNullOrEmpty(currentUser.UserId)) return Results.Unauthorized();
            if (string.IsNullOrWhiteSpace(request.InitialRequirementSummary))
            {
                return Results.BadRequest(new { error = "Requirement summary is required" });
            }

            var tutor = await context.TutorProfiles
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.Id == request.TutorProfileId);

            if (tutor == null)
            {
                return Results.NotFound(new { error = "Tutor not found" });
            }

            if (tutor.UserId == currentUser.UserId)
            {
                return Results.BadRequest(new { error = "You cannot send an inquiry to your own tutor profile" });
            }

            var inquiry = new Inquiry
            {
                LearnerUserId = currentUser.UserId,
                TutorProfileId = tutor.Id,
                CategoryId = request.CategoryId,
                InitialRequirementSummary = request.InitialRequirementSummary.Trim(),
                Status = "Pending",
                FirebaseThreadId = $"thread_{Guid.NewGuid():N}",
                CreatedAt = DateTime.UtcNow
            };

            context.Inquiries.Add(inquiry);
            await context.SaveChangesAsync();

            return Results.Ok(new
            {
                inquiry.Id,
                inquiry.Status,
                inquiry.FirebaseThreadId,
                inquiry.CreatedAt
            });
        })
        .RequireAuthorization("inquiries:create");

        // GET /api/inquiries
        group.MapGet("/", async (
            ICurrentUser currentUser,
            AppDbContext context) =>
        {
            if (string.IsNullOrEmpty(currentUser.UserId)) return Results.Unauthorized();

            // Find if user is learner or tutor or both
            var inquiries = await context.Inquiries
                .Include(i => i.LearnerUser)
                .Include(i => i.Category)
                .Include(i => i.TutorProfile).ThenInclude(tp => tp.User)
                .Where(i => i.LearnerUserId == currentUser.UserId || i.TutorProfile.UserId == currentUser.UserId)
                .OrderByDescending(i => i.CreatedAt)
                .Select(i => new
                {
                    i.Id,
                    i.LearnerUserId,
                    LearnerName = i.LearnerUser.FullName,
                    i.TutorProfileId,
                    TutorUserId = i.TutorProfile.UserId,
                    TutorName = i.TutorProfile.User.FullName,
                    CategoryId = i.CategoryId,
                    CategoryName = i.Category.Name,
                    i.InitialRequirementSummary,
                    i.Status,
                    i.FirebaseThreadId,
                    i.CreatedAt,
                    i.RespondedAt
                })
                .ToListAsync();

            return Results.Ok(inquiries);
        })
        .RequireAuthorization("inquiries:read");

        // PUT /api/inquiries/{id}/respond
        group.MapPut("/{id}/respond", async (
            string id,
            RespondInquiryRequest request,
            ICurrentUser currentUser,
            AppDbContext context,
            IFirebaseMessagingService messagingService) =>
        {
            if (string.IsNullOrEmpty(currentUser.UserId)) return Results.Unauthorized();

            var inquiry = await context.Inquiries
                .Include(i => i.TutorProfile)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (inquiry == null)
            {
                return Results.NotFound(new { error = "Inquiry not found" });
            }

            // Only assigned tutor can respond
            if (inquiry.TutorProfile.UserId != currentUser.UserId && !currentUser.IsSystemAdmin)
            {
                return Results.Forbid();
            }

            if (inquiry.Status != "Pending")
            {
                return Results.BadRequest(new { error = $"Inquiry is already {inquiry.Status}" });
            }

            var isAccept = request.Decision.Equals("Accepted", StringComparison.OrdinalIgnoreCase);
            var isDecline = request.Decision.Equals("Declined", StringComparison.OrdinalIgnoreCase);

            if (!isAccept && !isDecline)
            {
                return Results.BadRequest(new { error = "Decision must be 'Accepted' or 'Declined'" });
            }

            inquiry.Status = isAccept ? "Accepted" : "Declined";
            inquiry.RespondedAt = DateTime.UtcNow;

            if (isAccept)
            {
                // Initialize thread in Firebase Realtime DB
                await messagingService.InitializeThreadAsync(
                    inquiry.FirebaseThreadId,
                    inquiry.LearnerUserId,
                    inquiry.TutorProfile.UserId,
                    inquiry.Id
                );
            }

            await context.SaveChangesAsync();
            return Results.Ok(new { message = $"Inquiry {inquiry.Status}", inquiry.Status, inquiry.FirebaseThreadId });
        })
        .RequireAuthorization("inquiries:respond");

        return endpoints;
    }
}
