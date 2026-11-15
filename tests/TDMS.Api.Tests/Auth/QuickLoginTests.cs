using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TDMS.Api.Database;
using TDMS.Api.Database.Entities;
using TDMS.Api.Features.Auth;
using Xunit;

namespace TDMS.Api.Tests.Auth;

public class QuickLoginTests
{
    private (AppDbContext Context, ITokenService TokenService) Setup()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        var context = new AppDbContext(options);

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "TDMS_Super_Secret_Jwt_Security_Key_For_Claims_And_RBAC_Authorization_2026_!",
                ["Jwt:Issuer"] = "TDMS.Api",
                ["Jwt:Audience"] = "TDMS.Spa",
                ["Jwt:ExpiryMinutes"] = "60"
            })
            .Build();

        var tokenService = new TokenService(context, config);
        return (context, tokenService);
    }

    [Fact]
    public async Task QuickLogin_ShouldSucceed_ByEmail()
    {
        var (context, tokenService) = Setup();
        var user = new User
        {
            Id = Guid.NewGuid().ToString(),
            Email = "target.user@tdms.local",
            UserName = "targetuser",
            FullName = "Target User",
            IsActive = true
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var quickLogin = new QuickLogin(context, tokenService);
        var result = await quickLogin.ExecuteAsync(new QuickLoginRequest(Email: "target.user@tdms.local"));

        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Email.Should().Be("target.user@tdms.local");
        result.Data.Token.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task QuickLogin_ShouldSucceed_ByUserId()
    {
        var (context, tokenService) = Setup();
        var user = new User
        {
            Id = Guid.NewGuid().ToString(),
            Email = "byid@tdms.local",
            UserName = "byid",
            FullName = "User By Id",
            IsActive = true
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var quickLogin = new QuickLogin(context, tokenService);
        var result = await quickLogin.ExecuteAsync(new QuickLoginRequest(UserId: user.Id));

        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.UserId.Should().Be(user.Id);
    }

    [Fact]
    public async Task QuickLogin_ShouldFail_WhenUserNotFound()
    {
        var (context, tokenService) = Setup();
        var quickLogin = new QuickLogin(context, tokenService);
        var result = await quickLogin.ExecuteAsync(new QuickLoginRequest(Email: "nonexistent@tdms.local"));

        result.Success.Should().BeFalse();
        result.StatusCode.Should().Be(404);
        result.Error.Should().Contain("not found");
    }

    [Fact]
    public async Task QuickLogin_ShouldFail_WhenUserIsSuspended()
    {
        var (context, tokenService) = Setup();
        var user = new User
        {
            Id = Guid.NewGuid().ToString(),
            Email = "inactive@tdms.local",
            UserName = "inactive",
            FullName = "Inactive User",
            IsActive = false
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var quickLogin = new QuickLogin(context, tokenService);
        var result = await quickLogin.ExecuteAsync(new QuickLoginRequest(Email: "inactive@tdms.local"));

        result.Success.Should().BeFalse();
        result.StatusCode.Should().Be(400);
        result.Error.Should().Contain("suspended");
    }

    [Fact]
    public async Task GetQuickLoginUsers_ShouldReturnAllUsersWithRoles()
    {
        var (context, _) = Setup();
        var role = new Role { Id = Guid.NewGuid().ToString(), Name = "SystemAdmin" };
        var user = new User
        {
            Id = Guid.NewGuid().ToString(),
            Email = "admin@tdms.local",
            UserName = "admin",
            FullName = "System Admin",
            IsActive = true
        };
        context.Roles.Add(role);
        context.Users.Add(user);
        context.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
        await context.SaveChangesAsync();

        var getFeature = new GetQuickLoginUsers(context);
        var users = await getFeature.ExecuteAsync();

        users.Should().ContainSingle(u => u.Email == "admin@tdms.local");
        var admin = users.First(u => u.Email == "admin@tdms.local");
        admin.Roles.Should().Contain("SystemAdmin");
        admin.AccountType.Should().Be("Admin");
    }

    [Fact]
    public async Task NewlyAddedUser_ShouldAppearInQuickLoginList_AndBeAbleToLoginDirectly()
    {
        // Arrange: Start with an existing system
        var (context, tokenService) = Setup();
        var learnerRole = new Role { Id = Guid.NewGuid().ToString(), Name = "ParentStudent" };
        context.Roles.Add(learnerRole);
        await context.SaveChangesAsync();

        var getFeature = new GetQuickLoginUsers(context);
        var quickLogin = new QuickLogin(context, tokenService);

        // Act 1: A brand new user is registered / added into the database
        var newlyAddedUser = new User
        {
            Id = Guid.NewGuid().ToString(),
            Email = "brandnew.student@tdms.local",
            UserName = "brandnew_student",
            FullName = "Brand New Student",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("SomeRandomSecretPassword!"),
            IsActive = true,
            LearnerProfile = new LearnerProfile
            {
                AccountSubType = "Student",
                GradeLevel = "Grade 12"
            }
        };
        context.Users.Add(newlyAddedUser);
        context.UserRoles.Add(new UserRole { UserId = newlyAddedUser.Id, RoleId = learnerRole.Id });
        await context.SaveChangesAsync();

        // Act 2: Fetch quick login users list - new user MUST appear
        var userList = await getFeature.ExecuteAsync();
        userList.Should().Contain(u => u.Email == "brandnew.student@tdms.local");
        var listed = userList.First(u => u.Email == "brandnew.student@tdms.local");
        listed.FullName.Should().Be("Brand New Student");
        listed.AccountType.Should().Be("Student");
        listed.HeadlineOrGrade.Should().Be("Grade 12");

        // Act 3: Log in as the brand new user directly without their password
        var loginResult = await quickLogin.ExecuteAsync(new QuickLoginRequest(Email: "brandnew.student@tdms.local"));
        loginResult.Success.Should().BeTrue();
        loginResult.Data.Should().NotBeNull();
        loginResult.Data!.Email.Should().Be("brandnew.student@tdms.local");
        loginResult.Data.FullName.Should().Be("Brand New Student");
        loginResult.Data.Roles.Should().Contain("ParentStudent");
        loginResult.Data.Token.Should().NotBeNullOrEmpty();
    }
}
