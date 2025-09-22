using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using followers_service.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Neo4j.Driver;
using Steeltoe.Discovery.Client;
using System.Text;
using followers_service.Models;
using OpenTelemetry.Exporter;


var builder = WebApplication.CreateBuilder(args);

// OBSERVABILITY

var serviceName = builder.Configuration["SERVICE_NAME"] ?? "tour-service";
var serviceVersion = "1.0.0";

builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource => resource.AddService(
        serviceName: serviceName,
        serviceVersion: serviceVersion,
        serviceInstanceId: Environment.MachineName))
    
    // Tracing Jagger
    .WithTracing(tracing => tracing
        
        .AddAspNetCoreInstrumentation(options =>
        {
            options.Filter = (httpContext) => !httpContext.Request.Path.Value?.Contains("/health") ?? true;
        })
        .AddHttpClientInstrumentation()
        .AddJaegerExporter(options =>
        {
            options.Endpoint = new Uri("http://jaeger:14268/api/traces");
            options.Protocol = JaegerExportProtocol.HttpBinaryThrift;
        }))
        
    // Metrike
    .WithMetrics(metrics => metrics
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddPrometheusExporter());


// Baza Neo4j
builder.Services.AddSingleton<IDriver>(provider =>
{
    var configuration = provider.GetRequiredService<IConfiguration>();
    var uri = configuration["Neo4j:Uri"];
    var user = configuration["Neo4j:Username"];
    var password = configuration["Neo4j:Password"];
    return GraphDatabase.Driver(uri, AuthTokens.Basic(user, password));
});

builder.Services.AddScoped<IFollowerService, FollowerService>();

// Autentifikacija
var jwtKey = builder.Configuration["JwtKey"];
if (string.IsNullOrEmpty(jwtKey))
{
    throw new InvalidOperationException("JWT Key is not configured.");
}

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        // NameIdentifier se koristi za ID korisnika (claim "sub")
        NameClaimType = "sub" 
    };
});


builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddDiscoveryClient(builder.Configuration);
builder.Services.AddHttpClient();

var app = builder.Build();

await SeedDatabaseAsync(app);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();
app.Use(async (context, next) =>
{
    using var activity = System.Diagnostics.Activity.Current;
    if (activity != null)
    {
        activity.SetTag("service.name", serviceName);
        activity.SetTag("service.version", serviceVersion);
        activity.SetTag("http.request.method", context.Request.Method);
        activity.SetTag("http.request.path", context.Request.Path);
    }
    await next();
});
app.MapPrometheusScrapingEndpoint();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "UP" }));

app.Run();

async static Task SeedDatabaseAsync(IHost app)
{
    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        var logger = services.GetRequiredService<ILogger<Program>>();
        var httpClientFactory = services.GetRequiredService<IHttpClientFactory>();
        var configuration = services.GetRequiredService<IConfiguration>();
        var driver = services.GetRequiredService<IDriver>();

        try
        {
            logger.LogInformation("Starting database seeding...");
            
            // korisnici iz stakeholders servisa
            var stakeholdersUrl = configuration["ServiceUrls:Stakeholders"];
            var client = httpClientFactory.CreateClient();
            var response = await client.GetAsync($"{stakeholdersUrl}/api/users");
            response.EnsureSuccessStatusCode();

            var usersFromStakeholders = await response.Content.ReadFromJsonAsync<List<StakeholderUserDto>>();

            if (usersFromStakeholders == null || !usersFromStakeholders.Any())
            {
                logger.LogWarning("No users fetched from stakeholders-service. Seeding nodes will be skipped.");
                return;
            }

            // popunjavamo bazu
            await using var session = driver.AsyncSession();
            await session.ExecuteWriteAsync(async tx => await tx.RunAsync("MATCH (n) DETACH DELETE n"));
            logger.LogInformation("Cleared existing data from Neo4j.");

            var usersToCreate = usersFromStakeholders.Select(u =>
                new Dictionary<string, object> { { "userId", u.Id }, { "role", u.Role } }
            ).ToList();

            await session.ExecuteWriteAsync(async tx =>
            {
                var query = @"
                    UNWIND $users AS userData
                    MERGE (u:User {userId: userData.userId})
                    SET u.role = userData.role";
                await tx.RunAsync(query, new { users = usersToCreate });
            });
            logger.LogInformation($"Successfully seeded {usersFromStakeholders.Count} users with roles into Neo4j.");

            await session.ExecuteWriteAsync(async tx =>
            {
                // Mika (3) prati Anu (4)
                await tx.RunAsync("MATCH (u1:User {userId: 3}), (u2:User {userId: 4}) MERGE (u1)-[:FOLLOWS]->(u2)");

                // Ana (4) prati Marka (5) <-- KLJUČNA VEZA
                await tx.RunAsync("MATCH (u1:User {userId: 4}), (u2:User {userId: 5}) MERGE (u1)-[:FOLLOWS]->(u2)");
    
                // Ana (4) prati i Jelenu (6) <-- KLJUČNA VEZA
                await tx.RunAsync("MATCH (u1:User {userId: 4}), (u2:User {userId: 6}) MERGE (u1)-[:FOLLOWS]->(u2)");
    
                // Marko (5) prati Nikolu (7)
                await tx.RunAsync("MATCH (u1:User {userId: 5}), (u2:User {userId: 7}) MERGE (u1)-[:FOLLOWS]->(u2)");

                // Jelena (6) prati Milicu (10)
                await tx.RunAsync("MATCH (u1:User {userId: 6}), (u2:User {userId: 10}) MERGE (u1)-[:FOLLOWS]->(u2)");
    
                // Stefan (8) prati Miku (3)
                await tx.RunAsync("MATCH (u1:User {userId: 8}), (u2:User {userId: 3}) MERGE (u1)-[:FOLLOWS]->(u2)");
            });
            logger.LogInformation("Neo4j database seeded with new follower relationships.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred during database seeding.");
            // Environment.Exit(1);
        }
    }
}
