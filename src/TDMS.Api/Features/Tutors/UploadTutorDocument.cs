using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;
using TDMS.Api.Database.Entities;

namespace TDMS.Api.Features.Tutors;

public record UploadTutorDocumentResponse(string Message, TutorDocumentItemDto Document);

public class UploadTutorDocument
{
    private readonly AppDbContext _context;
    private readonly ICurrentUser _currentUser;

    public UploadTutorDocument(AppDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<ServiceResult<UploadTutorDocumentResponse>> ExecuteAsync(UploadTutorDocumentRequest request)
    {
        if (string.IsNullOrEmpty(_currentUser.UserId)) return ServiceResult<UploadTutorDocumentResponse>.Unauthorized();

        var tutor = await _context.TutorProfiles
            .Include(t => t.Documents)
            .FirstOrDefaultAsync(t => t.UserId == _currentUser.UserId);
        if (tutor == null) return ServiceResult<UploadTutorDocumentResponse>.NotFound("Tutor profile not found");

        if (string.IsNullOrWhiteSpace(request.FileBase64))
        {
            return ServiceResult<UploadTutorDocumentResponse>.BadRequest("Document file data is required");
        }

        var docType = string.IsNullOrWhiteSpace(request.DocumentType) ? "AcademicCertificate" : request.DocumentType.Trim();
        var fileName = string.IsNullOrWhiteSpace(request.FileName) ? $"{docType}_{DateTime.UtcNow:yyyyMMddHHmmss}" : request.FileName.Trim();
        var sizeBytes = (long)(request.FileBase64.Length * 0.75);

        var doc = new TutorDocument
        {
            TutorProfileId = tutor.Id,
            DocumentType = docType,
            FileName = fileName,
            FileUrl = request.FileBase64,
            FileSizeBytes = sizeBytes,
            UploadedAt = DateTime.UtcNow
        };

        _context.TutorDocuments.Add(doc);
        tutor.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return ServiceResult<UploadTutorDocumentResponse>.Ok(new UploadTutorDocumentResponse(
            "Verification document uploaded successfully",
            new TutorDocumentItemDto(
                doc.Id,
                doc.DocumentType,
                doc.FileName,
                doc.FileUrl,
                doc.FileSizeBytes,
                doc.UploadedAt
            )
        ));
    }
}
