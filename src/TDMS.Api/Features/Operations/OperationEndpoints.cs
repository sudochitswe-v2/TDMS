using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;
using TDMS.Api.Database.Entities;

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

        // GET /api/operations/tutors/pending
        group.MapGet("/operations/tutors/pending", async (string? status, AppDbContext context) =>
        {
            var query = context.TutorProfiles
                .Include(t => t.User)
                .Include(t => t.Documents)
                .Include(t => t.Categories).ThenInclude(tc => tc.Category)
                .AsQueryable();

            if (string.Equals(status, "rejected", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(t => t.VerificationStatus == "Rejected");
            }
            else if (string.Equals(status, "all", StringComparison.OrdinalIgnoreCase))
            {
                // All non-empty verification statuses
            }
            else
            {
                query = query.Where(t => t.VerificationStatus == "Pending");
            }

            var tutors = await query
                .OrderBy(t => t.CreatedAt)
                .Select(t => new
                {
                    t.Id,
                    t.UserId,
                    t.User.FullName,
                    t.User.Email,
                    t.Headline,
                    t.Biography,
                    t.YearsOfExperience,
                    t.HourlyFee,
                    t.TeachingMode,
                    t.VerificationStatus,
                    t.RejectionReason,
                    t.ProfilePictureUrl,
                    t.CreatedAt,
                    Categories = t.Categories.Select(c => c.Category.Name),
                    Documents = t.Documents.Select(d => new
                    {
                        d.Id,
                        d.DocumentType,
                        d.FileName,
                        d.FileUrl,
                        d.FileSizeBytes,
                        d.UploadedAt
                    })
                })
                .ToListAsync();

            return Results.Ok(tutors);
        })
        .RequireAuthorization("tutors:verify");

        // PUT /api/operations/tutors/{tutorId}/verify
        group.MapPut("/operations/tutors/{tutorId}/verify", async (
            string tutorId,
            VerifyTutorRequest request,
            ICurrentUser currentUser,
            AppDbContext context) =>
        {
            var tutor = await context.TutorProfiles.FirstOrDefaultAsync(t => t.Id == tutorId || t.UserId == tutorId);
            if (tutor == null) return Results.NotFound(new { error = "Tutor profile not found" });

            var isApprove = request.Decision.Equals("Verified", StringComparison.OrdinalIgnoreCase) ||
                            request.Decision.Equals("Approve", StringComparison.OrdinalIgnoreCase);

            var isReject = request.Decision.Equals("Rejected", StringComparison.OrdinalIgnoreCase) ||
                           request.Decision.Equals("Reject", StringComparison.OrdinalIgnoreCase);

            if (!isApprove && !isReject)
            {
                return Results.BadRequest(new { error = "Decision must be 'Verified' or 'Rejected'" });
            }

            if (isApprove)
            {
                tutor.VerificationStatus = "Verified";
                tutor.RejectionReason = null;
                tutor.VerifiedByUserId = currentUser.UserId;
                tutor.VerifiedAt = DateTime.UtcNow;
                tutor.IsPublished = true; // Auto publish upon verification
            }
            else
            {
                if (string.IsNullOrWhiteSpace(request.RejectionReason))
                {
                    return Results.BadRequest(new { error = "Rejection reason is required when rejecting a tutor" });
                }

                tutor.VerificationStatus = "Rejected";
                tutor.RejectionReason = request.RejectionReason.Trim();
                tutor.VerifiedByUserId = currentUser.UserId;
                tutor.VerifiedAt = DateTime.UtcNow;
                tutor.IsPublished = false;
            }

            await context.SaveChangesAsync();
            return Results.Ok(new { message = $"Tutor verification status set to {tutor.VerificationStatus}", status = tutor.VerificationStatus });
        })
        .RequireAuthorization("tutors:verify");

        // --- Categories CRUD ---
        // GET /api/categories (Public)
        group.MapGet("/categories", async (AppDbContext context) =>
        {
            var categories = await context.Categories
                .OrderBy(c => c.Name)
                .Select(c => new
                {
                    c.Id,
                    c.Name,
                    c.Description,
                    c.IsActive,
                    TutorCount = c.TutorCategories.Count
                })
                .ToListAsync();

            return Results.Ok(categories);
        })
        .AllowAnonymous();

        // POST /api/categories
        group.MapPost("/categories", async (CreateCategoryRequest request, AppDbContext context) =>
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return Results.BadRequest(new { error = "Category name is required" });
            }

            var exists = await context.Categories.AnyAsync(c => c.Name.ToLower() == request.Name.Trim().ToLower());
            if (exists)
            {
                return Results.Conflict(new { error = "A category with this name already exists" });
            }

            var category = new Category
            {
                Name = request.Name.Trim(),
                Description = request.Description?.Trim(),
                IsActive = request.IsActive
            };

            context.Categories.Add(category);
            await context.SaveChangesAsync();

            return Results.Ok(category);
        })
        .RequireAuthorization("categories:create");

        // PUT /api/categories/{id}
        group.MapPut("/categories/{id:int}", async (int id, UpdateCategoryRequest request, AppDbContext context) =>
        {
            var category = await context.Categories.FindAsync(id);
            if (category == null) return Results.NotFound(new { error = "Category not found" });

            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return Results.BadRequest(new { error = "Category name is required" });
            }

            var duplicate = await context.Categories.AnyAsync(c => c.Id != id && c.Name.ToLower() == request.Name.Trim().ToLower());
            if (duplicate)
            {
                return Results.Conflict(new { error = "A category with this name already exists" });
            }

            category.Name = request.Name.Trim();
            category.Description = request.Description?.Trim();
            category.IsActive = request.IsActive;

            await context.SaveChangesAsync();
            return Results.Ok(category);
        })
        .RequireAuthorization("categories:update");

        // DELETE /api/categories/{id}
        group.MapDelete("/categories/{id:int}", async (int id, AppDbContext context) =>
        {
            var category = await context.Categories.FindAsync(id);
            if (category == null) return Results.NotFound(new { error = "Category not found" });

            // Block deletion if active TutorCategories reference this category
            var hasReferencingTutors = await context.TutorCategories.AnyAsync(tc => tc.CategoryId == id);
            if (hasReferencingTutors)
            {
                return Results.BadRequest(new
                {
                    error = "Cannot delete category: one or more active tutors teach this subject. Reassign or remove their subjects first."
                });
            }

            context.Categories.Remove(category);
            await context.SaveChangesAsync();
            return Results.Ok(new { message = "Category deleted successfully" });
        })
        .RequireAuthorization("categories:delete");

        // --- Subscription Packages ---
        // GET /api/subscriptions (Public)
        group.MapGet("/subscriptions", async (AppDbContext context) =>
        {
            var packages = await context.SubscriptionPackages
                .OrderBy(s => s.DisplayFee)
                .ToListAsync();

            return Results.Ok(packages);
        })
        .AllowAnonymous();

        // POST /api/subscriptions
        group.MapPost("/subscriptions", async (SaveSubscriptionPackageRequest request, AppDbContext context) =>
        {
            if (string.IsNullOrWhiteSpace(request.TierName))
            {
                return Results.BadRequest(new { error = "Tier name is required" });
            }

            var package = new SubscriptionPackage
            {
                TierName = request.TierName.Trim(),
                DurationDays = request.DurationDays,
                DisplayFee = request.DisplayFee,
                MaxActiveSubjects = request.MaxActiveSubjects,
                PrioritySearchBoost = request.PrioritySearchBoost,
                FeaturesJson = request.Features != null ? JsonSerializer.Serialize(request.Features) : null,
                IsActive = request.IsActive
            };

            context.SubscriptionPackages.Add(package);
            await context.SaveChangesAsync();
            return Results.Ok(package);
        })
        .RequireAuthorization("subscriptions:create");

        // PUT /api/subscriptions/{id}
        group.MapPut("/subscriptions/{id:int}", async (int id, SaveSubscriptionPackageRequest request, AppDbContext context) =>
        {
            var package = await context.SubscriptionPackages.FindAsync(id);
            if (package == null) return Results.NotFound(new { error = "Subscription package not found" });

            package.TierName = request.TierName.Trim();
            package.DurationDays = request.DurationDays;
            package.DisplayFee = request.DisplayFee;
            package.MaxActiveSubjects = request.MaxActiveSubjects;
            package.PrioritySearchBoost = request.PrioritySearchBoost;
            package.FeaturesJson = request.Features != null ? JsonSerializer.Serialize(request.Features) : null;
            package.IsActive = request.IsActive;

            await context.SaveChangesAsync();
            return Results.Ok(package);
        })
        .RequireAuthorization("subscriptions:update");

        // GET /api/subscriptions/payment-info (Public)
        group.MapGet("/subscriptions/payment-info", () =>
        {
            return Results.Ok(new
            {
                Instructions = "Transfer the exact subscription fee in MMK to any of the official platform accounts below. After transferring, note the last 6 digits of your transaction reference ID and capture a clear screenshot of the payment receipt. Submit these details under your chosen subscription tier for Operations verification.",
                Accounts = new[]
                {
                    new { Method = "KBZPay", AccountName = "TDMS Education Co., Ltd.", AccountNumber = "09-977-123-456", Type = "Mobile Wallet", Recommended = true },
                    new { Method = "WavePay", AccountName = "TDMS Official Operations", AccountNumber = "09-977-123-456", Type = "Mobile Wallet", Recommended = false },
                    new { Method = "AYAPay", AccountName = "TDMS Education Services", AccountNumber = "09-977-123-456", Type = "Mobile Wallet", Recommended = false },
                    new { Method = "CBPay", AccountName = "TDMS Company Limited", AccountNumber = "09-977-123-456", Type = "Mobile Wallet", Recommended = false },
                    new { Method = "BankTransfer", AccountName = "TDMS Platform Company Limited", AccountNumber = "0123-4567-8901-2345", Type = "KBZ Bank / CB Bank Account", Recommended = false }
                }
            });
        });

        // POST /api/subscriptions/{packageId}/select (Immediate for Free / redirects to purchase for Paid)
        group.MapPost("/subscriptions/{packageId:int}/select", async (int packageId, ICurrentUser currentUser, AppDbContext context) =>
        {
            if (string.IsNullOrEmpty(currentUser.UserId)) return Results.Unauthorized();

            var package = await context.SubscriptionPackages.FindAsync(packageId);
            if (package == null || !package.IsActive)
            {
                return Results.NotFound(new { error = "Subscription package not found or inactive" });
            }

            var tutor = await context.TutorProfiles.FirstOrDefaultAsync(t => t.UserId == currentUser.UserId);
            if (tutor == null)
            {
                return Results.NotFound(new { error = "Tutor profile not found" });
            }

            if (package.DisplayFee > 0)
            {
                return Results.BadRequest(new { error = "Paid subscription tiers require payment verification. Please submit your transaction proof and screenshot via /api/subscriptions/purchase." });
            }

            tutor.CurrentSubscriptionPackageId = package.Id;
            tutor.SubscriptionUpdatedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();
            return Results.Ok(new { message = $"Successfully activated free {package.TierName} tier", tierName = package.TierName, status = "Confirmed" });
        })
        .RequireAuthorization("subscriptions:select");

        // POST /api/subscriptions/purchase (Manual Payment Submission with Trx Last 6 and Screenshot)
        group.MapPost("/subscriptions/purchase", async (PurchaseSubscriptionRequest request, ICurrentUser currentUser, AppDbContext context) =>
        {
            if (string.IsNullOrEmpty(currentUser.UserId)) return Results.Unauthorized();

            var tutor = await context.TutorProfiles
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.UserId == currentUser.UserId);

            if (tutor == null)
            {
                return Results.NotFound(new { error = "Tutor profile not found" });
            }

            var package = await context.SubscriptionPackages.FindAsync(request.PackageId);
            if (package == null || !package.IsActive)
            {
                return Results.NotFound(new { error = "Subscription package not found or inactive" });
            }

            // If free tier, immediately activate
            if (package.DisplayFee <= 0)
            {
                tutor.CurrentSubscriptionPackageId = package.Id;
                tutor.SubscriptionUpdatedAt = DateTime.UtcNow;
                await context.SaveChangesAsync();
                return Results.Ok(new { message = $"Successfully activated {package.TierName} tier", tierName = package.TierName, status = "Confirmed" });
            }

            if (string.IsNullOrWhiteSpace(request.PaymentMethod))
            {
                return Results.BadRequest(new { error = "Payment method is required (e.g. KBZPay, WavePay, AYA Pay, CB Pay, Bank Transfer)." });
            }

            var last6 = request.TransactionLast6?.Trim();
            if (string.IsNullOrWhiteSpace(last6) || last6.Length < 4)
            {
                return Results.BadRequest(new { error = "Please provide at least the last 4 to 6 characters of your payment transaction reference ID." });
            }

            if (string.IsNullOrWhiteSpace(request.ScreenshotBase64))
            {
                return Results.BadRequest(new { error = "Please attach a clear screenshot of your payment transfer completion receipt." });
            }

            var payment = new SubscriptionPayment
            {
                TutorProfileId = tutor.Id,
                SubscriptionPackageId = package.Id,
                Amount = package.DisplayFee,
                PaymentMethod = request.PaymentMethod.Trim(),
                TransactionLast6 = last6,
                ScreenshotUrl = request.ScreenshotBase64.Trim(),
                Notes = request.Notes?.Trim(),
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            context.SubscriptionPayments.Add(payment);
            await context.SaveChangesAsync();

            return Results.Created($"/api/subscriptions/my-payments", new
            {
                message = "Payment proof submitted successfully! Your subscription will be activated upon Operations Admin verification.",
                paymentId = payment.Id,
                packageName = package.TierName,
                amount = payment.Amount,
                status = payment.Status
            });
        })
        .RequireAuthorization("subscriptions:select");

        // GET /api/subscriptions/my-payments (Tutor's personal payment history)
        group.MapGet("/subscriptions/my-payments", async (ICurrentUser currentUser, AppDbContext context) =>
        {
            if (string.IsNullOrEmpty(currentUser.UserId)) return Results.Unauthorized();

            var tutor = await context.TutorProfiles.FirstOrDefaultAsync(t => t.UserId == currentUser.UserId);
            if (tutor == null) return Results.NotFound(new { error = "Tutor profile not found" });

            var payments = await context.SubscriptionPayments
                .Include(p => p.SubscriptionPackage)
                .Where(p => p.TutorProfileId == tutor.Id)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new
                {
                    p.Id,
                    p.SubscriptionPackageId,
                    PackageName = p.SubscriptionPackage.TierName,
                    p.Amount,
                    p.PaymentMethod,
                    p.TransactionLast6,
                    p.ScreenshotUrl,
                    p.Notes,
                    p.Status,
                    p.RejectionReason,
                    p.CreatedAt,
                    p.ReviewedAt
                })
                .ToListAsync();

            return Results.Ok(payments);
        })
        .RequireAuthorization("subscriptions:select");

        // --- Operations Subscriptions Payments Review ---
        // GET /api/operations/subscriptions/payments
        group.MapGet("/operations/subscriptions/payments", async (string? status, AppDbContext context) =>
        {
            var query = context.SubscriptionPayments
                .Include(p => p.TutorProfile).ThenInclude(t => t.User)
                .Include(p => p.TutorProfile).ThenInclude(t => t.CurrentSubscriptionPackage)
                .Include(p => p.SubscriptionPackage)
                .Include(p => p.ReviewedByUser)
                .AsQueryable();

            if (string.Equals(status, "pending", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.Status == "Pending");
            }
            else if (string.Equals(status, "confirmed", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.Status == "Confirmed");
            }
            else if (string.Equals(status, "rejected", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(p => p.Status == "Rejected");
            }

            var list = await query
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new
                {
                    p.Id,
                    p.TutorProfileId,
                    TutorName = p.TutorProfile.User.FullName ?? p.TutorProfile.User.UserName,
                    TutorEmail = p.TutorProfile.User.Email,
                    CurrentTier = p.TutorProfile.CurrentSubscriptionPackage != null ? p.TutorProfile.CurrentSubscriptionPackage.TierName : "Basic Tier",
                    PackageId = p.SubscriptionPackageId,
                    PackageName = p.SubscriptionPackage.TierName,
                    PackageFee = p.SubscriptionPackage.DisplayFee,
                    DurationDays = p.SubscriptionPackage.DurationDays,
                    p.Amount,
                    p.PaymentMethod,
                    p.TransactionLast6,
                    p.ScreenshotUrl,
                    p.Notes,
                    p.Status,
                    p.RejectionReason,
                    ReviewedBy = p.ReviewedByUser != null ? (p.ReviewedByUser.FullName ?? p.ReviewedByUser.UserName) : null,
                    p.ReviewedAt,
                    p.CreatedAt
                })
                .ToListAsync();

            return Results.Ok(list);
        })
        .RequireAuthorization("subscriptions:read");

        // PUT /api/operations/subscriptions/payments/{paymentId:int}/confirm
        group.MapPut("/operations/subscriptions/payments/{paymentId:int}/confirm", async (int paymentId, ICurrentUser currentUser, AppDbContext context) =>
        {
            var payment = await context.SubscriptionPayments
                .Include(p => p.TutorProfile).ThenInclude(t => t.User)
                .Include(p => p.SubscriptionPackage)
                .FirstOrDefaultAsync(p => p.Id == paymentId);

            if (payment == null)
            {
                return Results.NotFound(new { error = "Subscription payment record not found" });
            }

            payment.Status = "Confirmed";
            payment.RejectionReason = null;
            payment.ReviewedByUserId = currentUser.UserId;
            payment.ReviewedAt = DateTime.UtcNow;

            // Activate subscription on tutor profile
            payment.TutorProfile.CurrentSubscriptionPackageId = payment.SubscriptionPackageId;
            payment.TutorProfile.SubscriptionUpdatedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();

            return Results.Ok(new
            {
                message = $"Payment confirmed successfully. '{payment.SubscriptionPackage.TierName}' tier is now active for {payment.TutorProfile.User.FullName ?? payment.TutorProfile.User.UserName}.",
                status = "Confirmed",
                packageId = payment.SubscriptionPackageId,
                tierName = payment.SubscriptionPackage.TierName
            });
        })
        .RequireAuthorization("subscriptions:update");

        // PUT /api/operations/subscriptions/payments/{paymentId:int}/reject
        group.MapPut("/operations/subscriptions/payments/{paymentId:int}/reject", async (int paymentId, RejectSubscriptionPaymentRequest request, ICurrentUser currentUser, AppDbContext context) =>
        {
            if (string.IsNullOrWhiteSpace(request.RejectionReason))
            {
                return Results.BadRequest(new { error = "A reason for rejecting the payment must be provided." });
            }

            var payment = await context.SubscriptionPayments
                .Include(p => p.SubscriptionPackage)
                .FirstOrDefaultAsync(p => p.Id == paymentId);

            if (payment == null)
            {
                return Results.NotFound(new { error = "Subscription payment record not found" });
            }

            payment.Status = "Rejected";
            payment.RejectionReason = request.RejectionReason.Trim();
            payment.ReviewedByUserId = currentUser.UserId;
            payment.ReviewedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();

            return Results.Ok(new
            {
                message = "Payment rejected and feedback sent to tutor.",
                status = "Rejected",
                rejectionReason = payment.RejectionReason
            });
        })
        .RequireAuthorization("subscriptions:update");

        // --- Operational Reports ---
        // GET /api/operations/reports
        group.MapGet("/operations/reports", async (AppDbContext context) =>
        {
            var totalUsers = await context.Users.CountAsync();
            var totalLearners = await context.LearnerProfiles.CountAsync();
            var totalTutors = await context.TutorProfiles.CountAsync();
            var verifiedTutors = await context.TutorProfiles.CountAsync(t => t.VerificationStatus == "Verified");
            var pendingTutors = await context.TutorProfiles.CountAsync(t => t.VerificationStatus == "Pending");
            var totalInquiries = await context.Inquiries.CountAsync();
            var acceptedInquiries = await context.Inquiries.CountAsync(i => i.Status == "Accepted");
            var totalReviews = await context.Reviews.CountAsync();

            // Demand vs Supply per category
            var categories = await context.Categories.ToListAsync();
            var searchLogs = await context.SearchAuditLogs.ToListAsync();
            var tutorCategories = await context.TutorCategories.Include(tc => tc.TutorProfile).ToListAsync();

            var demandSupply = categories.Select(c =>
            {
                var demandCount = searchLogs.Count(l => l.CategoryId == c.Id);
                var supplyCount = tutorCategories.Count(tc => tc.CategoryId == c.Id && tc.TutorProfile.VerificationStatus == "Verified");
                double ratio = supplyCount > 0 ? Math.Round((double)demandCount / supplyCount, 2) : demandCount;

                return new
                {
                    CategoryId = c.Id,
                    CategoryName = c.Name,
                    SearchDemandCount = demandCount,
                    TutorSupplyCount = supplyCount,
                    DemandSupplyRatio = ratio
                };
            }).ToList();

            return Results.Ok(new
            {
                Summary = new
                {
                    TotalUsers = totalUsers,
                    TotalLearners = totalLearners,
                    TotalTutors = totalTutors,
                    VerifiedTutors = verifiedTutors,
                    PendingTutors = pendingTutors,
                    TotalInquiries = totalInquiries,
                    AcceptedInquiries = acceptedInquiries,
                    TotalReviews = totalReviews
                },
                CategoryDemandSupply = demandSupply
            });
        })
        .RequireAuthorization("reports:read");

        return endpoints;
    }
}
