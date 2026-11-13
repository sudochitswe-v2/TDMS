using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;

namespace TDMS.Api.Features.Tutors;

public record UpdateProfilePictureResponse(string Message, string? ProfilePictureUrl);

public class UpdateProfilePicture
{
    private readonly AppDbContext _context;
    private readonly ICurrentUser _currentUser;

    public UpdateProfilePicture(AppDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<ServiceResult<UpdateProfilePictureResponse>> ExecuteAsync(UpdateProfilePictureRequest request)
    {
        if (string.IsNullOrEmpty(_currentUser.UserId)) return ServiceResult<UpdateProfilePictureResponse>.Unauthorized();

        var tutor = await _context.TutorProfiles.FirstOrDefaultAsync(t => t.UserId == _currentUser.UserId);
        if (tutor == null) return ServiceResult<UpdateProfilePictureResponse>.NotFound("Tutor profile not found");

        if (string.IsNullOrWhiteSpace(request.ProfilePictureBase64))
        {
            return ServiceResult<UpdateProfilePictureResponse>.BadRequest("Profile picture data is required");
        }

        tutor.ProfilePictureUrl = request.ProfilePictureBase64;
        tutor.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return ServiceResult<UpdateProfilePictureResponse>.Ok(new UpdateProfilePictureResponse("Profile picture updated successfully", tutor.ProfilePictureUrl));
    }
}
