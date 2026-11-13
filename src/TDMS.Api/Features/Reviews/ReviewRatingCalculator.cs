using Microsoft.EntityFrameworkCore;
using TDMS.Api.Database;

namespace TDMS.Api.Features.Reviews;

public static class ReviewRatingCalculator
{
    public static async Task RecalculateTutorRatingAsync(string tutorProfileId, AppDbContext context)
    {
        var tutor = await context.TutorProfiles.FirstOrDefaultAsync(t => t.Id == tutorProfileId);
        if (tutor == null) return;

        var ratings = await context.Reviews
            .Where(r => r.TutorProfileId == tutorProfileId)
            .Select(r => r.StarRating)
            .ToListAsync();

        if (ratings.Count == 0)
        {
            tutor.AverageRating = 0.00m;
            tutor.TotalReviewsCount = 0;
        }
        else
        {
            tutor.TotalReviewsCount = ratings.Count;
            tutor.AverageRating = Math.Round((decimal)ratings.Average(), 2);
        }

        await context.SaveChangesAsync();
    }
}
