using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;

namespace TDMS.Api.Features.Tutors;

public record UpdateCustomizationResponse(string Message, bool IsPublished);

public class UpdateCustomization
{
    private readonly AppDbContext _context;
    private readonly ICurrentUser _currentUser;

    public UpdateCustomization(AppDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<ServiceResult<UpdateCustomizationResponse>> ExecuteAsync(UpdateCustomizationRequest request)
    {
        if (string.IsNullOrEmpty(_currentUser.UserId)) return ServiceResult<UpdateCustomizationResponse>.Unauthorized();

        var tutor = await _context.TutorProfiles.FirstOrDefaultAsync(t => t.UserId == _currentUser.UserId);
        if (tutor == null) return ServiceResult<UpdateCustomizationResponse>.NotFound("Tutor profile not found");

        // Cannot publish if not Verified
        if (request.IsPublished && tutor.VerificationStatus != "Verified")
        {
            return ServiceResult<UpdateCustomizationResponse>.BadRequest(
                "You cannot publish your tutor profile until onboarding documents are verified by an administrator.");
        }

        tutor.Headline = request.Headline;
        tutor.Biography = request.Biography;
        tutor.LayoutThemeJson = request.LayoutThemeJson;
        tutor.IsPublished = request.IsPublished;

        await _context.SaveChangesAsync();
        return ServiceResult<UpdateCustomizationResponse>.Ok(new UpdateCustomizationResponse("Profile customization saved successfully", tutor.IsPublished));
    }
}
