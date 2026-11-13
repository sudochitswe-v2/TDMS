using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;
using TDMS.Api.Database.Entities;
using TDMS.Api.Features.Auth;
using Xunit;

namespace TDMS.Api.Tests.Auth;

public class TokenServiceTests
{
    private (AppDbContext Context, IConfiguration Configuration) Setup()
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

        return (context, config);
    }

    [Fact]
    public async Task GenerateTokenAsync_ShouldFlattenAndDeduplicateClaimsAcrossRoles()
    {
        // Arrange
        var (context, config) = Setup();
        var tokenService = new TokenService(context, config);

        var user = new User
        {
            Email = "student@example.com",
            UserName = "student",
            FullName = "Jane Doe"
        };
        context.Users.Add(user);

        var role1 = new Role { Name = "RoleA" };
        var role2 = new Role { Name = "RoleB" };
        context.Roles.AddRange(role1, role2);
        await context.SaveChangesAsync();

        context.UserRoles.AddRange(
            new UserRole { UserId = user.Id, RoleId = role1.Id },
            new UserRole { UserId = user.Id, RoleId = role2.Id }
        );

        // Add overlapping and distinct claims
        context.RoleClaims.AddRange(
            new RoleClaim { RoleId = role1.Id, ClaimType = "tutors:read", ClaimValue = "true" },
            new RoleClaim { RoleId = role1.Id, ClaimType = "messages:create", ClaimValue = "true" },
            new RoleClaim { RoleId = role2.Id, ClaimType = "tutors:read", ClaimValue = "true" }, // duplicate
            new RoleClaim { RoleId = role2.Id, ClaimType = "reviews:create", ClaimValue = "true" }
        );
        await context.SaveChangesAsync();

        // Act
        var response = await tokenService.GenerateTokenAsync(user);

        // Assert
        response.Should().NotBeNull();
        response.UserId.Should().Be(user.Id);
        response.Email.Should().Be(user.Email);
        response.Roles.Should().Contain(["RoleA", "RoleB"]);

        // Deduplicated claims
        response.Claims.Should().HaveCount(3);
        response.Claims.Should().ContainKey("tutors:read").WhoseValue.Should().Be("true");
        response.Claims.Should().ContainKey("messages:create").WhoseValue.Should().Be("true");
        response.Claims.Should().ContainKey("reviews:create").WhoseValue.Should().Be("true");

        // Validate decoded JWT claims
        var handler = new JwtSecurityTokenHandler();
        var jwtToken = handler.ReadJwtToken(response.Token);
        jwtToken.Claims.Should().Contain(c => c.Type == "userid" && c.Value == user.Id);
        jwtToken.Claims.Should().Contain(c => c.Type == "tutors:read" && c.Value == "true");
        jwtToken.Claims.Should().Contain(c => c.Type == "messages:create" && c.Value == "true");
        jwtToken.Claims.Should().Contain(c => c.Type == "reviews:create" && c.Value == "true");
    }

    [Fact]
    public async Task PermissionAuthorizationHandler_SystemAdmin_ShouldBypassRequirement()
    {
        // Arrange
        var handler = new PermissionAuthorizationHandler();
        var requirement = new PermissionRequirement("users:delete");

        var claims = new[]
        {
            new Claim("role", "SystemAdmin"),
            new Claim(ClaimTypes.Role, "SystemAdmin")
        };
        var user = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
        var context = new AuthorizationHandlerContext([requirement], user, null);

        // Act
        await handler.HandleAsync(context);

        // Assert
        context.HasSucceeded.Should().BeTrue("SystemAdmin must bypass all permission gates per AGENTS.md");
    }

    [Fact]
    public async Task PermissionAuthorizationHandler_RegularUser_WithClaim_ShouldSucceed()
    {
        // Arrange
        var handler = new PermissionAuthorizationHandler();
        var requirement = new PermissionRequirement("tutors:read");

        var claims = new[]
        {
            new Claim("role", "ParentStudent"),
            new Claim("tutors:read", "true")
        };
        var user = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
        var context = new AuthorizationHandlerContext([requirement], user, null);

        // Act
        await handler.HandleAsync(context);

        // Assert
        context.HasSucceeded.Should().BeTrue();
    }

    [Fact]
    public async Task PermissionAuthorizationHandler_RegularUser_WithoutClaim_ShouldFail()
    {
        // Arrange
        var handler = new PermissionAuthorizationHandler();
        var requirement = new PermissionRequirement("users:delete");

        var claims = new[]
        {
            new Claim("role", "ParentStudent"),
            new Claim("tutors:read", "true")
        };
        var user = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
        var context = new AuthorizationHandlerContext([requirement], user, null);

        // Act
        await handler.HandleAsync(context);

        // Assert
        context.HasSucceeded.Should().BeFalse("User does not have users:delete claim");
    }
}
