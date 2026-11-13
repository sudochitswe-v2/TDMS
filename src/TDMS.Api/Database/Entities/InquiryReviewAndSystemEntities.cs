namespace TDMS.Api.Database.Entities;

public class Inquiry : IAuditableEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string LearnerUserId { get; set; } = string.Empty;
    public User LearnerUser { get; set; } = null!;

    public string TutorProfileId { get; set; } = string.Empty;
    public TutorProfile TutorProfile { get; set; } = null!;

    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;

    public string InitialRequirementSummary { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending"; // "Pending", "Accepted", "Declined"
    public string FirebaseThreadId { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RespondedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class Review : IAuditableEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string LearnerUserId { get; set; } = string.Empty;
    public User LearnerUser { get; set; } = null!;

    public string TutorProfileId { get; set; } = string.Empty;
    public TutorProfile TutorProfile { get; set; } = null!;

    public int StarRating { get; set; } // 1 - 5
    public string Comment { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

public class SearchAuditLog
{
    public int Id { get; set; }
    public int? CategoryId { get; set; }
    public Category? Category { get; set; }
    public string? LearnerUserId { get; set; }
    public User? LearnerUser { get; set; }
    public DateTime SearchedAt { get; set; } = DateTime.UtcNow;
}

public class SystemSetting
{
    public string Key { get; set; } = string.Empty;
    public string ValueJson { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
