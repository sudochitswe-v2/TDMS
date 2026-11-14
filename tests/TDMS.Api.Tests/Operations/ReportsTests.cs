using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TDMS.Api.Database;
using TDMS.Api.Database.Entities;
using TDMS.Api.Features.Operations;
using Xunit;

namespace TDMS.Api.Tests.Operations;

public class ReportsTests
{
    private AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task GetPaymentReport_ShouldCalculateAccurateRevenueAndMethodBreakdown()
    {
        // Arrange
        using var context = CreateDbContext();

        var tutorUser = new User { Email = "tutor1@test.com", UserName = "tutor1", FullName = "Tutor One" };
        var tutor = new TutorProfile { UserId = tutorUser.Id, User = tutorUser };
        var package1 = new SubscriptionPackage { TierName = "Pro", DisplayFee = 30000m, DurationDays = 30, IsActive = true };
        var package2 = new SubscriptionPackage { TierName = "Master", DisplayFee = 80000m, DurationDays = 90, IsActive = true };

        context.Users.Add(tutorUser);
        context.TutorProfiles.Add(tutor);
        context.SubscriptionPackages.AddRange(package1, package2);
        await context.SaveChangesAsync();

        // 1 Confirmed payment via KBZPay (30,000)
        context.SubscriptionPayments.Add(new SubscriptionPayment
        {
            TutorProfileId = tutor.Id,
            SubscriptionPackageId = package1.Id,
            Amount = 30000m,
            PaymentMethod = "KBZPay",
            TransactionLast6 = "111111",
            ScreenshotUrl = "data:image/png;base64,abc",
            Status = "Confirmed",
            CreatedAt = DateTime.UtcNow.AddDays(-2)
        });

        // 1 Confirmed payment via WavePay (80,000)
        context.SubscriptionPayments.Add(new SubscriptionPayment
        {
            TutorProfileId = tutor.Id,
            SubscriptionPackageId = package2.Id,
            Amount = 80000m,
            PaymentMethod = "WavePay",
            TransactionLast6 = "222222",
            ScreenshotUrl = "data:image/png;base64,abc",
            Status = "Confirmed",
            CreatedAt = DateTime.UtcNow.AddDays(-1)
        });

        // 1 Pending payment via KBZPay (30,000)
        context.SubscriptionPayments.Add(new SubscriptionPayment
        {
            TutorProfileId = tutor.Id,
            SubscriptionPackageId = package1.Id,
            Amount = 30000m,
            PaymentMethod = "KBZPay",
            TransactionLast6 = "333333",
            ScreenshotUrl = "data:image/png;base64,abc",
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        });

        // 1 Rejected payment via CBPay (30,000)
        context.SubscriptionPayments.Add(new SubscriptionPayment
        {
            TutorProfileId = tutor.Id,
            SubscriptionPackageId = package1.Id,
            Amount = 30000m,
            PaymentMethod = "CBPay",
            TransactionLast6 = "444444",
            ScreenshotUrl = "data:image/png;base64,abc",
            Status = "Rejected",
            RejectionReason = "Invalid slip",
            CreatedAt = DateTime.UtcNow.AddHours(-1)
        });

        await context.SaveChangesAsync();

        var feature = new GetPaymentReport(context);

        // Act
        var report = await feature.ExecuteAsync();

        // Assert
        report.Should().NotBeNull();
        report.Summary.TotalRevenue.Should().Be(110000m); // 30,000 + 80,000
        report.Summary.ConfirmedCount.Should().Be(2);
        report.Summary.PendingRevenue.Should().Be(30000m);
        report.Summary.PendingCount.Should().Be(1);
        report.Summary.RejectedRevenue.Should().Be(30000m);
        report.Summary.RejectedCount.Should().Be(1);
        report.Summary.TotalTransactions.Should().Be(4);
        report.Summary.AverageTransactionValue.Should().Be(55000m); // 110,000 / 2
        report.Summary.ConfirmationRate.Should().Be(50.0); // 2 out of 4 = 50%

        // Payment Methods Check
        report.Methods.Should().HaveCount(3);
        var kbz = report.Methods.First(m => m.Method == "KBZPay");
        kbz.ConfirmedAmount.Should().Be(30000m);
        kbz.TotalCount.Should().Be(2);

        // Payments list
        report.Payments.Should().HaveCount(4);
    }

