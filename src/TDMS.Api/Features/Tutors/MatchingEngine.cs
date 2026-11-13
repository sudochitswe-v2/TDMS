namespace TDMS.Api.Features.Tutors;

public record MatchingWeights(
    double W_subject = 40.0,
    double W_fee = 25.0,
    double W_schedule = 25.0,
    double W_mode = 10.0
)
{
    public bool IsValid() => Math.Abs((W_subject + W_fee + W_schedule + W_mode) - 100.0) < 0.001;
}

public record LearnerScheduleCriteria(byte DayOfWeek, TimeSpan StartTime, TimeSpan EndTime);

public record LearnerMatchingCriteria(
    IReadOnlyList<int> CategoryIds,
    decimal PreferredMaxHourlyFee,
    string PreferredTeachingMode,
    IReadOnlyList<LearnerScheduleCriteria> PreferredSlots
);

public record TutorCandidateInfo(
    string TutorProfileId,
    decimal HourlyFee,
    string TeachingMode,
    IReadOnlyList<int> CategoryIds,
    IReadOnlyList<LearnerScheduleCriteria> AvailableSlots
);

public record MatchCalculationResult(
    double OverallPercentage,
    double SubjectScore,
    double FeeScore,
    double ScheduleScore,
    double ModeScore
);

public static class MatchingEngine
{
    public static MatchCalculationResult CalculateMatch(
        LearnerMatchingCriteria learner,
        TutorCandidateInfo tutor,
        MatchingWeights? weights = null)
    {
        weights ??= new MatchingWeights();

        // 1. Subject Category Match (0.0 to 1.0)
        double subjectScore;
        if (learner.CategoryIds == null || learner.CategoryIds.Count == 0)
        {
            subjectScore = 1.0;
        }
        else
        {
            var tutorCategorySet = (tutor.CategoryIds ?? []).ToHashSet();
            int matchingCount = learner.CategoryIds.Count(cid => tutorCategorySet.Contains(cid));
            subjectScore = (double)matchingCount / learner.CategoryIds.Count;
        }

        // 2. Tuition Fee Compatibility (0.0 to 1.0)
        double feeScore;
        if (learner.PreferredMaxHourlyFee <= 0)
        {
            feeScore = 1.0;
        }
        else if (tutor.HourlyFee <= learner.PreferredMaxHourlyFee)
        {
            feeScore = 1.0;
        }
        else
        {
            // Linear decay down to 0 at +50% over budget
            // S_fee = max(0, 1 - (HourlyFee - MaxFee) / (0.5 * MaxFee))
            var maxFee = (double)learner.PreferredMaxHourlyFee;
            var hourlyFee = (double)tutor.HourlyFee;
            var excess = hourlyFee - maxFee;
            var decayLimit = 0.5 * maxFee;

            if (decayLimit <= 0)
            {
                feeScore = 0.0;
            }
            else
            {
                var score = 1.0 - (excess / decayLimit);
                feeScore = Math.Max(0.0, score);
            }
        }

        // 3. Schedule Slot Overlap (0.0 to 1.0)
        double scheduleScore;
        if (learner.PreferredSlots == null || learner.PreferredSlots.Count == 0)
        {
            scheduleScore = 1.0;
        }
        else
        {
            var tutorSlots = tutor.AvailableSlots ?? [];
            int overlappingCount = 0;

            foreach (var req in learner.PreferredSlots)
            {
                bool hasOverlap = tutorSlots.Any(ts =>
                    ts.DayOfWeek == req.DayOfWeek &&
                    req.StartTime < ts.EndTime &&
                    ts.StartTime < req.EndTime);

                if (hasOverlap)
                {
                    overlappingCount++;
                }
            }

            scheduleScore = (double)overlappingCount / learner.PreferredSlots.Count;
        }

        // 4. Teaching Mode Match (0.0 to 1.0)
        double modeScore;
        var learnerMode = learner.PreferredTeachingMode ?? "Both";
        var tutorMode = tutor.TeachingMode ?? "Both";

        if (learnerMode.Equals("Both", StringComparison.OrdinalIgnoreCase) ||
            tutorMode.Equals("Both", StringComparison.OrdinalIgnoreCase) ||
            learnerMode.Equals(tutorMode, StringComparison.OrdinalIgnoreCase))
        {
            modeScore = 1.0;
        }
        else
        {
            modeScore = 0.0;
        }

        // Weighted Total: (W_subject * S_subject) + (W_fee * S_fee) + (W_schedule * S_schedule) + (W_mode * S_mode)
        double rawTotal = (weights.W_subject * subjectScore) +
                          (weights.W_fee * feeScore) +
                          (weights.W_schedule * scheduleScore) +
                          (weights.W_mode * modeScore);

        double clampedTotal = Math.Clamp(Math.Round(rawTotal, 1), 0.0, 100.0);

        return new MatchCalculationResult(
            OverallPercentage: clampedTotal,
            SubjectScore: Math.Round(subjectScore, 3),
            FeeScore: Math.Round(feeScore, 3),
            ScheduleScore: Math.Round(scheduleScore, 3),
            ModeScore: Math.Round(modeScore, 3)
        );
    }
}
