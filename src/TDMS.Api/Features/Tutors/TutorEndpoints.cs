using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;
using TDMS.Api.Database.Entities;
using TDMS.Api.Features.Account;

namespace TDMS.Api.Features.Tutors;

public record TutorCardDto(
    string Id,
    string UserId,
    string FullName,
    string Email,
    string? Headline,
    string? Biography,
    int YearsOfExperience,
    decimal HourlyFee,
    string TeachingMode,
    string VerificationStatus,
    decimal AverageRating,
    int TotalReviewsCount,
    double MatchScore,
    IReadOnlyList<string> Categories,
    string? TierName,
    int PriorityBoost,
    string? ProfilePictureUrl = null
);

public record UpdateTeachingInfoRequest(
    decimal HourlyFee,
    string TeachingMode,
    int YearsOfExperience,
    List<int> CategoryIds,
    List<ScheduleSlotDto> ScheduleSlots
);

public record UpdateCustomizationRequest(
    string? Headline,
    string? Biography,
    string? LayoutThemeJson,
    bool IsPublished
);

public record UpdateProfilePictureRequest(string ProfilePictureBase64);
public record UploadTutorDocumentRequest(string DocumentType, string? FileName, string FileBase64);

public static class TutorEndpoints
{
    public static IEndpointRouteBuilder MapTutorEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/tutors").WithTags("Tutors");

