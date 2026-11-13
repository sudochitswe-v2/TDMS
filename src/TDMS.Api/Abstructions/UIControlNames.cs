namespace TDMS.Api.Abstructions;

public static class UIControlNames
{
    public const string NavFindTutors = "view:menu:find_tutors";
    public const string NavLearnerAccount = "view:menu:learner_account";
    public const string NavTutorStudio = "view:menu:tutor_workspace";
    public const string NavMessages = "view:menu:messaging";
    public const string NavMyReviews = "view:menu:feedback";
    public const string TabReviewsByMe = "view:menu:reviews_by_me";
    public const string AdminPanelAccess = "view:menu:admin_panel";
    public const string MenuOperations = "view:menu:operations";
    public const string MenuAnalytics = "view:menu:analytics";
    public const string MenuAdministration = "view:menu:administration";

    public static readonly IReadOnlyList<string> All =
    [
        NavFindTutors,
        NavLearnerAccount,
        NavTutorStudio,
        NavMessages,
        NavMyReviews,
        TabReviewsByMe,
        AdminPanelAccess,
        MenuOperations,
        MenuAnalytics,
        MenuAdministration
    ];
}
