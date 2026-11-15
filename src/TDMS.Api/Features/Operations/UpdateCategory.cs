using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;
using TDMS.Api.Database.Entities;

namespace TDMS.Api.Features.Operations;

public class UpdateCategory
{
    private readonly AppDbContext _context;

    public UpdateCategory(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ServiceResult<Category>> ExecuteAsync(string id, UpdateCategoryRequest request)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null) return ServiceResult<Category>.NotFound("Category not found");

        var duplicate = await _context.Categories
            .AnyAsync(c => c.Id != id && c.Name.ToLower() == request.Name.Trim().ToLower());
        if (duplicate)
        {
            return ServiceResult<Category>.Conflict("Another category with this name already exists");
        }

        category.Name = request.Name.Trim();
        category.Description = request.Description?.Trim();
        category.IsActive = request.IsActive;

        await _context.SaveChangesAsync();
        return ServiceResult<Category>.Ok(category);
    }
}
