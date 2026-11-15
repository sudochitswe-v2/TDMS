namespace TDMS.Api.Database.Entities;

public class LearnerProfile : IAuditableEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = string.Empty;
    public User User { get; set; } = null!;

    public string AccountSubType { get; set; } = "Student"; // "Parent" or "Student"
    public string? GradeLevel { get; set; }
    public decimal PreferredMaxHourlyFee { get; set; }
    public string PreferredTeachingMode { get; set; } = "Both"; // "Online", "InPerson", "Both"
    public string? LearningGoalsNote { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<LearnerRequirementCategory> RequirementCategories { get; set; } = new List<LearnerRequirementCategory>();
    public ICollection<LearnerScheduleSlot> ScheduleSlots { get; set; } = new List<LearnerScheduleSlot>();
}

public class LearnerRequirementCategory
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string LearnerProfileId { get; set; } = string.Empty;
    public LearnerProfile LearnerProfile { get; set; } = null!;

    public string CategoryId { get; set; } = string.Empty;
    public Category Category { get; set; } = null!;
}

public class LearnerScheduleSlot
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string LearnerProfileId { get; set; } = string.Empty;
    public LearnerProfile LearnerProfile { get; set; } = null!;

    public byte DayOfWeek { get; set; } // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
}
