using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TDMS.Api.Database;
using TDMS.Api.Database.Entities;
using Xunit;

namespace TDMS.Api.Tests.Operations;

public class SubscriptionPaymentTests
{
    private AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task SubmitPayment_PaidTier_ShouldCreatePendingRecordWithoutActivating()
    {
        // Arrange
        using var context = CreateDbContext();
        var tutorUser = new User { Email = "tutor.test@tdms.local", UserName = "tutor_test" };
        var tutor = new TutorProfile
        {
            UserId = tutorUser.Id,
            User = tutorUser,
            CurrentSubscriptionPackageId = null
        };
        var package = new SubscriptionPackage
        {
            TierName = "Pro Educator",
            DisplayFee = 35000m,
            DurationDays = 30,
            MaxActiveSubjects = 5,
            IsActive = true
        };

        context.Users.Add(tutorUser);
        context.TutorProfiles.Add(tutor);
        context.SubscriptionPackages.Add(package);
        await context.SaveChangesAsync();

        // Act - Submit manual payment proof
        var payment = new SubscriptionPayment
        {
            TutorProfileId = tutor.Id,
            SubscriptionPackageId = package.Id,
            Amount = package.DisplayFee,
            PaymentMethod = "KBZPay",
            TransactionLast6 = "849201",
            ScreenshotUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };
        context.SubscriptionPayments.Add(payment);
        await context.SaveChangesAsync();

        // Assert
        var savedPayment = await context.SubscriptionPayments.FindAsync(payment.Id);
        savedPayment.Should().NotBeNull();
        savedPayment!.Status.Should().Be("Pending");
        savedPayment.TransactionLast6.Should().Be("849201");
        savedPayment.PaymentMethod.Should().Be("KBZPay");
        savedPayment.Amount.Should().Be(35000m);

        // Crucial requirement: Tutor profile must NOT be activated yet until Operations Admin confirms!
        var reloadedTutor = await context.TutorProfiles.FindAsync(tutor.Id);
        reloadedTutor!.CurrentSubscriptionPackageId.Should().BeNull("Subscription package must not activate prior to manual confirmation");
    }

    [Fact]
    public async Task ConfirmPayment_OperationsAdmin_ShouldActivateSubscriptionAndSetConfirmed()
    {
        // Arrange
        using var context = CreateDbContext();
        var opsAdmin = new User { Email = "ops@tdms.local", UserName = "ops_admin" };
        var tutorUser = new User { Email = "tutor.test@tdms.local", UserName = "tutor_test" };
        var tutor = new TutorProfile { UserId = tutorUser.Id, User = tutorUser };
        var package = new SubscriptionPackage
        {
            TierName = "Master Tutor",
            DisplayFee = 90000m,
            DurationDays = 90,
            MaxActiveSubjects = 15,
            IsActive = true
        };
        var payment = new SubscriptionPayment
        {
            TutorProfileId = tutor.Id,
            TutorProfile = tutor,
            SubscriptionPackageId = package.Id,
            SubscriptionPackage = package,
            Amount = package.DisplayFee,
            PaymentMethod = "WavePay",
            TransactionLast6 = "918273",
            ScreenshotUrl = "data:image/png;base64,sample_screenshot_data",
            Status = "Pending"
        };

        context.Users.AddRange(opsAdmin, tutorUser);
        context.TutorProfiles.Add(tutor);
        context.SubscriptionPackages.Add(package);
        context.SubscriptionPayments.Add(payment);
        await context.SaveChangesAsync();

        // Act - Operations Admin confirms payment
        payment.Status = "Confirmed";
        payment.RejectionReason = null;
        payment.ReviewedByUserId = opsAdmin.Id;
        payment.ReviewedAt = DateTime.UtcNow;

        // Activate package on tutor profile
        tutor.CurrentSubscriptionPackageId = package.Id;
        tutor.SubscriptionUpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();

        // Assert
        var reloadedPayment = await context.SubscriptionPayments.FindAsync(payment.Id);
        reloadedPayment!.Status.Should().Be("Confirmed");
        reloadedPayment.ReviewedByUserId.Should().Be(opsAdmin.Id);
        reloadedPayment.ReviewedAt.Should().NotBeNull();

        var reloadedTutor = await context.TutorProfiles.FindAsync(tutor.Id);
        reloadedTutor!.CurrentSubscriptionPackageId.Should().Be(package.Id);
        reloadedTutor.SubscriptionUpdatedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task RejectPayment_OperationsAdmin_ShouldSetRejectedWithReasonAndNotActivate()
    {
        // Arrange
        using var context = CreateDbContext();
        var opsAdmin = new User { Email = "ops@tdms.local" };
        var tutorUser = new User { Email = "tutor.test@tdms.local" };
        var tutor = new TutorProfile { UserId = tutorUser.Id, User = tutorUser, CurrentSubscriptionPackageId = null };
        var package = new SubscriptionPackage { TierName = "Pro Educator", DisplayFee = 35000m };
        var payment = new SubscriptionPayment
        {
            TutorProfileId = tutor.Id,
            SubscriptionPackageId = package.Id,
            Amount = package.DisplayFee,
            PaymentMethod = "KBZPay",
            TransactionLast6 = "000111",
            ScreenshotUrl = "data:image/png;base64,invalid_slip",
            Status = "Pending"
        };

        context.Users.AddRange(opsAdmin, tutorUser);
        context.TutorProfiles.Add(tutor);
        context.SubscriptionPackages.Add(package);
        context.SubscriptionPayments.Add(payment);
        await context.SaveChangesAsync();

        // Act - Operations Admin rejects payment
        var rejectionReason = "Transaction ID 000111 not found in bank statement for amount 35,000 MMK.";
        payment.Status = "Rejected";
        payment.RejectionReason = rejectionReason;
        payment.ReviewedByUserId = opsAdmin.Id;
        payment.ReviewedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();

        // Assert
        var reloadedPayment = await context.SubscriptionPayments.FindAsync(payment.Id);
        reloadedPayment!.Status.Should().Be("Rejected");
        reloadedPayment.RejectionReason.Should().Be(rejectionReason);

        var reloadedTutor = await context.TutorProfiles.FindAsync(tutor.Id);
        reloadedTutor!.CurrentSubscriptionPackageId.Should().BeNull("Subscription must remain null/unchanged after rejection");
    }
}
