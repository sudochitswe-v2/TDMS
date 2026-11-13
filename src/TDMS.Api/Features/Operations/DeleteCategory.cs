using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;

namespace TDMS.Api.Features.Operations;

public class DeleteCategory
{
    private readonly AppDbContext _context;

    public DeleteCategory(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ServiceResult<MessageResponse>> ExecuteAsync(int id)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null) return ServiceResult<MessageResponse>.NotFound("Category not found");

        var hasReferencingTutors = await _context.TutorCategories.AnyAsync(tc => tc.CategoryId == id);
        var hasReferencingLearners = await _context.LearnerRequirementCategories.AnyAsync(lc => lc.CategoryId == id);

        if (hasReferencingTutors || hasReferencingLearners)
        {
            return ServiceResult<MessageResponse>.BadRequest(
                "Cannot delete category: it is referenced by existing tutor qualifications or learner requirements. Consider setting it to inactive instead.");
        }

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();

        return ServiceResult<MessageResponse>.Ok(new MessageResponse("Category deleted successfully"));
    }
}
