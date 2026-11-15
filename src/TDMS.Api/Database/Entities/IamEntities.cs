namespace TDMS.Api.Database.Entities;

public interface IAuditableEntity
{
    DateTime CreatedAt { get; set; }
    DateTime? UpdatedAt { get; set; }
}

public class User : IAuditableEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Email { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public LearnerProfile? LearnerProfile { get; set; }
    public TutorProfile? TutorProfile { get; set; }
}

public class Role
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public ICollection<RoleClaim> RoleClaims { get; set; } = new List<RoleClaim>();
}

public class UserRole
{
    public string UserId { get; set; } = string.Empty;
    public User User { get; set; } = null!;

    public string RoleId { get; set; } = string.Empty;
    public Role Role { get; set; } = null!;
}

public class RoleClaim
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string RoleId { get; set; } = string.Empty;
    public Role Role { get; set; } = null!;

    public string ClaimType { get; set; } = string.Empty;
    public string ClaimValue { get; set; } = "true";
}
