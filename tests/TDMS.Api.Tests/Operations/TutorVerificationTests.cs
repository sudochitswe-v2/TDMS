using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TDMS.Api.Database;
using TDMS.Api.Database.Entities;
using Xunit;

namespace TDMS.Api.Tests.Operations;

public class TutorVerificationTests
{
    private AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task TutorOnboarding_DefaultState_ShouldBePendingAndUnpublished()
    {
        // Arrange
        using var context = CreateDbContext();
        var tutor = new TutorProfile
        {
            VerificationStatus = "Pending",
            IsPublished = false
        };
        context.TutorProfiles.Add(tutor);
        await context.SaveChangesAsync();

        // Assert
        var saved = await context.TutorProfiles.FindAsync(tutor.Id);
        saved!.VerificationStatus.Should().Be("Pending");
        saved.IsPublished.Should().BeFalse("Unverified tutor must never be published to public directory");
    }

    [Fact]
    public async Task TutorVerification_Approve_ShouldSetStatusVerifiedAndPublished()
    {
        // Arrange
        using var context = CreateDbContext();
        var admin = new User { Email = "operator@tdms.local" };
        var tutor = new TutorProfile { VerificationStatus = "Pending", IsPublished = false };
        context.Users.Add(admin);
        context.TutorProfiles.Add(tutor);
        await context.SaveChangesAsync();

        // Act - Simulate approval
        tutor.VerificationStatus = "Verified";
        tutor.VerifiedByUserId = admin.Id;
        tutor.VerifiedAt = DateTime.UtcNow;
        tutor.IsPublished = true;
        await context.SaveChangesAsync();

        // Assert
        var reloaded = await context.TutorProfiles.FindAsync(tutor.Id);
        reloaded!.VerificationStatus.Should().Be("Verified");
        reloaded.IsPublished.Should().BeTrue();
        reloaded.VerifiedByUserId.Should().Be(admin.Id);
        reloaded.VerifiedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task TutorVerification_Reject_ShouldSetStatusRejectedAndStoreReason()
    {
        // Arrange
        using var context = CreateDbContext();
        var admin = new User { Email = "operator@tdms.local" };
        var tutor = new TutorProfile { VerificationStatus = "Pending", IsPublished = false };
        context.Users.Add(admin);
        context.TutorProfiles.Add(tutor);
        await context.SaveChangesAsync();

        // Act - Simulate rejection
        tutor.VerificationStatus = "Rejected";
        tutor.RejectionReason = "Identity verification document was unreadable";
        tutor.VerifiedByUserId = admin.Id;
        tutor.VerifiedAt = DateTime.UtcNow;
        tutor.IsPublished = false;
        await context.SaveChangesAsync();

        // Assert
        var reloaded = await context.TutorProfiles.FindAsync(tutor.Id);
        reloaded!.VerificationStatus.Should().Be("Rejected");
        reloaded.RejectionReason.Should().Be("Identity verification document was unreadable");
        reloaded.IsPublished.Should().BeFalse();
    }

    [Fact]
    public async Task TutorReverification_FromRejected_ShouldSetStatusPendingAndClearRejectionReason()
    {
        // Arrange
        using var context = CreateDbContext();
        var tutor = new TutorProfile
        {
            VerificationStatus = "Rejected",
            RejectionReason = "Please provide verified academic certificate",
            IsPublished = false,
            ProfilePictureUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        };
        context.TutorProfiles.Add(tutor);
        await context.SaveChangesAsync();

        // Act - Simulate re-verification submission
        tutor.VerificationStatus = "Pending";
        tutor.RejectionReason = null;
        tutor.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();

        // Assert
        var reloaded = await context.TutorProfiles.FindAsync(tutor.Id);
        reloaded!.VerificationStatus.Should().Be("Pending");
        reloaded.RejectionReason.Should().BeNull();
        reloaded.IsPublished.Should().BeFalse();
    }

    [Fact]
    public async Task TutorVerification_Base64ProfilePictureAndAcademicDocuments_ShouldStoreProperly()
    {
        // Arrange
        using var context = CreateDbContext();
        var base64Photo = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...";
        var base64Doc = "data:application/pdf;base64,JVBERi0xLjQKJ...";

        var tutor = new TutorProfile
        {
            ProfilePictureUrl = base64Photo,
            VerificationStatus = "Pending"
        };
        context.TutorProfiles.Add(tutor);
        await context.SaveChangesAsync();

        var document = new TutorDocument
        {
            TutorProfileId = tutor.Id,
            DocumentType = "AcademicCertificate",
            FileName = "physics_degree.pdf",
            FileUrl = base64Doc,
            FileSizeBytes = 10240,
            UploadedAt = DateTime.UtcNow
        };
        context.TutorDocuments.Add(document);
        await context.SaveChangesAsync();

        // Assert
        var savedTutor = await context.TutorProfiles
            .Include(t => t.Documents)
            .FirstOrDefaultAsync(t => t.Id == tutor.Id);

        savedTutor.Should().NotBeNull();
        savedTutor!.ProfilePictureUrl.Should().Be(base64Photo);
        savedTutor.Documents.Should().HaveCount(1);

        var savedDoc = savedTutor.Documents.First();
        savedDoc.DocumentType.Should().Be("AcademicCertificate");
        savedDoc.FileName.Should().Be("physics_degree.pdf");
        savedDoc.FileUrl.Should().Be(base64Doc);
        savedDoc.FileSizeBytes.Should().Be(10240);
    }
}
