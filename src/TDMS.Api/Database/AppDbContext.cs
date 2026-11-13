using Microsoft.EntityFrameworkCore;
using TDMS.Api.Database.Entities;

namespace TDMS.Api.Database;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RoleClaim> RoleClaims => Set<RoleClaim>();
    public DbSet<LearnerProfile> LearnerProfiles => Set<LearnerProfile>();
    public DbSet<LearnerRequirementCategory> LearnerRequirementCategories => Set<LearnerRequirementCategory>();
    public DbSet<LearnerScheduleSlot> LearnerScheduleSlots => Set<LearnerScheduleSlot>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<SubscriptionPackage> SubscriptionPackages => Set<SubscriptionPackage>();
    public DbSet<SubscriptionPayment> SubscriptionPayments => Set<SubscriptionPayment>();
    public DbSet<TutorProfile> TutorProfiles => Set<TutorProfile>();
    public DbSet<TutorDocument> TutorDocuments => Set<TutorDocument>();
    public DbSet<TutorCategory> TutorCategories => Set<TutorCategory>();
    public DbSet<TutorScheduleSlot> TutorScheduleSlots => Set<TutorScheduleSlot>();
    public DbSet<Inquiry> Inquiries => Set<Inquiry>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<SearchAuditLog> SearchAuditLogs => Set<SearchAuditLog>();
    public DbSet<SystemSetting> SystemSettings => Set<SystemSetting>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasMaxLength(36);
            entity.Property(e => e.Email).HasMaxLength(150).IsRequired();
            entity.Property(e => e.UserName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.FullName).HasMaxLength(150).IsRequired();
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.UserName).IsUnique();
        });

        // Role
        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasMaxLength(36);
            entity.Property(e => e.Name).HasMaxLength(80).IsRequired();
            entity.HasIndex(e => e.Name).IsUnique();
        });

        // UserRole
        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.RoleId });
            entity.HasOne(e => e.User)
                .WithMany(u => u.UserRoles)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Role)
                .WithMany(r => r.UserRoles)
                .HasForeignKey(e => e.RoleId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // RoleClaim
        modelBuilder.Entity<RoleClaim>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ClaimType).HasMaxLength(150).IsRequired();
            entity.Property(e => e.ClaimValue).HasMaxLength(50).IsRequired();
            entity.HasIndex(e => new { e.RoleId, e.ClaimType }).IsUnique();

            entity.HasOne(e => e.Role)
                .WithMany(r => r.RoleClaims)
                .HasForeignKey(e => e.RoleId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // LearnerProfile
        modelBuilder.Entity<LearnerProfile>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasMaxLength(36);
            entity.Property(e => e.UserId).HasMaxLength(36).IsRequired();
            entity.Property(e => e.AccountSubType).HasMaxLength(20).IsRequired();
            entity.Property(e => e.GradeLevel).HasMaxLength(50);
            entity.Property(e => e.PreferredTeachingMode).HasMaxLength(20).IsRequired();
            entity.Property(e => e.PreferredMaxHourlyFee).HasPrecision(10, 2);
            entity.HasIndex(e => e.UserId).IsUnique();

            entity.HasOne(e => e.User)
                .WithOne(u => u.LearnerProfile)
                .HasForeignKey<LearnerProfile>(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // LearnerRequirementCategory
        modelBuilder.Entity<LearnerRequirementCategory>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.LearnerProfile)
                .WithMany(p => p.RequirementCategories)
                .HasForeignKey(e => e.LearnerProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Category)
                .WithMany(c => c.LearnerCategories)
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // LearnerScheduleSlot
        modelBuilder.Entity<LearnerScheduleSlot>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.LearnerProfile)
                .WithMany(p => p.ScheduleSlots)
                .HasForeignKey(e => e.LearnerProfileId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Category
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.HasIndex(e => e.Name).IsUnique();
        });

        // SubscriptionPackage
        modelBuilder.Entity<SubscriptionPackage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TierName).HasMaxLength(80).IsRequired();
            entity.Property(e => e.DisplayFee).HasPrecision(10, 2);
            entity.HasIndex(e => e.TierName).IsUnique();
        });

        // TutorProfile
        modelBuilder.Entity<TutorProfile>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasMaxLength(36);
            entity.Property(e => e.UserId).HasMaxLength(36).IsRequired();
            entity.Property(e => e.Headline).HasMaxLength(150);
            entity.Property(e => e.HourlyFee).HasPrecision(10, 2);
            entity.Property(e => e.AverageRating).HasPrecision(3, 2);
            entity.Property(e => e.TeachingMode).HasMaxLength(20).IsRequired();
            entity.Property(e => e.VerificationStatus).HasMaxLength(20).IsRequired();
            entity.Property(e => e.RejectionReason).HasMaxLength(500);
            entity.Property(e => e.ProfilePictureUrl).HasColumnType("longtext");
            entity.HasIndex(e => e.UserId).IsUnique();

            entity.HasOne(e => e.User)
                .WithOne(u => u.TutorProfile)
                .HasForeignKey<TutorProfile>(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.VerifiedByUser)
                .WithMany()
                .HasForeignKey(e => e.VerifiedByUserId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.CurrentSubscriptionPackage)
                .WithMany(s => s.SubscribedTutors)
                .HasForeignKey(e => e.CurrentSubscriptionPackageId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // TutorDocument
        modelBuilder.Entity<TutorDocument>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.DocumentType).HasMaxLength(80).IsRequired();
            entity.Property(e => e.FileName).HasMaxLength(255);
            entity.Property(e => e.FileUrl).HasColumnType("longtext").IsRequired();

            entity.HasOne(e => e.TutorProfile)
                .WithMany(p => p.Documents)
                .HasForeignKey(e => e.TutorProfileId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // TutorCategory
        modelBuilder.Entity<TutorCategory>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.GradeLevelTarget).HasMaxLength(50);

            entity.HasOne(e => e.TutorProfile)
                .WithMany(p => p.Categories)
                .HasForeignKey(e => e.TutorProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Category)
                .WithMany(c => c.TutorCategories)
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // TutorScheduleSlot
        modelBuilder.Entity<TutorScheduleSlot>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.TutorProfile)
                .WithMany(p => p.ScheduleSlots)
                .HasForeignKey(e => e.TutorProfileId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Inquiry
        modelBuilder.Entity<Inquiry>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasMaxLength(36);
            entity.Property(e => e.Status).HasMaxLength(20).IsRequired();
            entity.Property(e => e.FirebaseThreadId).HasMaxLength(128).IsRequired();
            entity.HasIndex(e => e.FirebaseThreadId).IsUnique();

            entity.HasOne(e => e.LearnerUser)
                .WithMany()
                .HasForeignKey(e => e.LearnerUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.TutorProfile)
                .WithMany(p => p.Inquiries)
                .HasForeignKey(e => e.TutorProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Category)
                .WithMany()
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Review
        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasMaxLength(36);
            entity.HasIndex(e => new { e.LearnerUserId, e.TutorProfileId }).IsUnique();

            entity.HasOne(e => e.LearnerUser)
                .WithMany()
                .HasForeignKey(e => e.LearnerUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.TutorProfile)
                .WithMany(p => p.Reviews)
                .HasForeignKey(e => e.TutorProfileId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // SearchAuditLog
        modelBuilder.Entity<SearchAuditLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Category)
                .WithMany()
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.LearnerUser)
                .WithMany()
                .HasForeignKey(e => e.LearnerUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // SystemSetting
        modelBuilder.Entity<SystemSetting>(entity =>
        {
            entity.HasKey(e => e.Key);
            entity.Property(e => e.Key).HasMaxLength(100);
        });

        // SubscriptionPayment
        modelBuilder.Entity<SubscriptionPayment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TutorProfileId).HasMaxLength(36).IsRequired();
            entity.Property(e => e.PaymentMethod).HasMaxLength(50).IsRequired();
            entity.Property(e => e.TransactionLast6).HasMaxLength(20).IsRequired();
            entity.Property(e => e.ScreenshotUrl).HasColumnType("longtext").IsRequired();
            entity.Property(e => e.Notes).HasMaxLength(500);
            entity.Property(e => e.Amount).HasPrecision(18, 2);
            entity.Property(e => e.Status).HasMaxLength(30).IsRequired();
            entity.Property(e => e.RejectionReason).HasMaxLength(500);
            entity.Property(e => e.ReviewedByUserId).HasMaxLength(36);

            entity.HasOne(e => e.TutorProfile)
                .WithMany(p => p.SubscriptionPayments)
                .HasForeignKey(e => e.TutorProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.SubscriptionPackage)
                .WithMany(p => p.Payments)
                .HasForeignKey(e => e.SubscriptionPackageId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.ReviewedByUser)
                .WithMany()
                .HasForeignKey(e => e.ReviewedByUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
