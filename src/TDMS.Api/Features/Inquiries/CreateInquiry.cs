using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;
using TDMS.Api.Database.Entities;

namespace TDMS.Api.Features.Inquiries;

public record CreateInquiryResponse(
    string Id,
    string Status,
    string FirebaseThreadId,
    DateTime CreatedAt
);

public class CreateInquiry
{
    private readonly AppDbContext _context;
    private readonly ICurrentUser _currentUser;

    public CreateInquiry(AppDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<ServiceResult<CreateInquiryResponse>> ExecuteAsync(CreateInquiryRequest request)
    {
        if (string.IsNullOrEmpty(_currentUser.UserId)) return ServiceResult<CreateInquiryResponse>.Unauthorized();
        if (string.IsNullOrWhiteSpace(request.InitialRequirementSummary))
        {
            return ServiceResult<CreateInquiryResponse>.BadRequest("Requirement summary is required");
        }

        var tutor = await _context.TutorProfiles
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Id == request.TutorProfileId);

        if (tutor == null)
        {
            return ServiceResult<CreateInquiryResponse>.NotFound("Tutor not found");
        }

        if (tutor.UserId == _currentUser.UserId)
        {
            return ServiceResult<CreateInquiryResponse>.BadRequest("You cannot send an inquiry to your own tutor profile");
        }

        var inquiry = new Inquiry
        {
            LearnerUserId = _currentUser.UserId,
            TutorProfileId = tutor.Id,
            CategoryId = request.CategoryId,
            InitialRequirementSummary = request.InitialRequirementSummary.Trim(),
            Status = "Pending",
            FirebaseThreadId = $"thread_{Guid.NewGuid():N}",
            CreatedAt = DateTime.UtcNow
        };

        _context.Inquiries.Add(inquiry);
        await _context.SaveChangesAsync();

        return ServiceResult<CreateInquiryResponse>.Ok(new CreateInquiryResponse(
            inquiry.Id,
            inquiry.Status,
            inquiry.FirebaseThreadId,
            inquiry.CreatedAt
        ));
    }
}
