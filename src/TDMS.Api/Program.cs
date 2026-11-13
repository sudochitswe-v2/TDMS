using TDMS.Api;
using TDMS.Api.Database;
using TDMS.Api.Features.Account;
using TDMS.Api.Features.Administration;
using TDMS.Api.Features.Auth;
using TDMS.Api.Features.Inquiries;
using TDMS.Api.Features.Messaging;
using TDMS.Api.Features.Operations;
using TDMS.Api.Features.Reviews;
using TDMS.Api.Features.Tutors;

var builder = WebApplication.CreateBuilder(args);

// Register Application Services (DB, Auth, PBAC Policies, Firebase, Swagger)
builder.Services.AddApplicationServices(builder.Configuration);

// CORS for local SPA development
builder.Services.AddCors(options =>
{
    options.AddPolicy("SpaCorsPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Auto-seed database (SystemAdmin, default roles, default admin user, categories, packages, settings)
using (var scope = app.Services.CreateScope())
{
    var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeedService>();
    try
    {
        await seeder.SeedAsync();
    }
    catch (Exception ex)
    {
        app.Logger.LogWarning(ex, "Database seeding warning: {Message}", ex.Message);
    }
}

// Configure HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "TDMS API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseCors("SpaCorsPolicy");
app.UseAuthentication();
app.UseAuthorization();

// Serve SPA static files from wwwroot/dist or wwwroot (per AGENTS.md)
var distPath = Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "dist");
if (Directory.Exists(distPath))
{
    var fileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(distPath);
    app.UseDefaultFiles(new DefaultFilesOptions { FileProvider = fileProvider });
    app.UseStaticFiles(new StaticFileOptions { FileProvider = fileProvider });
}
else
{
    app.UseDefaultFiles();
    app.UseStaticFiles();
}

// Map Vertical Slice Endpoints
app.MapAuthEndpoints();
app.MapAccountEndpoints();
app.MapTutorEndpoints();
app.MapInquiryEndpoints();
app.MapMessagingEndpoints();
app.MapReviewEndpoints();
app.MapOperationEndpoints();
app.MapAdminEndpoints();

// SPA fallback routing
if (Directory.Exists(distPath))
{
    var fileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(distPath);
    app.MapFallbackToFile("index.html", new StaticFileOptions { FileProvider = fileProvider });
}
else
{
    app.MapFallbackToFile("index.html");
}

app.Run();

// Required for WebApplicationFactory in integration tests
public partial class Program { }
