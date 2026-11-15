using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using TDMS.Api.Features.Tutors;
using Xunit;

namespace TDMS.Api.Tests.Tutors;

public class TutorSearchTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public TutorSearchTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Search_PublicUserWithoutFilters_ShouldReturnTutorsOrderedByMostExpensiveTier()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/tutors/search");

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue();
        var tutors = await response.Content.ReadFromJsonAsync<List<TutorCardDto>>();
        tutors.Should().NotBeNull();
        tutors!.Count.Should().BeGreaterThan(0);

        // All returned tutors must be verified and published
        tutors.Should().OnlyContain(t => t.VerificationStatus == "Verified");

        // The list must be ordered primarily by PriorityBoost (and DisplayFee of tier)
        for (int i = 0; i < tutors.Count - 1; i++)
        {
            tutors[i].PriorityBoost.Should().BeGreaterThanOrEqualTo(tutors[i + 1].PriorityBoost);
        }
    }

    [Fact]
    public async Task Search_LoggedInStudentWithoutFilters_ShouldReturnAllTutorsPrioritizedByMatchScore()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Login as aung.kaung@tdms.local (pre-configured with Mathematics & Physics requirements)
        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "aung.kaung@tdms.local",
            password = "Password123!"
        });
        loginResponse.IsSuccessStatusCode.Should().BeTrue();
        var loginBody = await loginResponse.Content.ReadFromJsonAsync<JsonElement>();
        var token = loginBody.GetProperty("token").GetString();
        token.Should().NotBeNullOrEmpty();

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act - Request without explicit filters
        var response = await client.GetAsync("/api/tutors/search");

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue();
        var tutors = await response.Content.ReadFromJsonAsync<List<TutorCardDto>>();
        tutors.Should().NotBeNull();

        // Unmatched tutors must NOT be removed - all verified tutors are shown
        tutors!.Count.Should().BeGreaterThanOrEqualTo(6);

        // Results must be ordered by MatchScore DESC (priority to matching tutors)
        for (int i = 0; i < tutors.Count - 1; i++)
        {
            tutors[i].MatchScore.Should().BeGreaterThanOrEqualTo(tutors[i + 1].MatchScore);
        }

        // Top tutor must have high compatibility score matching their subjects (Mathematics/Physics)
        tutors[0].MatchScore.Should().BeGreaterThan(50.0);
        tutors[0].Categories.Should().Contain(c => c == "Mathematics" || c == "Physics");
    }

    [Fact]
    public async Task Search_WithCategoryFilter_ShouldReturnOnlyTutorsInThatCategory()
    {
        // Arrange
        var client = _factory.CreateClient();
        var categories = await client.GetFromJsonAsync<List<TDMS.Api.Features.Operations.CategorySummaryDto>>("/api/categories");
        var mathCategory = categories!.First(c => c.Name == "Mathematics");

        // Act - Search specifically for Mathematics category
        var response = await client.GetAsync($"/api/tutors/search?categoryId={mathCategory.Id}");

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue();
        var tutors = await response.Content.ReadFromJsonAsync<List<TutorCardDto>>();
        tutors.Should().NotBeNull();
        tutors!.Count.Should().BeGreaterThan(0);

        // Every tutor must teach Mathematics
        tutors.Should().OnlyContain(t => t.Categories.Contains("Mathematics"));
    }

    [Fact]
    public async Task Search_WithMaxFeeFilter_ShouldReturnOnlyTutorsWithinBudget()
    {
        // Arrange
        var client = _factory.CreateClient();
        decimal maxFee = 22000m;

        // Act
        var response = await client.GetAsync($"/api/tutors/search?maxFee={maxFee}");

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue();
        var tutors = await response.Content.ReadFromJsonAsync<List<TutorCardDto>>();
        tutors.Should().NotBeNull();
        tutors!.Count.Should().BeGreaterThan(0);

        // All tutors must have HourlyFee <= 22,000 MMK
        tutors.Should().OnlyContain(t => t.HourlyFee <= maxFee);
    }

    [Fact]
    public async Task Search_WithTeachingModeFilter_ShouldReturnOnlyCompatibleTutors()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act - Search for "Online" mode only
        var response = await client.GetAsync("/api/tutors/search?teachingMode=Online");

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue();
        var tutors = await response.Content.ReadFromJsonAsync<List<TutorCardDto>>();
        tutors.Should().NotBeNull();
        tutors!.Count.Should().BeGreaterThan(0);

        // Every tutor must support Online (either "Online" or "Both")
        tutors.Should().OnlyContain(t => t.TeachingMode == "Online" || t.TeachingMode == "Both");
    }
}
