using Microsoft.EntityFrameworkCore;
using TDMS.Api.Database;

namespace TDMS.Api.Features.Operations;

public record CategorySummaryDto(
    int Id,
    string Name,
    string? Description,
    bool IsActive,
    int TutorCount,
    int LearnerDemandCount
);

public class GetCategories
{
    private readonly AppDbContext _context;

    public GetCategories(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<CategorySummaryDto>> ExecuteAsync()
    {
        var categories = await _context.Categories
            .OrderBy(c => c.Name)
            .Select(c => new CategorySummaryDto(
                c.Id,
                c.Name,
                c.Description,
                c.IsActive,
                _context.TutorCategories.Count(tc => tc.CategoryId == c.Id),
                _context.LearnerRequirementCategories.Count(lc => lc.CategoryId == c.Id)
            ))
            .ToListAsync();

        return categories;
    }
}
