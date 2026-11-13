using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TDMS.Api.Database;
using TDMS.Api.Database.Entities;
using TDMS.Api.Features.Reviews;
using Xunit;

namespace TDMS.Api.Tests.Reviews;

public class ReviewEngineTests
{
    private AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task RecalculateTutorRatingAsync_ShouldComputeAccurateRollingAverage()
    {
        // Arrange
        using var context = CreateDbContext();
        var tutorUser = new User { Email = "tutor@test.com", FullName = "Prof. Smith" };
        var tutorProfile = new TutorProfile { UserId = tutorUser.Id };
        context.Users.Add(tutorUser);
        context.TutorProfiles.Add(tutorProfile);

        var learner1 = new User { Email = "l1@test.com", FullName = "Learner 1" };
        var learner2 = new User { Email = "l2@test.com", FullName = "Learner 2" };
        var learner3 = new User { Email = "l3@test.com", FullName = "Learner 3" };
        context.Users.AddRange(learner1, learner2, learner3);
        await context.SaveChangesAsync();

        // Add 3 reviews: 5, 4, 4 -> Average = (13 / 3) = 4.33
        context.Reviews.AddRange(
            new Review { LearnerUserId = learner1.Id, TutorProfileId = tutorProfile.Id, StarRating = 5, Comment = "Great!" },
            new Review { LearnerUserId = learner2.Id, TutorProfileId = tutorProfile.Id, StarRating = 4, Comment = "Good" },
            new Review { LearnerUserId = learner3.Id, TutorProfileId = tutorProfile.Id, StarRating = 4, Comment = "Solid" }
        );
        await context.SaveChangesAsync();

        // Act
        await ReviewEndpoints.RecalculateTutorRatingAsync(tutorProfile.Id, context);

        // Assert
        var updatedTutor = await context.TutorProfiles.FindAsync(tutorProfile.Id);
        updatedTutor.Should().NotBeNull();
        updatedTutor!.TotalReviewsCount.Should().Be(3);
        updatedTutor.AverageRating.Should().Be(4.33m);
    }

    [Fact]
    public async Task RecalculateTutorRatingAsync_NoReviews_ShouldResetToZero()
    {
        // Arrange
        using var context = CreateDbContext();
        var tutorProfile = new TutorProfile { AverageRating = 4.5m, TotalReviewsCount = 2 };
        context.TutorProfiles.Add(tutorProfile);
        await context.SaveChangesAsync();

        // Act
        await ReviewEndpoints.RecalculateTutorRatingAsync(tutorProfile.Id, context);

        // Assert
        var updatedTutor = await context.TutorProfiles.FindAsync(tutorProfile.Id);
        updatedTutor!.TotalReviewsCount.Should().Be(0);
        updatedTutor.AverageRating.Should().Be(0.00m);
    }
}
