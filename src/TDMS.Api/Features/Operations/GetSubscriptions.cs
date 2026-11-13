using Microsoft.EntityFrameworkCore;
using TDMS.Api.Database;
using TDMS.Api.Database.Entities;

namespace TDMS.Api.Features.Operations;

public class GetSubscriptions
{
    private readonly AppDbContext _context;

    public GetSubscriptions(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<SubscriptionPackage>> ExecuteAsync()
    {
        return await _context.SubscriptionPackages
            .OrderBy(s => s.DisplayFee)
            .ToListAsync();
    }
}
