namespace TDMS.Api.Abstructions;

public static class ResourceNames
{
    public const string Users = "users";
    public const string Roles = "roles";
    public const string Settings = "settings";
    public const string LearnerProfiles = "learner_profiles";
    public const string Tutors = "tutors";
    public const string Categories = "categories";
    public const string Subscriptions = "subscriptions";
    public const string Inquiries = "inquiries";
    public const string Messages = "messages";
    public const string Reviews = "reviews";
    public const string Reports = "reports";

    public static readonly Dictionary<string, string[]> ResourceActions = new()
    {
        [Users] = ["read", "create", "update", "delete"],
        [Roles] = ["read", "create", "update", "delete"],
        [Settings] = ["read", "update", "maintain"],
        [LearnerProfiles] = ["read", "create", "update"],
        [Tutors] = ["read", "create", "update", "verify"],
        [Categories] = ["read", "create", "update", "delete"],
        [Subscriptions] = ["read", "create", "update", "select"],
        [Inquiries] = ["read", "create", "respond"],
        [Messages] = ["read", "create"],
        [Reviews] = ["read", "create", "update", "delete"],
        [Reports] = ["read", "export"]
    };

    public static readonly IReadOnlyList<string> All = ResourceActions.Keys.ToList();

    public static readonly IReadOnlyList<string> AllPermissions = ResourceActions
        .SelectMany(kvp => kvp.Value.Select(action => $"{kvp.Key}:{action}"))
        .ToList();
}
