namespace TDMS.Api.Abstructions;

public record AppVersionInfo(string Raw, string Version, string Channel, bool IsStable);

public static class AppVersion
{
    public const string DefaultVersion = "1.0.0+preview";

    /// <summary>
    /// Parses GitHub releases versioning: MAJOR.MINOR.PATCH+channel (e.g., 1.0.0+beta, 1.0.0+preview).
    /// If no channel is specified (e.g., 1.0.0), channel defaults to 'stable'.
    /// </summary>
    public static AppVersionInfo Parse(string? raw)
    {
        var trimmed = (string.IsNullOrWhiteSpace(raw) ? DefaultVersion : raw).Trim();
        var plusIdx = trimmed.IndexOf('+');
        var hyphenIdx = trimmed.IndexOf('-');
        var sepIdx = plusIdx != -1 ? plusIdx : hyphenIdx;

        if (sepIdx != -1)
        {
            var ver = trimmed[..sepIdx];
            var channel = trimmed[(sepIdx + 1)..].ToLowerInvariant();
            return new AppVersionInfo(
                trimmed,
                string.IsNullOrWhiteSpace(ver) ? trimmed : ver,
                string.IsNullOrWhiteSpace(channel) ? "stable" : channel,
                string.Equals(channel, "stable", StringComparison.OrdinalIgnoreCase)
            );
        }

        return new AppVersionInfo(trimmed, trimmed, "stable", true);
    }
}
