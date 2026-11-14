using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TDMS.Api.Abstructions;
using TDMS.Api.Database.Entities;

namespace TDMS.Api.Database;

public class DatabaseSeedService
{
    public const string DefaultPassword = "Password123!";
    private readonly AppDbContext _context;

    public DatabaseSeedService(AppDbContext context)
    {
        _context = context;
    }

    public async Task SeedAsync()
    {
        await _context.Database.EnsureCreatedAsync();

        if (_context.Database.IsRelational())
        {
            var ddlStatements = new[]
            {
                "ALTER TABLE TutorProfiles ADD COLUMN IF NOT EXISTS ProfilePictureUrl LONGTEXT",
                "ALTER TABLE TutorDocuments MODIFY COLUMN FileUrl LONGTEXT",
                "ALTER TABLE TutorDocuments ADD COLUMN IF NOT EXISTS FileName VARCHAR(255)",
                "ALTER TABLE TutorDocuments ADD COLUMN IF NOT EXISTS FileSizeBytes BIGINT DEFAULT 0",
                @"CREATE TABLE IF NOT EXISTS `SubscriptionPayments` (
                    `Id` INT AUTO_INCREMENT PRIMARY KEY,
                    `TutorProfileId` VARCHAR(36) NOT NULL,
                    `SubscriptionPackageId` INT NOT NULL,
                    `Amount` DECIMAL(18,2) NOT NULL,
                    `PaymentMethod` VARCHAR(50) NOT NULL,
                    `TransactionLast6` VARCHAR(20) NOT NULL,
                    `ScreenshotUrl` LONGTEXT NOT NULL,
                    `Notes` VARCHAR(500) NULL,
                    `Status` VARCHAR(30) NOT NULL DEFAULT 'Pending',
                    `RejectionReason` VARCHAR(500) NULL,
                    `ReviewedByUserId` VARCHAR(36) NULL,
                    `ReviewedAt` DATETIME(6) NULL,
                    `CreatedAt` DATETIME(6) NOT NULL,
                    `UpdatedAt` DATETIME(6) NULL,
                    CONSTRAINT `FK_SubPay_Tutor` FOREIGN KEY (`TutorProfileId`) REFERENCES `TutorProfiles` (`Id`) ON DELETE CASCADE,
                    CONSTRAINT `FK_SubPay_Package` FOREIGN KEY (`SubscriptionPackageId`) REFERENCES `SubscriptionPackages` (`Id`) ON DELETE RESTRICT
                )",
                "ALTER TABLE SubscriptionPayments MODIFY COLUMN ScreenshotUrl LONGTEXT"
            };

            foreach (var ddl in ddlStatements)
            {
                try
                {
                    await _context.Database.ExecuteSqlRawAsync(ddl);
                }
                catch { /* non-critical if in-memory, already modified or exists */ }
            }
        }

        await SeedRolesAndPermissionsAsync();
        await SeedDefaultAdminUserAsync();
        await SeedDefaultCategoriesAsync();
        await SeedDefaultSubscriptionPackagesAsync();
        await SeedDefaultSystemSettingsAsync();
        await _context.SaveChangesAsync();

        await SeedDefaultTutorsAsync();
        await SeedDefaultStudentsAsync();
        await _context.SaveChangesAsync();

        await SeedDefaultReviewsAsync();
        await _context.SaveChangesAsync();

