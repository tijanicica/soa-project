using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using purchase_service.Data;
using Steeltoe.Discovery.Client;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using OpenTelemetry.Exporter;
using purchase_service.GrpcServices;
using purchase_service.Services;
using PurchaseService;

var builder = WebApplication.CreateBuilder(args);



// === POČETAK OBSERVABILITY KONFIGURACIJE ===


// 1. Definiši ime servisa. Čitamo ga iz docker-compose.yml
var serviceName = builder.Configuration["SERVICE_NAME"] ?? "purchase-service";
var serviceVersion = "1.0.0";

builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource => resource.AddService(
        serviceName: serviceName,
        serviceVersion: serviceVersion,
        serviceInstanceId: Environment.MachineName))
    
    // 2. Konfiguracija za TRACING sa eksplicitnim Jaeger endpointom
    .WithTracing(tracing => tracing
        .AddSource(serviceName)
        .AddAspNetCoreInstrumentation(options =>
        {
            // Filtriraj health check endpointe
            options.Filter = (httpContext) => !httpContext.Request.Path.Value?.Contains("/health") ?? true;
        })
        .AddHttpClientInstrumentation()
        .AddJaegerExporter(options =>
        {
            options.Endpoint = new Uri("http://jaeger:14268/api/traces");
            options.Protocol = JaegerExportProtocol.HttpBinaryThrift;
        }))
        
    // 3. Konfiguracija za METRIKE
    .WithMetrics(metrics => metrics
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddPrometheusExporter());
// === KRAJ OBSERVABILITY KONFIGURACIJE ===

builder.Services.AddGrpc();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigin",
        b => b.WithOrigins("http://localhost:3000")
               .AllowAnyHeader()
               .AllowAnyMethod()
               .AllowCredentials());
});

var connectionString = builder.Configuration.GetConnectionString("PurchaseDatabase");
builder.Services.AddDbContext<PurchaseDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));


builder.Services.AddHttpClient("TourService", client =>
{
    
    var tourServiceAddress = builder.Configuration["Services:TourServiceAddress"];
    Console.WriteLine($"--- DEBUG: Read TourServiceAddress as: '{tourServiceAddress}' ---");
    client.BaseAddress = new Uri(tourServiceAddress);
});


var jwtKey = builder.Configuration["JwtKey"];
if (string.IsNullOrEmpty(jwtKey))
{
    throw new InvalidOperationException("JWT Key nije konfigurisan.");
}
var key = Encoding.ASCII.GetBytes(jwtKey);

builder.Services.AddAuthentication(options =>
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
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false,
    };
});

builder.Services.AddScoped<purchase_service.Services.PurchaseService>();

builder.Services.AddAuthorization();
builder.Services.AddControllers()
    .AddJsonOptions(options => 
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = null;

        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddDiscoveryClient(builder.Configuration);




var app = builder.Build();



using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<PurchaseDbContext>();
    dbContext.Database.Migrate();
}



if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowSpecificOrigin"); 

app.UseRouting(); 

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();



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
app.MapPrometheusScrapingEndpoint().AllowAnonymous();
app.MapGrpcService<PurchaseVerificationService>();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "UP" }));
app.Run();