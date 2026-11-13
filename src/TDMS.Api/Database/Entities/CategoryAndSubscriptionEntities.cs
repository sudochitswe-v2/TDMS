namespace TDMS.Api.Database.Entities;

public class Category : IAuditableEntity
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<TutorCategory> TutorCategories { get; set; } = new List<TutorCategory>();
    public ICollection<LearnerRequirementCategory> LearnerCategories { get; set; } = new List<LearnerRequirementCategory>();
}

public class SubscriptionPackage : IAuditableEntity
{
    public int Id { get; set; }
    public string TierName { get; set; } = string.Empty;
    public int DurationDays { get; set; }
    public decimal DisplayFee { get; set; }
    public int MaxActiveSubjects { get; set; }
    public int PrioritySearchBoost { get; set; } = 0;
    public string? FeaturesJson { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<TutorProfile> SubscribedTutors { get; set; } = new List<TutorProfile>();
    public ICollection<SubscriptionPayment> Payments { get; set; } = new List<SubscriptionPayment>();
}

public class SubscriptionPayment : IAuditableEntity
{
    public int Id { get; set; }
    public string TutorProfileId { get; set; } = string.Empty;
    public TutorProfile TutorProfile { get; set; } = null!;

    public int SubscriptionPackageId { get; set; }
    public SubscriptionPackage SubscriptionPackage { get; set; } = null!;

    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty; // "KBZPay", "WavePay", "AYAPay", "CBPay", "BankTransfer"
    public string TransactionLast6 { get; set; } = string.Empty;
    public string ScreenshotUrl { get; set; } = string.Empty; // Base64 data URL
    public string? Notes { get; set; }

    public string Status { get; set; } = "Pending"; // "Pending", "Confirmed", "Rejected"
    public string? RejectionReason { get; set; }
    public string? ReviewedByUserId { get; set; }
    public User? ReviewedByUser { get; set; }
    public DateTime? ReviewedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