        // GET /api/tutors/search
        group.MapGet("/search", async (
            int? categoryId,
            decimal? minFee,
            decimal? maxFee,
            string? teachingMode,
            byte? dayOfWeek,
            string? search,
            AppDbContext context,
            ICurrentUser currentUser) =>
        {
            // 1. Audit search
            try
            {
                context.SearchAuditLogs.Add(new SearchAuditLog
                {
                    CategoryId = categoryId,
                    LearnerUserId = currentUser.UserId,
                    SearchedAt = DateTime.UtcNow
                });
                await context.SaveChangesAsync();
            }
            catch { /* non-critical logging */ }

            // 2. Load weights
            MatchingWeights weights = new();
            var setting = await context.SystemSettings.FirstOrDefaultAsync(s => s.Key == "MatchingAlgorithmWeights");
            if (setting != null && !string.IsNullOrWhiteSpace(setting.ValueJson))
            {
                try
                {
                    var loaded = JsonSerializer.Deserialize<MatchingWeights>(setting.ValueJson);
                    if (loaded != null && loaded.IsValid())
                    {
                        weights = loaded;
                    }
                }
                catch { }
            }

            // 3. Resolve Learner criteria
            LearnerMatchingCriteria learnerCriteria;
            if (currentUser.IsAuthenticated && !string.IsNullOrEmpty(currentUser.UserId))
            {
                var learnerProfile = await context.LearnerProfiles
                    .Include(p => p.RequirementCategories)
                    .Include(p => p.ScheduleSlots)
                    .FirstOrDefaultAsync(p => p.UserId == currentUser.UserId);

                if (learnerProfile != null)
                {
                    var reqCats = categoryId.HasValue
                        ? new List<int> { categoryId.Value }
                        : learnerProfile.RequirementCategories.Select(rc => rc.CategoryId).ToList();

                    learnerCriteria = new LearnerMatchingCriteria(
                        CategoryIds: reqCats,
                        PreferredMaxHourlyFee: maxFee ?? learnerProfile.PreferredMaxHourlyFee,
                        PreferredTeachingMode: teachingMode ?? learnerProfile.PreferredTeachingMode,
                        PreferredSlots: learnerProfile.ScheduleSlots.Select(s => new LearnerScheduleCriteria(s.DayOfWeek, s.StartTime, s.EndTime)).ToList()
                    );
                }
                else
                {
                    learnerCriteria = BuildFallbackCriteria(categoryId, maxFee, teachingMode, dayOfWeek);
                }
            }
            else
            {
                learnerCriteria = BuildFallbackCriteria(categoryId, maxFee, teachingMode, dayOfWeek);
            }

            // 4. Query Verified & Published Tutors
            var query = context.TutorProfiles
                .Include(t => t.User)
                .Include(t => t.Categories).ThenInclude(tc => tc.Category)
                .Include(t => t.ScheduleSlots)
                .Include(t => t.CurrentSubscriptionPackage)
                .Where(t => t.VerificationStatus == "Verified" && t.IsPublished && t.User.IsActive)
                .AsQueryable();

            if (minFee.HasValue) query = query.Where(t => t.HourlyFee >= minFee.Value);
            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.ToLower();
                query = query.Where(t => t.User.FullName.ToLower().Contains(s) || (t.Headline != null && t.Headline.ToLower().Contains(s)));
            }

            var tutors = await query.ToListAsync();

            // 5. Calculate Match Score & Rank
            var results = tutors.Select(t =>
            {
                var candidate = new TutorCandidateInfo(
                    TutorProfileId: t.Id,
                    HourlyFee: t.HourlyFee,
                    TeachingMode: t.TeachingMode,
                    CategoryIds: t.Categories.Select(c => c.CategoryId).ToList(),
                    AvailableSlots: t.ScheduleSlots.Select(s => new LearnerScheduleCriteria(s.DayOfWeek, s.StartTime, s.EndTime)).ToList()
                );

                var match = MatchingEngine.CalculateMatch(learnerCriteria, candidate, weights);
                var boost = t.CurrentSubscriptionPackage?.PrioritySearchBoost ?? 0;

                return new TutorCardDto(
                    Id: t.Id,
                    UserId: t.UserId,
                    FullName: t.User.FullName,
                    Email: t.User.Email,
                    Headline: t.Headline,
                    Biography: t.Biography,
                    YearsOfExperience: t.YearsOfExperience,
                    HourlyFee: t.HourlyFee,
                    TeachingMode: t.TeachingMode,
                    VerificationStatus: t.VerificationStatus,
                    AverageRating: t.AverageRating,
                    TotalReviewsCount: t.TotalReviewsCount,
                    MatchScore: match.OverallPercentage,
                    Categories: t.Categories.Select(c => c.Category.Name).ToList(),
                    TierName: t.CurrentSubscriptionPackage?.TierName,
                    PriorityBoost: boost,
                    ProfilePictureUrl: t.ProfilePictureUrl
                );
            })
            // Rank by PriorityBoost desc, then MatchScore desc, then AverageRating desc
            .OrderByDescending(r => r.PriorityBoost)
            .ThenByDescending(r => r.MatchScore)
            .ThenByDescending(r => r.AverageRating)
            .ToList();

            return Results.Ok(results);
        })
        .AllowAnonymous();

        // GET /api/tutors/{id}
        group.MapGet("/{id}", async (string id, ICurrentUser currentUser, AppDbContext context) =>
        {
            var tutor = await context.TutorProfiles
                .Include(t => t.User)
                .Include(t => t.Categories).ThenInclude(tc => tc.Category)
                .Include(t => t.ScheduleSlots)
                .Include(t => t.Documents)
                .Include(t => t.CurrentSubscriptionPackage)
                .Include(t => t.Reviews).ThenInclude(r => r.LearnerUser)
                .FirstOrDefaultAsync(t => t.Id == id || t.UserId == id);

            if (tutor == null)
            {
                return Results.NotFound(new { error = "Tutor profile not found" });
            }

            return Results.Ok(new
            {
                tutor.Id,
                tutor.UserId,
                tutor.User.FullName,
                tutor.User.Email,
                tutor.Headline,
                tutor.Biography,
                tutor.YearsOfExperience,
                tutor.HourlyFee,
                tutor.TeachingMode,
                tutor.VerificationStatus,
                tutor.ProfilePictureUrl,
                tutor.AverageRating,
                tutor.TotalReviewsCount,
                tutor.IsPublished,
                tutor.LayoutThemeJson,
                TierName = tutor.CurrentSubscriptionPackage?.TierName,
                Categories = tutor.Categories.Select(c => new { c.CategoryId, c.Category.Name, c.GradeLevelTarget }),
                ScheduleSlots = tutor.ScheduleSlots.Select(s => new ScheduleSlotDto(s.DayOfWeek, s.StartTime.ToString(@"hh\:mm"), s.EndTime.ToString(@"hh\:mm"))),
                Documents = tutor.Documents.Select(d => new { d.Id, d.DocumentType, d.FileName, d.FileUrl, d.FileSizeBytes, d.UploadedAt }),
                RatingBreakdown = new Dictionary<int, int>
                {
                    [5] = tutor.Reviews.Count(r => r.StarRating == 5),
                    [4] = tutor.Reviews.Count(r => r.StarRating == 4),
                    [3] = tutor.Reviews.Count(r => r.StarRating == 3),
                    [2] = tutor.Reviews.Count(r => r.StarRating == 2),
                    [1] = tutor.Reviews.Count(r => r.StarRating == 1),
                },
                RecentReviews = tutor.Reviews.OrderByDescending(r => r.CreatedAt).Select(r => new
                {
                    r.Id,
                    r.LearnerUserId,
                    LearnerName = currentUser.IsAuthenticated ? r.LearnerUser.FullName : "Student",
                    r.StarRating,
                    Comment = currentUser.IsAuthenticated ? r.Comment : null,
                    r.CreatedAt
                })
            });
        })
        .AllowAnonymous();

        // GET /api/tutors/me
        group.MapGet("/me", async (ICurrentUser currentUser, AppDbContext context) =>
        {
            if (string.IsNullOrEmpty(currentUser.UserId)) return Results.Unauthorized();

            var tutor = await context.TutorProfiles
                .Include(t => t.User)
                .Include(t => t.Categories).ThenInclude(tc => tc.Category)
                .Include(t => t.ScheduleSlots)
                .Include(t => t.Documents)
                .Include(t => t.CurrentSubscriptionPackage)
                .FirstOrDefaultAsync(t => t.UserId == currentUser.UserId);

            if (tutor == null) return Results.NotFound(new { error = "Tutor profile not found" });

            return Results.Ok(new
            {
                tutor.Id,
                tutor.UserId,
                tutor.Headline,
                tutor.Biography,
                tutor.YearsOfExperience,
                tutor.HourlyFee,
                tutor.TeachingMode,
                tutor.VerificationStatus,
                tutor.RejectionReason,
                tutor.ProfilePictureUrl,
                tutor.AverageRating,
                tutor.TotalReviewsCount,
                tutor.IsPublished,
                tutor.LayoutThemeJson,
                tutor.CurrentSubscriptionPackageId,
                SubscriptionPackage = tutor.CurrentSubscriptionPackage != null ? new
                {
                    tutor.CurrentSubscriptionPackage.Id,
                    tutor.CurrentSubscriptionPackage.TierName,
                    tutor.CurrentSubscriptionPackage.MaxActiveSubjects,
                    tutor.CurrentSubscriptionPackage.PrioritySearchBoost
                } : null,
                Categories = tutor.Categories.Select(c => new { c.CategoryId, c.Category.Name, c.GradeLevelTarget }),
                ScheduleSlots = tutor.ScheduleSlots.Select(s => new ScheduleSlotDto(s.DayOfWeek, s.StartTime.ToString(@"hh\:mm"), s.EndTime.ToString(@"hh\:mm"))),
                Documents = tutor.Documents.Select(d => new { d.Id, d.DocumentType, d.FileName, d.FileUrl, d.FileSizeBytes, d.UploadedAt })
            });
        })
        .RequireAuthorization("tutors:update");

        // PUT /api/tutors/me/teaching-info
        group.MapPut("/me/teaching-info", async (UpdateTeachingInfoRequest request, ICurrentUser currentUser, AppDbContext context) =>
        {
            if (string.IsNullOrEmpty(currentUser.UserId)) return Results.Unauthorized();

            var tutor = await context.TutorProfiles
                .Include(t => t.Categories)
                .Include(t => t.ScheduleSlots)
                .Include(t => t.CurrentSubscriptionPackage)
                .FirstOrDefaultAsync(t => t.UserId == currentUser.UserId);

            if (tutor == null) return Results.NotFound(new { error = "Tutor profile not found" });

            // Validate max active subjects according to subscription package tier
            var maxAllowed = tutor.CurrentSubscriptionPackage?.MaxActiveSubjects ?? 3;
            var targetCategoryIds = (request.CategoryIds ?? []).Distinct().ToList();
            if (targetCategoryIds.Count > maxAllowed)
            {
                return Results.BadRequest(new
                {
                    error = $"Your subscription plan limits you to {maxAllowed} active subject categories. Please upgrade your tier to add more subjects."
                });
            }

            tutor.HourlyFee = request.HourlyFee;
            tutor.TeachingMode = request.TeachingMode;
            tutor.YearsOfExperience = request.YearsOfExperience;

            // Sync categories
            context.TutorCategories.RemoveRange(tutor.Categories);
            foreach (var cid in targetCategoryIds)
            {
                context.TutorCategories.Add(new TutorCategory
                {
                    TutorProfileId = tutor.Id,
                    CategoryId = cid
                });
            }

            // Sync schedule slots
            context.TutorScheduleSlots.RemoveRange(tutor.ScheduleSlots);
            if (request.ScheduleSlots != null)
            {
                foreach (var slot in request.ScheduleSlots)
                {
                    if (TimeSpan.TryParse(slot.StartTime, out var start) && TimeSpan.TryParse(slot.EndTime, out var end))
                    {
                        context.TutorScheduleSlots.Add(new TutorScheduleSlot
                        {
                            TutorProfileId = tutor.Id,
                            DayOfWeek = slot.DayOfWeek,
                            StartTime = start,
                            EndTime = end
                        });
                    }
                }
            }

            await context.SaveChangesAsync();
            return Results.Ok(new { message = "Teaching information updated successfully" });
        })
        .RequireAuthorization("tutors:update");

        // PUT /api/tutors/me/customization
        group.MapPut("/me/customization", async (UpdateCustomizationRequest request, ICurrentUser currentUser, AppDbContext context) =>
        {
            if (string.IsNullOrEmpty(currentUser.UserId)) return Results.Unauthorized();

            var tutor = await context.TutorProfiles.FirstOrDefaultAsync(t => t.UserId == currentUser.UserId);
            if (tutor == null) return Results.NotFound(new { error = "Tutor profile not found" });

            // Cannot publish if not Verified
            if (request.IsPublished && tutor.VerificationStatus != "Verified")
            {
                return Results.BadRequest(new { error = "You cannot publish your tutor profile until onboarding documents are verified by an administrator." });
            }

            tutor.Headline = request.Headline;
            tutor.Biography = request.Biography;
            tutor.LayoutThemeJson = request.LayoutThemeJson;
            tutor.IsPublished = request.IsPublished;

            await context.SaveChangesAsync();
            return Results.Ok(new { message = "Profile customization saved successfully", isPublished = tutor.IsPublished });
        })
        .RequireAuthorization("tutors:update");

        // PUT /api/tutors/me/profile-picture
        group.MapPut("/me/profile-picture", async (UpdateProfilePictureRequest request, ICurrentUser currentUser, AppDbContext context) =>
        {
            if (string.IsNullOrEmpty(currentUser.UserId)) return Results.Unauthorized();

            var tutor = await context.TutorProfiles.FirstOrDefaultAsync(t => t.UserId == currentUser.UserId);
            if (tutor == null) return Results.NotFound(new { error = "Tutor profile not found" });

            if (string.IsNullOrWhiteSpace(request.ProfilePictureBase64))
            {
                return Results.BadRequest(new { error = "Profile picture data is required" });
            }

            tutor.ProfilePictureUrl = request.ProfilePictureBase64;
            tutor.UpdatedAt = DateTime.UtcNow;
            await context.SaveChangesAsync();

            return Results.Ok(new { message = "Profile picture updated successfully", profilePictureUrl = tutor.ProfilePictureUrl });
        })
        .RequireAuthorization("tutors:update");

        // POST /api/tutors/me/documents
        group.MapPost("/me/documents", async (UploadTutorDocumentRequest request, ICurrentUser currentUser, AppDbContext context) =>
        {
            if (string.IsNullOrEmpty(currentUser.UserId)) return Results.Unauthorized();

            var tutor = await context.TutorProfiles
                .Include(t => t.Documents)
                .FirstOrDefaultAsync(t => t.UserId == currentUser.UserId);
            if (tutor == null) return Results.NotFound(new { error = "Tutor profile not found" });

            if (string.IsNullOrWhiteSpace(request.FileBase64))
            {
                return Results.BadRequest(new { error = "Document file data is required" });
            }

            var docType = string.IsNullOrWhiteSpace(request.DocumentType) ? "AcademicCertificate" : request.DocumentType.Trim();
            var fileName = string.IsNullOrWhiteSpace(request.FileName) ? $"{docType}_{DateTime.UtcNow:yyyyMMddHHmmss}" : request.FileName.Trim();
            var sizeBytes = (long)(request.FileBase64.Length * 0.75);

            var doc = new TutorDocument
            {
                TutorProfileId = tutor.Id,
                DocumentType = docType,
                FileName = fileName,
                FileUrl = request.FileBase64,
                FileSizeBytes = sizeBytes,
                UploadedAt = DateTime.UtcNow
            };

            context.TutorDocuments.Add(doc);
            tutor.UpdatedAt = DateTime.UtcNow;
            await context.SaveChangesAsync();

            return Results.Ok(new
            {
                message = "Verification document uploaded successfully",
                document = new
                {
                    doc.Id,
                    doc.DocumentType,
                    doc.FileName,
                    doc.FileUrl,
                    doc.FileSizeBytes,
                    doc.UploadedAt
                }
            });
        })
        .RequireAuthorization("tutors:update");

        // DELETE /api/tutors/me/documents/{documentId:int}
        group.MapDelete("/me/documents/{documentId:int}", async (int documentId, ICurrentUser currentUser, AppDbContext context) =>
        {
            if (string.IsNullOrEmpty(currentUser.UserId)) return Results.Unauthorized();

            var tutor = await context.TutorProfiles.FirstOrDefaultAsync(t => t.UserId == currentUser.UserId);
            if (tutor == null) return Results.NotFound(new { error = "Tutor profile not found" });

            var doc = await context.TutorDocuments.FirstOrDefaultAsync(d => d.Id == documentId && d.TutorProfileId == tutor.Id);
            if (doc == null) return Results.NotFound(new { error = "Document not found" });

            context.TutorDocuments.Remove(doc);
            tutor.UpdatedAt = DateTime.UtcNow;
            await context.SaveChangesAsync();

            return Results.Ok(new { message = "Document removed successfully" });
        })
        .RequireAuthorization("tutors:update");

        // POST /api/tutors/me/reverify
        group.MapPost("/me/reverify", async (ICurrentUser currentUser, AppDbContext context) =>
        {
            if (string.IsNullOrEmpty(currentUser.UserId)) return Results.Unauthorized();

            var tutor = await context.TutorProfiles
                .Include(t => t.Documents)
                .FirstOrDefaultAsync(t => t.UserId == currentUser.UserId);
            if (tutor == null) return Results.NotFound(new { error = "Tutor profile not found" });

            if (tutor.Documents.Count == 0 && string.IsNullOrEmpty(tutor.ProfilePictureUrl))
            {
                return Results.BadRequest(new
                {
                    error = "Please upload at least one academic certificate, tutoring proof document, or profile photo before submitting for verification."
                });
            }

            tutor.VerificationStatus = "Pending";
            tutor.RejectionReason = null;
            tutor.VerifiedByUserId = null;
            tutor.VerifiedAt = null;
            tutor.UpdatedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();

            return Results.Ok(new
            {
                message = "Your credentials and verification documents have been submitted for review.",
                status = tutor.VerificationStatus
            });
        })
        .RequireAuthorization("tutors:update");

        return endpoints;
    }

    private static LearnerMatchingCriteria BuildFallbackCriteria(int? categoryId, decimal? maxFee, string? teachingMode, byte? dayOfWeek)
    {
        var slots = new List<LearnerScheduleCriteria>();
        if (dayOfWeek.HasValue)
        {
            slots.Add(new LearnerScheduleCriteria(dayOfWeek.Value, new TimeSpan(0, 0, 0), new TimeSpan(23, 59, 59)));
        }

        return new LearnerMatchingCriteria(
            CategoryIds: categoryId.HasValue ? [categoryId.Value] : [],
            PreferredMaxHourlyFee: maxFee ?? 100.0m,
            PreferredTeachingMode: teachingMode ?? "Both",
            PreferredSlots: slots
        );
    }
}
