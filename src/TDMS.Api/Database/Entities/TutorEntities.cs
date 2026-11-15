namespace TDMS.Api.Database.Entities;

public class TutorProfile : IAuditableEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = string.Empty;
    public User User { get; set; } = null!;

    public string? Headline { get; set; }
    public string? Biography { get; set; }
    public int YearsOfExperience { get; set; }
    public decimal HourlyFee { get; set; }
    public string TeachingMode { get; set; } = "Online"; // "Online", "InPerson", "Both"
    public string? LayoutThemeJson { get; set; }
    public string? ProfilePictureUrl { get; set; } // Base64 data URL (e.g. data:image/jpeg;base64,...)

    public string VerificationStatus { get; set; } = "Pending"; // "Pending", "Verified", "Rejected"
    public string? RejectionReason { get; set; }
    public string? VerifiedByUserId { get; set; }
    public DateTime? VerifiedAt { get; set; }

    public string? CurrentSubscriptionPackageId { get; set; }
    public SubscriptionPackage? CurrentSubscriptionPackage { get; set; }
    public DateTime? SubscriptionUpdatedAt { get; set; }

    public decimal AverageRating { get; set; } = 0.00m;
    public int TotalReviewsCount { get; set; } = 0;
    public bool IsPublished { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<TutorDocument> Documents { get; set; } = new List<TutorDocument>();
    public ICollection<TutorCategory> Categories { get; set; } = new List<TutorCategory>();
    public ICollection<TutorScheduleSlot> ScheduleSlots { get; set; } = new List<TutorScheduleSlot>();
    public ICollection<Inquiry> Inquiries { get; set; } = new List<Inquiry>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public ICollection<SubscriptionPayment> SubscriptionPayments { get; set; } = new List<SubscriptionPayment>();
}

public class TutorDocument
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string TutorProfileId { get; set; } = string.Empty;
    public TutorProfile TutorProfile { get; set; } = null!;

    public string DocumentType { get; set; } = "IdentityID"; // "AcademicCertificate", "TutoringProof", "IdentityID", "Other"
    public string? FileName { get; set; }
    public string FileUrl { get; set; } = string.Empty; // Base64 data URL (e.g. data:application/pdf;base64,... or data:image/png;base64,...)
    public long FileSizeBytes { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}

public class TutorCategory
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string TutorProfileId { get; set; } = string.Empty;
    public TutorProfile TutorProfile { get; set; } = null!;

    public string CategoryId { get; set; } = string.Empty;
    public Category Category { get; set; } = null!;

    public string? GradeLevelTarget { get; set; }
}

public class TutorScheduleSlot
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string TutorProfileId { get; set; } = string.Empty;
    public TutorProfile TutorProfile { get; set; } = null!;

    public byte DayOfWeek { get; set; } // 0 = Sunday, ..., 6 = Saturday
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
}