        await SeedDefaultSubscriptionPaymentsAsync();
        await _context.SaveChangesAsync();
    }

    private async Task SeedRolesAndPermissionsAsync()
    {
        var allClaims = new List<string>();
        allClaims.AddRange(ResourceNames.AllPermissions);
        allClaims.AddRange(UIControlNames.All);

        // 1. SystemAdmin Role
        var systemAdminRole = await _context.Roles
            .Include(r => r.RoleClaims)
            .FirstOrDefaultAsync(r => r.Name == "SystemAdmin");

        if (systemAdminRole == null)
        {
            systemAdminRole = new Role
            {
                Name = "SystemAdmin",
                Description = "Full access system administrator with 100% platform permissions"
            };
            _context.Roles.Add(systemAdminRole);
            await _context.SaveChangesAsync();
        }

        var existingSysAdminClaims = systemAdminRole.RoleClaims.Select(rc => rc.ClaimType).ToHashSet();
        foreach (var claim in allClaims)
        {
            if (!existingSysAdminClaims.Contains(claim))
            {
                _context.RoleClaims.Add(new RoleClaim
                {
                    RoleId = systemAdminRole.Id,
                    ClaimType = claim,
                    ClaimValue = "true"
                });
            }
        }

        // 2. ParentStudent Role
        var parentStudentRole = await _context.Roles
            .Include(r => r.RoleClaims)
            .FirstOrDefaultAsync(r => r.Name == "ParentStudent");

        if (parentStudentRole == null)
        {
            parentStudentRole = new Role
            {
                Name = "ParentStudent",
                Description = "Learner account shared by parents and students"
            };
            _context.Roles.Add(parentStudentRole);
            await _context.SaveChangesAsync();
        }

        var parentStudentClaims = new[]
        {
            UIControlNames.NavFindTutors,
            UIControlNames.NavLearnerAccount,
            UIControlNames.NavMessages,
            UIControlNames.NavMyReviews,
            UIControlNames.TabReviewsByMe,
            "tutors:read",
            "categories:read",
            "learner_profiles:read",
            "learner_profiles:create",
            "learner_profiles:update",
            "inquiries:read",
            "inquiries:create",
            "messages:read",
            "messages:create",
            "reviews:read",
            "reviews:create",
            "reviews:update"
        };
        SyncRoleClaims(parentStudentRole, parentStudentClaims);

        // 3. Tutor Role
        var tutorRole = await _context.Roles
            .Include(r => r.RoleClaims)
            .FirstOrDefaultAsync(r => r.Name == "Tutor");

        if (tutorRole == null)
        {
            tutorRole = new Role
            {
                Name = "Tutor",
                Description = "Freelance educator onboarding onto the platform"
            };
            _context.Roles.Add(tutorRole);
            await _context.SaveChangesAsync();
        }

        var tutorClaims = new[]
        {
            UIControlNames.NavTutorStudio,
            UIControlNames.NavMessages,
            UIControlNames.NavMyReviews,
            "tutors:read",
            "tutors:create",
            "tutors:update",
            "categories:read",
            "subscriptions:read",
            "subscriptions:select",
            "inquiries:read",
            "inquiries:respond",
            "messages:read",
            "messages:create",
            "reviews:read"
        };
        SyncRoleClaims(tutorRole, tutorClaims);

        // Defensively ensure Tutor role never holds Find Tutors or Reviews By Me claims
        var unwantedTutorClaims = tutorRole.RoleClaims
            .Where(rc => rc.ClaimType == UIControlNames.NavFindTutors || rc.ClaimType == UIControlNames.TabReviewsByMe)
            .ToList();
        if (unwantedTutorClaims.Count > 0)
        {
            _context.RoleClaims.RemoveRange(unwantedTutorClaims);
        }

        // 4. OperationAdmin Role
        var opAdminRole = await _context.Roles
            .Include(r => r.RoleClaims)
            .FirstOrDefaultAsync(r => r.Name == "OperationAdmin");

        if (opAdminRole == null)
        {
            opAdminRole = new Role
            {
                Name = "OperationAdmin",
                Description = "Marketplace operator managing tutor verification, categories, subscriptions, and analytics"
            };
            _context.Roles.Add(opAdminRole);
            await _context.SaveChangesAsync();
        }

        var opAdminClaims = new[]
        {
            UIControlNames.NavFindTutors,
            UIControlNames.AdminPanelAccess,
            UIControlNames.MenuOperations,
            UIControlNames.MenuAnalytics,
            "tutors:read",
            "tutors:verify",
            "categories:read",
            "categories:create",
            "categories:update",
            "categories:delete",
            "subscriptions:read",
            "subscriptions:create",
            "subscriptions:update",
            "reports:read",
            "reports:export",
            "reviews:read"
        };
        SyncRoleClaims(opAdminRole, opAdminClaims);
    }

    private void SyncRoleClaims(Role role, IEnumerable<string> targetClaims)
    {
        var existing = role.RoleClaims.Select(rc => rc.ClaimType).ToHashSet();
        foreach (var claim in targetClaims)
        {
            if (!existing.Contains(claim))
            {
                _context.RoleClaims.Add(new RoleClaim
                {
                    RoleId = role.Id,
                    ClaimType = claim,
                    ClaimValue = "true"
                });
            }
        }
    }

    private async Task SeedDefaultAdminUserAsync()
    {
        var adminEmail = "admin@tdms.local";
        var sharedPasswordHash = BCrypt.Net.BCrypt.HashPassword(DefaultPassword);

        var adminUser = await _context.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Email == adminEmail);

        if (adminUser == null)
        {
            adminUser = new User
            {
                Email = adminEmail,
                UserName = "admin",
                FullName = "System Administrator",
                PasswordHash = sharedPasswordHash,
                IsActive = true
            };
            _context.Users.Add(adminUser);
            await _context.SaveChangesAsync();

            var sysAdminRole = await _context.Roles.FirstAsync(r => r.Name == "SystemAdmin");
            _context.UserRoles.Add(new UserRole
            {
                UserId = adminUser.Id,
                RoleId = sysAdminRole.Id
            });
        }
        else
        {
            // Update admin password to shared DefaultPassword for consistent login
            adminUser.PasswordHash = sharedPasswordHash;
        }

        // 2. Seed Operation Admin User
        var opsEmail = "ops@tdms.local";
        var opsUser = await _context.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Email == opsEmail);

        if (opsUser == null)
        {
            opsUser = new User
            {
                Email = opsEmail,
                UserName = "ops_admin",
                FullName = "Operations Administrator",
                PasswordHash = sharedPasswordHash,
                IsActive = true
            };
            _context.Users.Add(opsUser);
            await _context.SaveChangesAsync();

            var opRole = await _context.Roles.FirstAsync(r => r.Name == "OperationAdmin");
            _context.UserRoles.Add(new UserRole
            {
                UserId = opsUser.Id,
                RoleId = opRole.Id
            });
        }
        else
        {
            opsUser.PasswordHash = sharedPasswordHash;
            var opRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "OperationAdmin");
            if (opRole != null && !opsUser.UserRoles.Any(ur => ur.RoleId == opRole.Id))
            {
                _context.UserRoles.Add(new UserRole
                {
                    UserId = opsUser.Id,
                    RoleId = opRole.Id
                });
            }
        }
    }

    private async Task SeedDefaultCategoriesAsync()
    {
        if (await _context.Categories.AnyAsync()) return;

        var defaultCategories = new[]
        {
            new Category { Name = "Mathematics", Description = "Algebra, Calculus, Geometry, and Statistics" },
            new Category { Name = "Physics", Description = "Classical Mechanics, Thermodynamics, and Electromagnetism" },
            new Category { Name = "Chemistry", Description = "Organic, Inorganic, and Physical Chemistry" },
            new Category { Name = "Biology", Description = "Cellular Biology, Genetics, and Physiology" },
            new Category { Name = "English Language", Description = "Literature, Essay Writing, Grammar, and ESL" },
            new Category { Name = "Computer Science", Description = "Programming, Data Structures, Web Development, and Algorithms" }
        };

        _context.Categories.AddRange(defaultCategories);
    }

    private async Task SeedDefaultSubscriptionPackagesAsync()
    {
        if (await _context.SubscriptionPackages.AnyAsync()) return;

        var packages = new[]
        {
            new SubscriptionPackage
            {
                TierName = "Basic Tier",
                DurationDays = 30,
                DisplayFee = 0.00m,
                MaxActiveSubjects = 1,
                PrioritySearchBoost = 0,
                FeaturesJson = JsonSerializer.Serialize(new[] { "1 Active Subject", "Standard Search Placement", "Basic Messaging" }),
                IsActive = true
            },
            new SubscriptionPackage
            {
                TierName = "Pro Educator",
                DurationDays = 30,
                DisplayFee = 35000.00m,
                MaxActiveSubjects = 5,
                PrioritySearchBoost = 10,
                FeaturesJson = JsonSerializer.Serialize(new[] { "Up to 5 Active Subjects", "+10% Search Ranking Boost", "Verified Profile Badge", "Priority Messaging" }),
                IsActive = true
            },
            new SubscriptionPackage
            {
                TierName = "Master Tutor",
                DurationDays = 90,
                DisplayFee = 90000.00m,
                MaxActiveSubjects = 15,
                PrioritySearchBoost = 25,
                FeaturesJson = JsonSerializer.Serialize(new[] { "Up to 15 Active Subjects", "+25% Search Ranking Boost", "Featured Tutor Banner", "Analytics Insights" }),
                IsActive = true
            }
        };

        _context.SubscriptionPackages.AddRange(packages);
    }

    private async Task SeedDefaultSystemSettingsAsync()
    {
        var weightsKey = "MatchingAlgorithmWeights";
        var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == weightsKey);
        if (setting == null)
        {
            var defaultWeights = new
            {
                W_subject = 40,
                W_fee = 25,
                W_schedule = 20,
                W_mode = 15
            };

            _context.SystemSettings.Add(new SystemSetting
            {
                Key = weightsKey,
                ValueJson = JsonSerializer.Serialize(defaultWeights),
                UpdatedAt = DateTime.UtcNow
            });
        }
    }

    private async Task SeedDefaultTutorsAsync()
    {
        var tutorRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Tutor");
        if (tutorRole == null) return;

        var categories = await _context.Categories.ToListAsync();
        if (categories.Count == 0) return;

        var proPackage = await _context.SubscriptionPackages.FirstOrDefaultAsync(p => p.TierName == "Pro Educator")
                         ?? await _context.SubscriptionPackages.FirstOrDefaultAsync();

        var adminUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == "admin@tdms.local");
        var sharedPasswordHash = BCrypt.Net.BCrypt.HashPassword(DefaultPassword);

        var tutorDefinitions = new[]
        {
            new
            {
                Email = "tutor.math@tdms.local",
                Name = "Dr. Kyaw Swar",
                Headline = "High School & University Mathematics Specialist",
                Bio = "Over 8 years of experience mentoring high school and university students in Advanced Calculus, Algebra, and Geometry.",
                Experience = 8,
                Fee = 25000m,
                Mode = "Both",
                SubjectName = "Mathematics"
            },
            new
            {
                Email = "tutor.physics@tdms.local",
                Name = "Daw Thida Win",
                Headline = "Experienced Physics Instructor (Mechanics & Thermodynamics)",
                Bio = "Specializes in building deep conceptual foundations for IGCSE, Matriculation, and AP Physics candidates.",
                Experience = 6,
                Fee = 28000m,
                Mode = "Online",
                SubjectName = "Physics"
            },
            new
            {
                Email = "tutor.chemistry@tdms.local",
                Name = "U Aung Myo",
                Headline = "Organic & Physical Chemistry Educator",
                Bio = "Focusing on laboratory principles, chemical reaction mechanisms, and university entrance examination preparation.",
                Experience = 5,
                Fee = 22000m,
                Mode = "InPerson",
                SubjectName = "Chemistry"
            },
            new
            {
                Email = "tutor.biology@tdms.local",
                Name = "Dr. Hla Hla Moe",
                Headline = "Physiology & Genetics Medical Tutor",
                Bio = "Passionate educator simplifying complex anatomical pathways, cellular biology, and medical entrance requirements.",
                Experience = 10,
                Fee = 30000m,
                Mode = "Both",
                SubjectName = "Biology"
            },
            new
            {
                Email = "tutor.english@tdms.local",
                Name = "Daw May Zin",
                Headline = "Certified IELTS & Academic English Language Coach",
                Bio = "Helping students improve reading, writing, and conversational fluency with proven interactive methodologies.",
                Experience = 7,
                Fee = 20000m,
                Mode = "Online",
                SubjectName = "English Language"
            },
            new
            {
                Email = "tutor.cs@tdms.local",
                Name = "U Min Thein",
                Headline = "Full-Stack Software Engineer & Algorithms Mentor",
                Bio = "Practical coding sessions in Python, C#, TypeScript, and Data Structures for real-world software engineering.",
                Experience = 9,
                Fee = 35000m,
                Mode = "Both",
                SubjectName = "Computer Science"
            }
        };

        foreach (var def in tutorDefinitions)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == def.Email);
            if (user == null)
            {
                user = new User
                {
                    Email = def.Email,
                    UserName = def.Email,
                    FullName = def.Name,
                    PasswordHash = sharedPasswordHash,
                    IsActive = true
                };
                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                _context.UserRoles.Add(new UserRole
                {
                    UserId = user.Id,
                    RoleId = tutorRole.Id
                });
            }
            else
            {
                user.PasswordHash = sharedPasswordHash;
            }

            var category = categories.FirstOrDefault(c => c.Name.Equals(def.SubjectName, StringComparison.OrdinalIgnoreCase))
                           ?? categories.First();

            var tutorProfile = await _context.TutorProfiles
                .Include(t => t.Categories)
                .Include(t => t.ScheduleSlots)
                .FirstOrDefaultAsync(t => t.UserId == user.Id);

            if (tutorProfile == null)
            {
                tutorProfile = new TutorProfile
                {
                    UserId = user.Id,
                    Headline = def.Headline,
                    Biography = def.Bio,
                    YearsOfExperience = def.Experience,
                    HourlyFee = def.Fee,
                    TeachingMode = def.Mode,
                    VerificationStatus = "Verified",
                    VerifiedAt = DateTime.UtcNow,
                    VerifiedByUserId = adminUser?.Id,
                    IsPublished = true,
                    AverageRating = 0.00m,
                    TotalReviewsCount = 0,
                    CurrentSubscriptionPackageId = proPackage?.Id,
                    SubscriptionUpdatedAt = DateTime.UtcNow.AddDays(-10)
                };
                _context.TutorProfiles.Add(tutorProfile);
                await _context.SaveChangesAsync();

                _context.TutorCategories.Add(new TutorCategory
                {
                    TutorProfileId = tutorProfile.Id,
                    CategoryId = category.Id,
                    GradeLevelTarget = "All Grades"
                });

                _context.TutorScheduleSlots.AddRange(new[]
                {
                    new TutorScheduleSlot
                    {
                        TutorProfileId = tutorProfile.Id,
                        DayOfWeek = 1, // Monday
                        StartTime = new TimeSpan(14, 0, 0),
                        EndTime = new TimeSpan(18, 0, 0)
                    },
                    new TutorScheduleSlot
                    {
                        TutorProfileId = tutorProfile.Id,
                        DayOfWeek = 3, // Wednesday
                        StartTime = new TimeSpan(14, 0, 0),
                        EndTime = new TimeSpan(18, 0, 0)
                    },
                    new TutorScheduleSlot
                    {
                        TutorProfileId = tutorProfile.Id,
                        DayOfWeek = 5, // Friday
                        StartTime = new TimeSpan(14, 0, 0),
                        EndTime = new TimeSpan(18, 0, 0)
                    },
                    new TutorScheduleSlot
                    {
                        TutorProfileId = tutorProfile.Id,
                        DayOfWeek = 6, // Saturday
                        StartTime = new TimeSpan(9, 0, 0),
                        EndTime = new TimeSpan(12, 0, 0)
                    }
                });

                _context.TutorDocuments.Add(new TutorDocument
                {
                    TutorProfileId = tutorProfile.Id,
                    DocumentType = "AcademicCertificate",
                    FileUrl = "https://example.com/credentials/degree.pdf",
                    UploadedAt = DateTime.UtcNow
                });
            }
        }
    }

    private async Task SeedDefaultStudentsAsync()
    {
        var parentStudentRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "ParentStudent");
        if (parentStudentRole == null) return;

        var categories = await _context.Categories.ToListAsync();
        if (categories.Count == 0) return;

        var sharedPasswordHash = BCrypt.Net.BCrypt.HashPassword(DefaultPassword);

        var studentDefinitions = new[]
        {
            new
            {
                Email = "student1@tdms.local",
                Name = "Aung Kaung",
                SubType = "Student",
                Grade = "Grade 11",
                Budget = 30000m,
                Mode = "Both",
                Goal = "Prepare for upcoming board exams in Mathematics and Physics",
                Subjects = new[] { "Mathematics", "Physics" }
            },
            new
            {
                Email = "student2@tdms.local",
                Name = "Su Myat Noe",
                SubType = "Student",
                Grade = "Grade 10",
                Budget = 25000m,
                Mode = "Online",
                Goal = "Master organic chemistry formulas and cell biology terminology",
                Subjects = new[] { "Chemistry", "Biology" }
            },
            new
            {
                Email = "student3@tdms.local",
                Name = "Htet Wai Yan",
                SubType = "Student",
                Grade = "Grade 12",
                Budget = 35000m,
                Mode = "Both",
                Goal = "Build software portfolio and learn algorithms",
                Subjects = new[] { "Computer Science", "Mathematics" }
            },
            new
            {
                Email = "student4@tdms.local",
                Name = "Khin Wint Wah",
                SubType = "Student",
                Grade = "Undergraduate",
                Budget = 30000m,
                Mode = "Online",
                Goal = "Target IELTS 7.5 score for overseas university admission",
                Subjects = new[] { "English Language" }
            },
            new
            {
                Email = "student5@tdms.local",
                Name = "Daw Nilar (Parent)",
                SubType = "Parent",
                Grade = "Middle School",
                Budget = 25000m,
                Mode = "InPerson",
                Goal = "Looking for a patient home tutor for middle school child",
                Subjects = new[] { "English Language", "Mathematics" }
            },
            new
            {
                Email = "student6@tdms.local",
                Name = "Zayar Min",
                SubType = "Student",
                Grade = "Grade 11",
                Budget = 40000m,
                Mode = "Both",
                Goal = "Excel in Advanced Physics problem sets and lab experiments",
                Subjects = new[] { "Physics", "Chemistry" }
            },
            new
            {
                Email = "student7@tdms.local",
                Name = "Thiri Shwe",
                SubType = "Student",
                Grade = "High School",
                Budget = 25000m,
                Mode = "Online",
                Goal = "Deep-dive into genetics and human physiology chapters",
                Subjects = new[] { "Biology" }
            },
            new
            {
                Email = "student8@tdms.local",
                Name = "U Tun Tun (Parent)",
                SubType = "Parent",
                Grade = "Grade 9",
                Budget = 25000m,
                Mode = "InPerson",
                Goal = "Seeking weekend private tutor for foundational algebra",
                Subjects = new[] { "Mathematics" }
            },
            new
            {
                Email = "student9@tdms.local",
                Name = "Myo Min Ko",
                SubType = "Student",
                Grade = "University",
                Budget = 50000m,
                Mode = "Both",
                Goal = "Advanced full-stack architecture and competitive programming",
                Subjects = new[] { "Computer Science" }
            },
            new
            {
                Email = "student10@tdms.local",
                Name = "Pyae Sone Aung",
                SubType = "Student",
                Grade = "Grade 12",
                Budget = 30000m,
                Mode = "Online",
                Goal = "Final revision for competitive college entrance examinations",
                Subjects = new[] { "Chemistry", "Physics" }
            }
        };

        foreach (var def in studentDefinitions)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == def.Email);
            if (user == null)
            {
                user = new User
                {
                    Email = def.Email,
                    UserName = def.Email,
                    FullName = def.Name,
                    PasswordHash = sharedPasswordHash,
                    IsActive = true
                };
                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                _context.UserRoles.Add(new UserRole
                {
                    UserId = user.Id,
                    RoleId = parentStudentRole.Id
                });
            }
            else
            {
                user.PasswordHash = sharedPasswordHash;
            }

            var profile = await _context.LearnerProfiles
                .Include(p => p.RequirementCategories)
                .Include(p => p.ScheduleSlots)
                .FirstOrDefaultAsync(p => p.UserId == user.Id);

            if (profile == null)
            {
                profile = new LearnerProfile
                {
                    UserId = user.Id,
                    AccountSubType = def.SubType,
                    GradeLevel = def.Grade,
                    PreferredMaxHourlyFee = def.Budget,
                    PreferredTeachingMode = def.Mode,
                    LearningGoalsNote = def.Goal
                };
                _context.LearnerProfiles.Add(profile);
                await _context.SaveChangesAsync();

                foreach (var subject in def.Subjects)
                {
                    var cat = categories.FirstOrDefault(c => c.Name.Equals(subject, StringComparison.OrdinalIgnoreCase));
                    if (cat != null)
                    {
                        _context.LearnerRequirementCategories.Add(new LearnerRequirementCategory
                        {
                            LearnerProfileId = profile.Id,
                            CategoryId = cat.Id
                        });
                    }
                }

                _context.LearnerScheduleSlots.AddRange(new[]
                {
                    new LearnerScheduleSlot
                    {
                        LearnerProfileId = profile.Id,
                        DayOfWeek = 1, // Monday
                        StartTime = new TimeSpan(15, 0, 0),
                        EndTime = new TimeSpan(17, 0, 0)
                    },
                    new LearnerScheduleSlot
                    {
                        LearnerProfileId = profile.Id,
                        DayOfWeek = 3, // Wednesday
                        StartTime = new TimeSpan(15, 0, 0),
                        EndTime = new TimeSpan(17, 0, 0)
                    },
                    new LearnerScheduleSlot
                    {
                        LearnerProfileId = profile.Id,
                        DayOfWeek = 6, // Saturday
                        StartTime = new TimeSpan(10, 0, 0),
                        EndTime = new TimeSpan(12, 0, 0)
                    }
                });
            }
        }
    }

    private async Task SeedDefaultReviewsAsync()
    {
        var tutors = await _context.TutorProfiles
            .Include(t => t.Categories).ThenInclude(tc => tc.Category)
            .Include(t => t.User)
            .ToListAsync();
        if (tutors.Count == 0) return;

        var students = await _context.Users
            .Where(u => u.Email.StartsWith("student"))
            .ToListAsync();
        if (students.Count == 0) return;

        var studentByEmail = students.ToDictionary(s => s.Email, s => s);
        var tutorBySubject = tutors.ToDictionary(
            t => t.Categories.FirstOrDefault()?.Category.Name ?? "",
            t => t,
            StringComparer.OrdinalIgnoreCase
        );

        // Define authentic, verified reviews given by real students
        var reviewDefinitions = new[]
        {
            // Mathematics (Dr. Kyaw Swar)
            new {
                StudentEmail = "student1@tdms.local",
                Subject = "Mathematics",
                Rating = 5,
                Comment = "Dr. Kyaw Swar explained Calculus and linear algebra with remarkable clarity! My grades improved from a C to an A in just two months.",
                DaysAgo = 14
            },
            new {
                StudentEmail = "student3@tdms.local",
                Subject = "Mathematics",
                Rating = 5,
                Comment = "Excellent mathematics mentor. Helped me build solid foundational knowledge in discrete math and coordinate geometry for computer science.",
                DaysAgo = 10
            },
            new {
                StudentEmail = "student5@tdms.local",
                Subject = "Mathematics",
                Rating = 5,
                Comment = "Very patient and structured with my child's middle school geometry curriculum. Always punctual and supportive.",
                DaysAgo = 7
            },
            new {
                StudentEmail = "student8@tdms.local",
                Subject = "Mathematics",
                Rating = 4,
                Comment = "Strong conceptual focus and well-prepared lesson plans. My son is much more confident in his weekly algebra quizzes now.",
                DaysAgo = 3
            },

            // Physics (Daw Thida Win)
            new {
                StudentEmail = "student1@tdms.local",
                Subject = "Physics",
                Rating = 5,
                Comment = "Her mechanics demonstrations and step-by-step problem solving methods are top-notch. She really cares about student progress.",
                DaysAgo = 12
            },
            new {
                StudentEmail = "student6@tdms.local",
                Subject = "Physics",
                Rating = 5,
                Comment = "Thermodynamics and electromagnetism used to be intimidating, but Daw Thida made them intuitive and easy to understand.",
                DaysAgo = 8
            },
            new {
                StudentEmail = "student10@tdms.local",
                Subject = "Physics",
                Rating = 4,
                Comment = "Great preparation for matriculation and IGCSE board exams. Thorough homework feedback and friendly demeanor.",
                DaysAgo = 2
            },

            // Chemistry (U Aung Myo)
            new {
                StudentEmail = "student2@tdms.local",
                Subject = "Chemistry",
                Rating = 5,
                Comment = "Helped me understand organic chemistry reaction mechanisms effortlessly. His mnemonic techniques for the periodic table are fantastic!",
                DaysAgo = 15
            },
            new {
                StudentEmail = "student6@tdms.local",
                Subject = "Chemistry",
                Rating = 4,
                Comment = "Solid physical chemistry educator with very practical problem solving drills and laboratory safety insights.",
                DaysAgo = 9
            },
            new {
                StudentEmail = "student10@tdms.local",
                Subject = "Chemistry",
                Rating = 5,
                Comment = "Exam-oriented revision notes and formula sheets made preparing for university entrance exams smooth and stress-free.",
                DaysAgo = 4
            },

            // Biology (Dr. Hla Hla Moe)
            new {
                StudentEmail = "student2@tdms.local",
                Subject = "Biology",
                Rating = 5,
                Comment = "Passionate doctor and educator! She uses 3D diagrams and clinical cases that make human physiology unforgettable.",
                DaysAgo = 16
            },
            new {
                StudentEmail = "student4@tdms.local",
                Subject = "Biology",
                Rating = 5,
                Comment = "Outstanding teacher for medical entrance preparation and genetics chapters. Clear explanations and high dedication.",
                DaysAgo = 11
            },
            new {
                StudentEmail = "student7@tdms.local",
                Subject = "Biology",
                Rating = 5,
                Comment = "Her human anatomy breakdown is brilliant. Always available to answer complex questions patiently.",
                DaysAgo = 5
            },

            // English Language (Daw May Zin)
            new {
                StudentEmail = "student4@tdms.local",
                Subject = "English Language",
                Rating = 5,
                Comment = "Targeted IELTS speaking and academic writing practice helped me score 7.5! Truly an exceptional and encouraging coach.",
                DaysAgo = 18
            },
            new {
                StudentEmail = "student5@tdms.local",
                Subject = "English Language",
                Rating = 5,
                Comment = "Kind and encouraging language instructor. My daughter's vocabulary, pronunciation, and essay structure improved remarkably.",
                DaysAgo = 13
            },
            new {
                StudentEmail = "student9@tdms.local",
                Subject = "English Language",
                Rating = 5,
                Comment = "Great interactive sessions for professional writing and fluent conversational communication. Highly recommended!",
                DaysAgo = 6
            },

            // Computer Science (U Min Thein)
            new {
                StudentEmail = "student3@tdms.local",
                Subject = "Computer Science",
                Rating = 5,
                Comment = "Practical coding sessions with Python and C# were extremely helpful for my university assignments and algorithms coursework.",
                DaysAgo = 14
            },
            new {
                StudentEmail = "student9@tdms.local",
                Subject = "Computer Science",
                Rating = 5,
                Comment = "High-level guidance on data structures, system design, and Git workflow. An industry professional who knows how to teach.",
                DaysAgo = 7
            },
            new {
                StudentEmail = "student6@tdms.local",
                Subject = "Computer Science",
                Rating = 5,
                Comment = "Clear code reviews and patience when debugging tricky edge cases. Learned modern full-stack development in just a few sessions.",
                DaysAgo = 1
            }
        };

        bool anyReviewAdded = false;
        foreach (var def in reviewDefinitions)
        {
            if (!studentByEmail.TryGetValue(def.StudentEmail, out var student)) continue;
            if (!tutorBySubject.TryGetValue(def.Subject, out var tutor)) continue;

            var existing = await _context.Reviews
                .FirstOrDefaultAsync(r => r.TutorProfileId == tutor.Id && r.LearnerUserId == student.Id);

            if (existing == null)
            {
                _context.Reviews.Add(new Review
                {
                    LearnerUserId = student.Id,
                    TutorProfileId = tutor.Id,
                    StarRating = def.Rating,
                    Comment = def.Comment,
                    CreatedAt = DateTime.UtcNow.AddDays(-def.DaysAgo)
                });
                anyReviewAdded = true;
            }
        }

        if (anyReviewAdded)
        {
            await _context.SaveChangesAsync();
        }

        // Dynamically recalculate each tutor's rolling rating & review count directly from the Reviews table
        foreach (var tutor in tutors)
        {
            var tutorRatings = await _context.Reviews
                .Where(r => r.TutorProfileId == tutor.Id)
                .Select(r => r.StarRating)
                .ToListAsync();

            if (tutorRatings.Count > 0)
            {
                tutor.TotalReviewsCount = tutorRatings.Count;
                tutor.AverageRating = Math.Round((decimal)tutorRatings.Average(), 2);
            }
            else
            {
                tutor.TotalReviewsCount = 0;
                tutor.AverageRating = 0.00m;
            }
        }

        await _context.SaveChangesAsync();
    }

    private async Task SeedDefaultSubscriptionPaymentsAsync()
    {
        if (await _context.SubscriptionPayments.AnyAsync()) return;

        var physicsTutor = await _context.TutorProfiles
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.User.Email == "tutor.physics@tdms.local");

        var chemistryTutor = await _context.TutorProfiles
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.User.Email == "tutor.chemistry@tdms.local");

        var mathTutor = await _context.TutorProfiles
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.User.Email == "tutor.math@tdms.local");

        var biologyTutor = await _context.TutorProfiles
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.User.Email == "tutor.biology@tdms.local");

        var masterPackage = await _context.SubscriptionPackages
            .FirstOrDefaultAsync(p => p.TierName == "Master Tutor");

        var proPackage = await _context.SubscriptionPackages
            .FirstOrDefaultAsync(p => p.TierName == "Pro Educator");

        var opsUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == "ops@tdms.local");

        var sampleScreenshot = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

        if (mathTutor != null && masterPackage != null)
        {
            _context.SubscriptionPayments.Add(new SubscriptionPayment
            {
                TutorProfileId = mathTutor.Id,
                SubscriptionPackageId = masterPackage.Id,
                Amount = masterPackage.DisplayFee,
                PaymentMethod = "KBZPay",
                TransactionLast6 = "554433",
                ScreenshotUrl = sampleScreenshot,
                Notes = "Annual subscription payment for Master Tutor package verified via KBZPay QR code.",
                Status = "Confirmed",
                ReviewedByUserId = opsUser?.Id,
                ReviewedAt = DateTime.UtcNow.AddDays(-10),
                CreatedAt = DateTime.UtcNow.AddDays(-10)
            });
            mathTutor.CurrentSubscriptionPackageId = masterPackage.Id;
            mathTutor.SubscriptionUpdatedAt = DateTime.UtcNow.AddDays(-10);
        }

        if (biologyTutor != null && proPackage != null)
        {
            _context.SubscriptionPayments.Add(new SubscriptionPayment
            {
                TutorProfileId = biologyTutor.Id,
                SubscriptionPackageId = proPackage.Id,
                Amount = proPackage.DisplayFee,
                PaymentMethod = "AYAPay",
                TransactionLast6 = "778899",
                ScreenshotUrl = sampleScreenshot,
                Notes = "Pro Educator subscription renewal via AYA Pay.",
                Status = "Confirmed",
                ReviewedByUserId = opsUser?.Id,
                ReviewedAt = DateTime.UtcNow.AddDays(-3),
                CreatedAt = DateTime.UtcNow.AddDays(-3)
            });
            biologyTutor.CurrentSubscriptionPackageId = proPackage.Id;
            biologyTutor.SubscriptionUpdatedAt = DateTime.UtcNow.AddDays(-3);
        }

        if (physicsTutor != null && masterPackage != null)
        {
            _context.SubscriptionPayments.Add(new SubscriptionPayment
            {
                TutorProfileId = physicsTutor.Id,
                SubscriptionPackageId = masterPackage.Id,
                Amount = masterPackage.DisplayFee,
                PaymentMethod = "KBZPay",
                TransactionLast6 = "892145",
                ScreenshotUrl = sampleScreenshot,
                Notes = "Transferred 90,000 MMK from Daw Thida Win KBZPay account for 3-month Master tier.",
                Status = "Pending",
                CreatedAt = DateTime.UtcNow.AddHours(-3)
            });
        }

        if (chemistryTutor != null && proPackage != null)
        {
            _context.SubscriptionPayments.Add(new SubscriptionPayment
            {
                TutorProfileId = chemistryTutor.Id,
                SubscriptionPackageId = proPackage.Id,
                Amount = proPackage.DisplayFee,
                PaymentMethod = "WavePay",
                TransactionLast6 = "112233",
                ScreenshotUrl = sampleScreenshot,
                Notes = "Upgrade to Pro tier requested.",
                Status = "Rejected",
                RejectionReason = "Transaction ID 112233 was not found in our WavePay merchant statement. Please verify your receipt slip and resubmit.",
                ReviewedByUserId = opsUser?.Id,
                ReviewedAt = DateTime.UtcNow.AddDays(-1),
                CreatedAt = DateTime.UtcNow.AddDays(-2)
            });
        }

        await _context.SaveChangesAsync();
    }
}
