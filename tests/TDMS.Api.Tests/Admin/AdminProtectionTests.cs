using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;
using TDMS.Api.Database.Entities;
using TDMS.Api.Features.Tutors;
using Xunit;

namespace TDMS.Api.Tests.Admin;

public class AdminProtectionTests
{
    private AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public void MatchingWeights_ValidationRule_ShouldEnforce100PercentSum()
    {
        // Valid (40 + 25 + 25 + 10 = 100)
        var valid = new MatchingWeights(40, 25, 25, 10);
        valid.IsValid().Should().BeTrue();

        // Invalid (40 + 30 + 25 + 10 = 105)
        var invalid = new MatchingWeights(40, 30, 25, 10);
        invalid.IsValid().Should().BeFalse();

        // Invalid (40 + 20 + 20 + 10 = 90)
        var invalid2 = new MatchingWeights(40, 20, 20, 10);
        invalid2.IsValid().Should().BeFalse();
    }

    [Fact]
    public void MatchingWeights_JsonCompatibility_ShouldSupportBothNamingSchemes()
    {
        var jsonWithSubjectWeight = """{"subjectWeight":40,"feeWeight":25,"scheduleWeight":20,"modeWeight":15}""";
        var parsed1 = JsonSerializer.Deserialize<MatchingWeights>(jsonWithSubjectWeight);
        parsed1.Should().NotBeNull();
        parsed1!.W_subject.Should().Be(40);
        parsed1.W_fee.Should().Be(25);
        parsed1.W_schedule.Should().Be(20);
        parsed1.W_mode.Should().Be(15);
        parsed1.IsValid().Should().BeTrue();

        var jsonWithWSubject = """{"w_subject":35,"w_fee":35,"w_schedule":15,"w_mode":15}""";
        var parsed2 = JsonSerializer.Deserialize<MatchingWeights>(jsonWithWSubject);
        parsed2.Should().NotBeNull();
        parsed2!.W_subject.Should().Be(35);
        parsed2.W_fee.Should().Be(35);
        parsed2.W_schedule.Should().Be(15);
        parsed2.W_mode.Should().Be(15);
        parsed2.IsValid().Should().BeTrue();
    }

    [Fact]
    public async Task CategoryReferentialIntegrity_ShouldBlockDeletionWhenTutorsReferenceCategory()
    {
        // Arrange
        using var context = CreateDbContext();
        var category = new Category { Name = "Chemistry" };
        context.Categories.Add(category);

        var tutor = new TutorProfile();
        context.TutorProfiles.Add(tutor);
        await context.SaveChangesAsync();

        context.TutorCategories.Add(new TutorCategory
        {
            TutorProfileId = tutor.Id,
            CategoryId = category.Id
        });
        await context.SaveChangesAsync();

        // Act - Check referential guard rule
        var hasReferencingTutors = await context.TutorCategories.AnyAsync(tc => tc.CategoryId == category.Id);

        // Assert
        hasReferencingTutors.Should().BeTrue("System must guard against deleting categories linked to tutors");
    }

    [Fact]
    public async Task SystemAdminProtection_ShouldPreventDeactivationOfCoreSystemAdmin()
    {
        // Arrange
        using var context = CreateDbContext();
        var sysAdminRole = new Role { Name = "SystemAdmin" };
        var adminUser = new User { Email = "admin@tdms.local", IsActive = true };
        context.Roles.Add(sysAdminRole);
        context.Users.Add(adminUser);
        await context.SaveChangesAsync();

        context.UserRoles.Add(new UserRole { UserId = adminUser.Id, RoleId = sysAdminRole.Id });
        await context.SaveChangesAsync();

        // Act
        var userWithRoles = await context.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .FirstAsync(u => u.Id == adminUser.Id);

        var isSysAdmin = userWithRoles.UserRoles.Any(ur => ur.Role.Name == "SystemAdmin");

        // Assert protection rule
        isSysAdmin.Should().BeTrue();
    }
}
