using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;

namespace TDMS.Api.Features.Tutors;

public class DeleteTutorDocument
{
    private readonly AppDbContext _context;
    private readonly ICurrentUser _currentUser;

    public DeleteTutorDocument(AppDbContext context, ICurrentUser currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<ServiceResult<MessageResponse>> ExecuteAsync(string documentId)
    {
        if (string.IsNullOrEmpty(_currentUser.UserId)) return ServiceResult<MessageResponse>.Unauthorized();

        var tutor = await _context.TutorProfiles.FirstOrDefaultAsync(t => t.UserId == _currentUser.UserId);
        if (tutor == null) return ServiceResult<MessageResponse>.NotFound("Tutor profile not found");

        var doc = await _context.TutorDocuments.FirstOrDefaultAsync(d => d.Id == documentId && d.TutorProfileId == tutor.Id);
        if (doc == null) return ServiceResult<MessageResponse>.NotFound("Document not found");

        _context.TutorDocuments.Remove(doc);
        tutor.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return ServiceResult<MessageResponse>.Ok(new MessageResponse("Document removed successfully"));
    }
}
