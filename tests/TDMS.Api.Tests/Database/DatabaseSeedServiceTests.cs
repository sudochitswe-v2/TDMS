using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;
using Xunit;

namespace TDMS.Api.Tests.Database;

public class DatabaseSeedServiceTests
{
    private AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task SeedAsync_ShouldSeedAllRolesAndAssign100PercentPermissionsToSystemAdmin()
    {
        // Arrange
        using var context = CreateDbContext();
        var seeder = new DatabaseSeedService(context);

        // Act
        await seeder.SeedAsync();

        // Assert - SystemAdmin Role & Claims
        var sysAdminRole = await context.Roles
            .Include(r => r.RoleClaims)
            .FirstOrDefaultAsync(r => r.Name == "SystemAdmin");

        sysAdminRole.Should().NotBeNull();
        var sysAdminClaimTypes = sysAdminRole!.RoleClaims.Select(c => c.ClaimType).ToHashSet();

        // 100% of ResourceActions must be present in SystemAdmin
        foreach (var perm in ResourceNames.AllPermissions)
        {
            sysAdminClaimTypes.Should().Contain(perm, $"SystemAdmin must have permission {perm}");
        }

        // 100% of UIControlNames must be present in SystemAdmin
        foreach (var uiControl in UIControlNames.All)
        {
            sysAdminClaimTypes.Should().Contain(uiControl, $"SystemAdmin must have UI control {uiControl}");
        }

        // Default Admin User
        var adminUser = await context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Email == "admin@tdms.local");

        adminUser.Should().NotBeNull();
        adminUser!.UserRoles.Should().Contain(ur => ur.Role.Name == "SystemAdmin");

