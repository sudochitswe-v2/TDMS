using Microsoft.Extensions.Configuration;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;
using TDMS.Api.Features.Messaging;

namespace TDMS.Api.Features.Administration;

public record SystemDataResponse(
    string DatabaseStatus,
    string? DatabaseProvider,
    string FirebaseProvider,
    DateTime ServerTimeUtc,
    string Environment,
    string AppVersion,
    string AppChannel,
    bool IsStable
);

public class GetSystemData
{
    private readonly AppDbContext _context;
    private readonly IFirebaseMessagingService _messagingService;
    private readonly IConfiguration _configuration;

    public GetSystemData(AppDbContext context, IFirebaseMessagingService messagingService, IConfiguration configuration)
    {
        _context = context;
        _messagingService = messagingService;
        _configuration = configuration;
    }

    public async Task<SystemDataResponse> ExecuteAsync()
    {
        var dbCanConnect = await _context.Database.CanConnectAsync();
        var versionInfo = AppVersion.Parse(_configuration["AppVersion"]);

        return new SystemDataResponse(
            DatabaseStatus: dbCanConnect ? "Connected (Healthy)" : "Disconnected (Degraded)",
            DatabaseProvider: _context.Database.ProviderName,
            FirebaseProvider: _messagingService.ProviderName,
            ServerTimeUtc: DateTime.UtcNow,
            Environment: System.Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production",
            AppVersion: versionInfo.Raw,
            AppChannel: versionInfo.Channel,
            IsStable: versionInfo.IsStable
        );
    }
}
