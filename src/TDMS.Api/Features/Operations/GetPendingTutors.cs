using Microsoft.EntityFrameworkCore;
using TDMS.Api.Database;

namespace TDMS.Api.Features.Operations;

public record PendingTutorDocumentDto(
    string Id,
    string DocumentType,
    string? FileName,
    string FileUrl,
    long FileSizeBytes,
    DateTime UploadedAt
);

public record PendingTutorDto(
    string Id,
    string UserId,
    string FullName,
    string Email,
    string? Headline,
    string? Biography,
    int YearsOfExperience,
    decimal HourlyFee,
    string TeachingMode,
    string VerificationStatus,
    string? RejectionReason,
    string? ProfilePictureUrl,
    DateTime CreatedAt,
    List<string> Categories,
    List<PendingTutorDocumentDto> Documents
);

public class GetPendingTutors
{
    private readonly AppDbContext _context;

    public GetPendingTutors(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<PendingTutorDto>> ExecuteAsync(string? status)
    {
        var query = _context.TutorProfiles
            .Include(t => t.User)
            .Include(t => t.Documents)
            .Include(t => t.Categories).ThenInclude(tc => tc.Category)
            .AsQueryable();

        if (string.Equals(status, "rejected", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(t => t.VerificationStatus == "Rejected");
        }
        else if (string.Equals(status, "all", StringComparison.OrdinalIgnoreCase))
        {
            // All non-empty verification statuses
        }
        else
        {
            query = query.Where(t => t.VerificationStatus == "Pending");
        }

        var tutors = await query
            .OrderBy(t => t.CreatedAt)
            .Select(t => new PendingTutorDto(
                t.Id,
                t.UserId,
                t.User.FullName,
                t.User.Email,
                t.Headline,
                t.Biography,
                t.YearsOfExperience,
                t.HourlyFee,
                t.TeachingMode,
                t.VerificationStatus,
                t.RejectionReason,
                t.ProfilePictureUrl,
                t.CreatedAt,
                t.Categories.Select(c => c.Category.Name).ToList(),
                t.Documents.Select(d => new PendingTutorDocumentDto(
                    d.Id,
                    d.DocumentType,
                    d.FileName,
                    d.FileUrl,
                    d.FileSizeBytes,
                    d.UploadedAt
                )).ToList()
            ))
            .ToListAsync();

        return tutors;
    }
}
