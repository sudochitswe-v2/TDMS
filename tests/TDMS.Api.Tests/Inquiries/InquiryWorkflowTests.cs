using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TDMS.Api.Database;
using TDMS.Api.Database.Entities;
using TDMS.Api.Features.Messaging;
using Xunit;

namespace TDMS.Api.Tests.Inquiries;

public class InquiryWorkflowTests
{
    private AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task MockFirebaseMessagingService_ShouldInitializeAndDeliverMessages()
    {
        // Arrange
        var service = new MockFirebaseMessagingService();
        var threadId = "thread-xyz";
        var learnerId = "learner-1";
        var tutorId = "tutor-1";

        // Act - Initialize thread
        await service.InitializeThreadAsync(threadId, learnerId, tutorId, "inq-1");

        // Act - Send messages
        var msg1 = await service.SendMessageAsync(threadId, learnerId, "Student Alice", "Hello tutor!");
        var msg2 = await service.SendMessageAsync(threadId, tutorId, "Tutor Bob", "Hi Alice, happy to help.");

        var messages = await service.GetMessagesAsync(threadId);

        // Assert
        messages.Should().HaveCount(2);
        messages[0].Text.Should().Be("Hello tutor!");
        messages[1].Text.Should().Be("Hi Alice, happy to help.");
    }

    [Fact]
    public async Task InquiryStatusTransitions_ShouldRespectAcceptAndDeclineStates()
    {
        // Arrange
        using var context = CreateDbContext();
        var learner = new User { Email = "learner@test.com", FullName = "Learner" };
        var tutorUser = new User { Email = "tutor@test.com", FullName = "Tutor" };
        var tutorProfile = new TutorProfile { UserId = tutorUser.Id };
        var category = new Category { Name = "Science" };
        context.Users.AddRange(learner, tutorUser);
        context.TutorProfiles.Add(tutorProfile);
        context.Categories.Add(category);
        await context.SaveChangesAsync();

        var inquiry = new Inquiry
        {
            LearnerUserId = learner.Id,
            TutorProfileId = tutorProfile.Id,
            CategoryId = category.Id,
            InitialRequirementSummary = "I need help with Physics exam prep",
            Status = "Pending",
            FirebaseThreadId = "thread_123"
        };
        context.Inquiries.Add(inquiry);
        await context.SaveChangesAsync();

        // Assert initial state
        inquiry.Status.Should().Be("Pending");

        // Transition to Accepted
        inquiry.Status = "Accepted";
        inquiry.RespondedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();

        var reloaded = await context.Inquiries.FindAsync(inquiry.Id);
        reloaded!.Status.Should().Be("Accepted");
        reloaded.RespondedAt.Should().NotBeNull();
    }
}
