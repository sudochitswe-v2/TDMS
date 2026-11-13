using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using TDMS.Api.Abstructions;
using TDMS.Api.Database;
using TDMS.Api.Database.Inteceptor;
using TDMS.Api.Features.Account;
using TDMS.Api.Features.Administration;
using TDMS.Api.Features.Auth;
using TDMS.Api.Features.Inquiries;
using TDMS.Api.Features.Messaging;
using TDMS.Api.Features.Operations;
using TDMS.Api.Features.Reviews;
using TDMS.Api.Features.Tutors;

namespace TDMS.Api;

public static class DependicyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
    {
        // 1. Interceptors & DB Context
        services.AddSingleton<AuditableEntityInterceptor>();

        var connectionString = configuration.GetConnectionString("DefaultConnection") ??
                               "Server=localhost;Database=tdms_db;User=root;Password=;";

        services.AddDbContext<AppDbContext>((sp, options) =>
        {
            var interceptor = sp.GetRequiredService<AuditableEntityInterceptor>();
            options.AddInterceptors(interceptor);

            // In-memory or MySQL
            if (connectionString.StartsWith("InMemory:", StringComparison.OrdinalIgnoreCase))
            {
                var dbName = connectionString.Split(':')[1];
                options.UseInMemoryDatabase(dbName);
            }
            else
            {
                options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString));
            }
        });

        // 2. Seeding Service
        services.AddScoped<DatabaseSeedService>();

        // 3. User & Auth Context
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUser, CurrentUser>();
        services.AddScoped<ITokenService, TokenService>();

        // 4. Feature Classes (Vertical Slices)
        // Account Features
        services.AddScoped<GetLearnerProfile>();
        services.AddScoped<UpdateLearnerProfile>();

        // Administration Features
        services.AddScoped<GetUsers>();
        services.AddScoped<UpdateUserStatus>();
        services.AddScoped<AssignUserRoles>();
        services.AddScoped<GetRoles>();
        services.AddScoped<CreateRole>();
        services.AddScoped<UpdateRoleClaims>();
        services.AddScoped<GetSystemData>();
        services.AddScoped<GetSettings>();
        services.AddScoped<UpdateSettings>();
        services.AddScoped<PerformDatabaseMaintenance>();

        // Auth Features
        services.AddScoped<Login>();
        services.AddScoped<RegisterLearner>();
        services.AddScoped<RegisterTutor>();
        services.AddScoped<GetCurrentUser>();

        // Inquiry Features
        services.AddScoped<CreateInquiry>();
        services.AddScoped<GetInquiries>();
        services.AddScoped<RespondInquiry>();

        // Messaging Features
        services.AddScoped<SendMessage>();
        services.AddScoped<GetMessages>();

        // Operations Features
        services.AddScoped<GetPendingTutors>();
        services.AddScoped<VerifyTutor>();
        services.AddScoped<GetCategories>();
        services.AddScoped<CreateCategory>();
        services.AddScoped<UpdateCategory>();
        services.AddScoped<DeleteCategory>();
        services.AddScoped<GetSubscriptions>();
        services.AddScoped<CreateSubscriptionPackage>();
        services.AddScoped<UpdateSubscriptionPackage>();
        services.AddScoped<GetPaymentInfo>();
        services.AddScoped<SelectSubscriptionPackage>();
        services.AddScoped<PurchaseSubscription>();
        services.AddScoped<GetMyPayments>();
        services.AddScoped<GetOperationsPayments>();
        services.AddScoped<ConfirmSubscriptionPayment>();
        services.AddScoped<RejectSubscriptionPayment>();
        services.AddScoped<GetOperationsReport>();

        // Review Features
        services.AddScoped<GetTutorReviews>();
        services.AddScoped<SubmitReview>();
        services.AddScoped<UpdateReview>();
        services.AddScoped<GetMyReviews>();

        // Tutor Features
        services.AddScoped<SearchTutors>();
        services.AddScoped<GetTutorById>();
        services.AddScoped<GetMyTutorProfile>();
        services.AddScoped<UpdateTeachingInfo>();
        services.AddScoped<UpdateCustomization>();
        services.AddScoped<UpdateProfilePicture>();
        services.AddScoped<UploadTutorDocument>();
        services.AddScoped<DeleteTutorDocument>();
        services.AddScoped<ReverifyTutor>();

        // 5. Swappable Firebase Messaging Plugin
        var firebaseDatabaseUrl = configuration["Firebase:DatabaseUrl"];
        if (!string.IsNullOrWhiteSpace(firebaseDatabaseUrl))
        {
            services.AddHttpClient<IFirebaseMessagingService, FirebaseRealtimeMessagingService>();
        }
        else
        {
            services.AddSingleton<IFirebaseMessagingService, MockFirebaseMessagingService>();
        }

        // 6. JWT Authentication
        var jwtKey = configuration["Jwt:Key"] ?? "TDMS_Super_Secret_Jwt_Security_Key_For_Claims_And_RBAC_Authorization_2026_!";
        var issuer = configuration["Jwt:Issuer"] ?? "TDMS.Api";
        var audience = configuration["Jwt:Audience"] ?? "TDMS.Spa";

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = false;
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                ValidateIssuer = true,
                ValidIssuer = issuer,
                ValidateAudience = true,
                ValidAudience = audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };
        });

        // 7. Dynamic Policy Registration (PBAC via Claims & RBAC)
        services.AddSingleton<IAuthorizationHandler, PermissionAuthorizationHandler>();

        services.AddAuthorization(options =>
        {
            // Register all resource action policies
            foreach (var perm in ResourceNames.AllPermissions)
            {
                options.AddPolicy(perm, policy => policy.Requirements.Add(new PermissionRequirement(perm)));
            }

            // Register all UI control policies
            foreach (var uiControl in UIControlNames.All)
            {
                options.AddPolicy(uiControl, policy => policy.Requirements.Add(new PermissionRequirement(uiControl)));
            }
        });

        // 8. Swagger Documentation with JWT Bearer
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "TDMS API (Student-Tutor Discovery and Matching System)",
                Version = "v1",
                Description = ".NET 10 Vertical Slice REST API with PBAC Authorization"
            });

            c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = SecuritySchemeType.ApiKey,
                Scheme = "Bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "Enter JWT Bearer token format: Bearer {token}"
            });

            c.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });
        });

        return services;
    }
}
