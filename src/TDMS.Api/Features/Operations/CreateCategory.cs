using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;
using TDMS.Api.Database.Entities;

namespace TDMS.Api.Features.Operations;

public class CreateCategory
{
    private readonly AppDbContext _context;

    public CreateCategory(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ServiceResult<Category>> ExecuteAsync(CreateCategoryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return ServiceResult<Category>.BadRequest("Category name is required");
        }

        var exists = await _context.Categories.AnyAsync(c => c.Name.ToLower() == request.Name.Trim().ToLower());
        if (exists)
        {
            return ServiceResult<Category>.Conflict("A category with this name already exists");
        }

        var category = new Category
        {
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            IsActive = request.IsActive
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return ServiceResult<Category>.Ok(category);
    }
}
