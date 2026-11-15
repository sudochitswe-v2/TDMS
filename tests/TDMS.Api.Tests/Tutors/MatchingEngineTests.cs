using FluentAssertions;
using TDMS.Api.Features.Tutors;
using Xunit;

namespace TDMS.Api.Tests.Tutors;

public class MatchingEngineTests
{
    [Fact]
    public void CalculateMatch_PerfectMatch_ShouldReturn100Percent()
    {
        // Arrange
        var learner = new LearnerMatchingCriteria(
            CategoryIds: ["1", "2"],
            PreferredMaxHourlyFee: 50.0m,
            PreferredTeachingMode: "Online",
            PreferredSlots:
            [
                new LearnerScheduleCriteria(1, new TimeSpan(9, 0, 0), new TimeSpan(11, 0, 0))
            ]
        );

        var tutor = new TutorCandidateInfo(
            TutorProfileId: "tutor-1",
            HourlyFee: 40.0m, // under budget -> S_fee = 1.0
            TeachingMode: "Online", // match -> S_mode = 1.0
            CategoryIds: ["1", "2", "3"], // teaches both -> S_subject = 1.0
            AvailableSlots:
            [
                new LearnerScheduleCriteria(1, new TimeSpan(9, 0, 0), new TimeSpan(12, 0, 0)) // overlaps -> S_schedule = 1.0
            ]
        );

        // Act
        var result = MatchingEngine.CalculateMatch(learner, tutor);

        // Assert
        result.OverallPercentage.Should().Be(100.0);
        result.SubjectScore.Should().Be(1.0);
        result.FeeScore.Should().Be(1.0);
        result.ScheduleScore.Should().Be(1.0);
        result.ModeScore.Should().Be(1.0);
    }

    [Theory]
    [InlineData(50.0, 50.0, 1.0)]    // Exactly at budget -> 1.0
    [InlineData(40.0, 50.0, 1.0)]    // Below budget -> 1.0
    [InlineData(62.5, 50.0, 0.5)]    // +25% over budget -> 0.5
    [InlineData(75.0, 50.0, 0.0)]    // +50% over budget -> 0.0
    [InlineData(100.0, 50.0, 0.0)]   // +100% over budget -> 0.0 (clamped)
    public void CalculateMatch_TuitionFeeLinearDecay_ShouldCalculateAccurately(double tutorFee, double maxFee, double expectedFeeScore)
    {
        // Arrange
        var learner = new LearnerMatchingCriteria(
            CategoryIds: [],
            PreferredMaxHourlyFee: (decimal)maxFee,
            PreferredTeachingMode: "Both",
            PreferredSlots: []
        );

        var tutor = new TutorCandidateInfo(
            TutorProfileId: "tutor-1",
            HourlyFee: (decimal)tutorFee,
            TeachingMode: "Both",
            CategoryIds: [],
            AvailableSlots: []
        );

        // Act
        var result = MatchingEngine.CalculateMatch(learner, tutor);

        // Assert
        result.FeeScore.Should().BeApproximately(expectedFeeScore, 0.001);
    }

    [Fact]
    public void CalculateMatch_PartialScheduleAndSubjectOverlap_ShouldCalculateWeightedScores()
    {
        // Arrange: Learner wants 2 categories (["1", "2"]) and 2 time slots
        var learner = new LearnerMatchingCriteria(
            CategoryIds: ["1", "2"],
            PreferredMaxHourlyFee: 50.0m,
            PreferredTeachingMode: "Online",
            PreferredSlots:
            [
                new LearnerScheduleCriteria(1, new TimeSpan(14, 0, 0), new TimeSpan(16, 0, 0)), // Mon 2-4pm
                new LearnerScheduleCriteria(3, new TimeSpan(10, 0, 0), new TimeSpan(12, 0, 0))  // Wed 10-12pm
            ]
        );

        // Tutor teaches category 1 only (S_subject = 1/2 = 0.5)
        // Tutor fee is exactly at budget 50.0m (S_fee = 1.0)
        // Tutor available Mon 3-5pm (overlaps Mon 2-4pm), but not Wed (S_schedule = 1/2 = 0.5)
        // Tutor mode is Online (S_mode = 1.0)
        var tutor = new TutorCandidateInfo(
            TutorProfileId: "tutor-2",
            HourlyFee: 50.0m,
            TeachingMode: "Online",
            CategoryIds: ["1"],
            AvailableSlots:
            [
                new LearnerScheduleCriteria(1, new TimeSpan(15, 0, 0), new TimeSpan(17, 0, 0))
            ]
        );

        // Act
        // Formula: (40 * 0.5) + (25 * 1.0) + (25 * 0.5) + (10 * 1.0) = 20 + 25 + 12.5 + 10 = 67.5%
        var result = MatchingEngine.CalculateMatch(learner, tutor);

        // Assert
        result.SubjectScore.Should().Be(0.5);
        result.FeeScore.Should().Be(1.0);
        result.ScheduleScore.Should().Be(0.5);
        result.ModeScore.Should().Be(1.0);
        result.OverallPercentage.Should().Be(67.5);
    }

    [Fact]
    public void CalculateMatch_CustomWeights_ShouldApplyCorrectWeights()
    {
        // Custom weights: Subject = 50%, Fee = 20%, Schedule = 20%, Mode = 10%
        var customWeights = new MatchingWeights(50.0, 20.0, 20.0, 10.0);
        customWeights.IsValid().Should().BeTrue();

        var learner = new LearnerMatchingCriteria(
            CategoryIds: ["1"],
            PreferredMaxHourlyFee: 50.0m,
            PreferredTeachingMode: "InPerson",
            PreferredSlots: []
        );

        var tutor = new TutorCandidateInfo(
            TutorProfileId: "tutor-3",
            HourlyFee: 50.0m, // FeeScore = 1.0
            TeachingMode: "Online", // Mode mismatch -> ModeScore = 0.0
            CategoryIds: ["1"], // SubjectScore = 1.0
            AvailableSlots: [] // ScheduleScore = 1.0
        );

        // Act
        // (50 * 1.0) + (20 * 1.0) + (20 * 1.0) + (10 * 0.0) = 90.0%
        var result = MatchingEngine.CalculateMatch(learner, tutor, customWeights);

        // Assert
        result.OverallPercentage.Should().Be(90.0);
    }

    [Fact]
    public void CalculateMatch_NonOverlappingTimeSlots_ShouldYieldZeroScheduleScore()
    {
        var learner = new LearnerMatchingCriteria(
            CategoryIds: [],
            PreferredMaxHourlyFee: 50.0m,
            PreferredTeachingMode: "Both",
            PreferredSlots:
            [
                new LearnerScheduleCriteria(2, new TimeSpan(10, 0, 0), new TimeSpan(12, 0, 0)) // Tue 10-12
            ]
        );

        var tutor = new TutorCandidateInfo(
            TutorProfileId: "tutor-4",
            HourlyFee: 50.0m,
            TeachingMode: "Both",
            CategoryIds: [],
            AvailableSlots:
            [
                // Adjacent but non-overlapping: Tue 12-14
                new LearnerScheduleCriteria(2, new TimeSpan(12, 0, 0), new TimeSpan(14, 0, 0)),
                // Different day: Wed 10-12
                new LearnerScheduleCriteria(3, new TimeSpan(10, 0, 0), new TimeSpan(12, 0, 0))
            ]
        );

        var result = MatchingEngine.CalculateMatch(learner, tutor);
        result.ScheduleScore.Should().Be(0.0);
    }
}