        // Default Operation Admin User
        var opsUser = await context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Email == "ops@tdms.local");

        opsUser.Should().NotBeNull();
        opsUser!.UserRoles.Should().Contain(ur => ur.Role.Name == "OperationAdmin");

        // OperationAdmin Role & Claims
        var opAdminRole = await context.Roles
            .Include(r => r.RoleClaims)
            .FirstOrDefaultAsync(r => r.Name == "OperationAdmin");
        opAdminRole.Should().NotBeNull();
        opAdminRole!.RoleClaims.Should().Contain(rc => rc.ClaimType == "tutors:verify");
        opAdminRole.RoleClaims.Should().Contain(rc => rc.ClaimType == UIControlNames.MenuOperations);

        // ParentStudent Role
        var parentStudentRole = await context.Roles
            .Include(r => r.RoleClaims)
            .FirstOrDefaultAsync(r => r.Name == "ParentStudent");
        parentStudentRole.Should().NotBeNull();
        parentStudentRole!.RoleClaims.Should().Contain(rc => rc.ClaimType == UIControlNames.NavLearnerAccount);
        parentStudentRole.RoleClaims.Should().Contain(rc => rc.ClaimType == UIControlNames.NavFindTutors);
        parentStudentRole.RoleClaims.Should().Contain(rc => rc.ClaimType == UIControlNames.TabReviewsByMe);
        parentStudentRole.RoleClaims.Should().Contain(rc => rc.ClaimType == "tutors:read");
        parentStudentRole.RoleClaims.Should().NotContain(rc => rc.ClaimType == UIControlNames.AdminPanelAccess);

        // Tutor Role
        var tutorRole = await context.Roles
            .Include(r => r.RoleClaims)
            .FirstOrDefaultAsync(r => r.Name == "Tutor");
        tutorRole.Should().NotBeNull();
        tutorRole!.RoleClaims.Should().Contain(rc => rc.ClaimType == UIControlNames.NavTutorStudio);
        tutorRole.RoleClaims.Should().Contain(rc => rc.ClaimType == "subscriptions:select");
        tutorRole.RoleClaims.Should().NotContain(rc => rc.ClaimType == UIControlNames.NavFindTutors, "Tutors should not have Find Tutors menu claim");
        tutorRole.RoleClaims.Should().NotContain(rc => rc.ClaimType == UIControlNames.TabReviewsByMe, "Tutors should not have Reviews By Me tab claim");

        // Categories & Packages
        var categoryCount = await context.Categories.CountAsync();
        categoryCount.Should().BeGreaterThanOrEqualTo(6);

        var packageCount = await context.SubscriptionPackages.CountAsync();
        packageCount.Should().Be(3);

        // System Settings
        var weightsSetting = await context.SystemSettings.FirstOrDefaultAsync(s => s.Key == "MatchingAlgorithmWeights");
        weightsSetting.Should().NotBeNull();
        weightsSetting!.ValueJson.Should().Contain("W_subject");

        // Seeded Tutors (1 for each subject category)
        var tutorProfiles = await context.TutorProfiles
            .Include(t => t.Categories)
            .Include(t => t.ScheduleSlots)
            .ToListAsync();
        tutorProfiles.Count.Should().Be(6);
        tutorProfiles.Should().OnlyContain(t => t.VerificationStatus == "Verified" && t.IsPublished);
        tutorProfiles.Should().OnlyContain(t => t.Categories.Count >= 1);
        tutorProfiles.Should().OnlyContain(t => t.ScheduleSlots.Count >= 4);
        tutorProfiles.Should().OnlyContain(t => t.TotalReviewsCount >= 3 && t.AverageRating >= 4.0m);

        // Seeded Reviews (Real student feedback)
        var reviews = await context.Reviews
            .Include(r => r.LearnerUser)
            .Include(r => r.TutorProfile)
            .ToListAsync();
        reviews.Count.Should().Be(19);
        reviews.Should().OnlyContain(r => r.StarRating >= 4 && r.StarRating <= 5 && !string.IsNullOrWhiteSpace(r.Comment));
        reviews.Should().OnlyContain(r => r.LearnerUser != null && r.TutorProfile != null);

        // Seeded Students (10 students)
        var learnerProfiles = await context.LearnerProfiles
            .Include(l => l.RequirementCategories)
            .Include(l => l.ScheduleSlots)
            .ToListAsync();
        learnerProfiles.Count.Should().Be(10);
        learnerProfiles.Should().OnlyContain(l => l.RequirementCategories.Count >= 1);
        learnerProfiles.Should().OnlyContain(l => l.ScheduleSlots.Count >= 3);

        // Password Consistency: all accounts must share DatabaseSeedService.DefaultPassword ("Password123!")
        var mathTutorUser = await context.Users.FirstAsync(u => u.Email == "kyaw.swar@tdms.local");
        BCrypt.Net.BCrypt.Verify(DatabaseSeedService.DefaultPassword, mathTutorUser.PasswordHash).Should().BeTrue();

        var student1User = await context.Users.FirstAsync(u => u.Email == "aung.kaung@tdms.local");
        BCrypt.Net.BCrypt.Verify(DatabaseSeedService.DefaultPassword, student1User.PasswordHash).Should().BeTrue();

        var adminUserCheck = await context.Users.FirstAsync(u => u.Email == "admin@tdms.local");
        BCrypt.Net.BCrypt.Verify(DatabaseSeedService.DefaultPassword, adminUserCheck.PasswordHash).Should().BeTrue();
    }

    [Fact]
    public async Task SeedAsync_WhenDataAlreadyExists_ShouldSkipWithoutReSeedingOrThrowing()
    {
        // Arrange
        using var context = CreateDbContext();
        var seeder = new DatabaseSeedService(context);

        // First run - seeds data
        await seeder.SeedAsync();
        var initialUserCount = await context.Users.CountAsync();
        var initialReviewCount = await context.Reviews.CountAsync();
        initialUserCount.Should().BeGreaterThan(0);

        // Act - Second run when database already has data
        await seeder.SeedAsync();

        // Assert - no duplicate records created, no exceptions thrown
        var secondUserCount = await context.Users.CountAsync();
        var secondReviewCount = await context.Reviews.CountAsync();

        secondUserCount.Should().Be(initialUserCount);
        secondReviewCount.Should().Be(initialReviewCount);
    }

    [Fact]
    public async Task HasExistingDataAsync_ShouldReturnFalseWhenEmpty_AndTrueWhenUsersExist()
    {
        // Arrange
        using var context = CreateDbContext();
        var seeder = new DatabaseSeedService(context);

        // Act & Assert 1 - Initially empty
        var hasDataInitially = await seeder.HasExistingDataAsync();
        hasDataInitially.Should().BeFalse();

        // Act & Assert 2 - After seeding
        await seeder.SeedAsync();
        var hasDataAfterSeed = await seeder.HasExistingDataAsync();
        hasDataAfterSeed.Should().BeTrue();
    }
}