    [Fact]
    public async Task GetSubscriptionReport_ShouldCalculateTierDistributionAndLifecycle()
    {
        // Arrange
        using var context = CreateDbContext();

        var packageFree = new SubscriptionPackage { TierName = "Starter Free", DisplayFee = 0m, DurationDays = 0, IsActive = true };
        var packagePro = new SubscriptionPackage { TierName = "Pro", DisplayFee = 35000m, DurationDays = 30, IsActive = true };
        var packageMaster = new SubscriptionPackage { TierName = "Master", DisplayFee = 90000m, DurationDays = 90, IsActive = true };

        context.SubscriptionPackages.AddRange(packageFree, packagePro, packageMaster);
        await context.SaveChangesAsync();

        // Tutor 1: Active Pro subscriber
        var u1 = new User { Email = "u1@test.com", UserName = "u1", FullName = "Tutor Active" };
        var t1 = new TutorProfile
        {
            UserId = u1.Id,
            User = u1,
            VerificationStatus = "Verified",
            CurrentSubscriptionPackageId = packagePro.Id,
            SubscriptionUpdatedAt = DateTime.UtcNow.AddDays(-10) // 20 days left
        };

        // Tutor 2: Expiring Soon Pro subscriber (updated 25 days ago, 5 days left)
        var u2 = new User { Email = "u2@test.com", UserName = "u2", FullName = "Tutor Expiring" };
        var t2 = new TutorProfile
        {
            UserId = u2.Id,
            User = u2,
            VerificationStatus = "Verified",
            CurrentSubscriptionPackageId = packagePro.Id,
            SubscriptionUpdatedAt = DateTime.UtcNow.AddDays(-25) // 5 days left
        };

        // Tutor 3: Expired Pro subscriber (updated 40 days ago, expired 10 days ago)
        var u3 = new User { Email = "u3@test.com", UserName = "u3", FullName = "Tutor Expired" };
        var t3 = new TutorProfile
        {
            UserId = u3.Id,
            User = u3,
            VerificationStatus = "Verified",
            CurrentSubscriptionPackageId = packagePro.Id,
            SubscriptionUpdatedAt = DateTime.UtcNow.AddDays(-40)
        };

        // Tutor 4: Free tier tutor
        var u4 = new User { Email = "u4@test.com", UserName = "u4", FullName = "Tutor Free" };
        var t4 = new TutorProfile
        {
            UserId = u4.Id,
            User = u4,
            VerificationStatus = "Pending",
            CurrentSubscriptionPackageId = packageFree.Id
        };

        context.Users.AddRange(u1, u2, u3, u4);
        context.TutorProfiles.AddRange(t1, t2, t3, t4);
        await context.SaveChangesAsync();

        var feature = new GetSubscriptionReport(context);

        // Act
        var report = await feature.ExecuteAsync();

        // Assert
        report.Should().NotBeNull();
        report.Summary.TotalTutors.Should().Be(4);
        report.Summary.VerifiedTutors.Should().Be(3);
        report.Summary.FreeTierTutorsCount.Should().Be(1);
        report.Summary.ExpiringSoonCount.Should().Be(1); // t2
        report.Summary.ExpiredCount.Should().Be(1); // t3
        report.Summary.PaidSubscribersCount.Should().Be(2); // t1 (Active) and t2 (ExpiringSoon)
        report.Summary.PaidConversionRate.Should().Be(50.0); // 2 out of 4 = 50%

        // Tier distribution check
        var proDist = report.TierDistribution.First(d => d.TierName == "Pro");
        proDist.ActiveTutorsCount.Should().Be(3);

        // Tutor item statuses
        var item1 = report.Subscriptions.First(s => s.TutorEmail == "u1@test.com");
        item1.Status.Should().Be("Active");
        item1.DaysRemaining.Should().BeGreaterThan(0);

        var item2 = report.Subscriptions.First(s => s.TutorEmail == "u2@test.com");
        item2.Status.Should().Be("ExpiringSoon");

        var item3 = report.Subscriptions.First(s => s.TutorEmail == "u3@test.com");
        item3.Status.Should().Be("Expired");

        var item4 = report.Subscriptions.First(s => s.TutorEmail == "u4@test.com");
        item4.Status.Should().Be("FreeTier");
    }
}
