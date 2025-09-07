
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Amazon.S3;
using Amazon.S3.Util;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using Steeltoe.Discovery.Client;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using OpenTelemetry.Exporter;
using tour_service.Services;
using PurchaseService;

var builder = WebApplication.CreateBuilder(args);

// === POČETAK OBSERVABILITY KONFIGURACIJE ===

// 1. Definiši ime servisa. Čitamo ga iz docker-compose.yml
var serviceName = builder.Configuration["SERVICE_NAME"] ?? "tour-service";
var serviceVersion = "1.0.0";

builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource => resource.AddService(
        serviceName: serviceName,
        serviceVersion: serviceVersion,
        serviceInstanceId: Environment.MachineName))
    
    // 2. Konfiguracija za TRACING sa eksplicitnim Jaeger endpointom
    .WithTracing(tracing => tracing
        .AddGrpcClientInstrumentation()
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

builder.Services.AddGrpcClient<PurchaseVerification.PurchaseVerificationClient>(o =>
    {
        // Sada se povezujemo na HTTPS port
        o.Address = new Uri("https://purchase-service:8006"); 
    })
    .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
    {
        // Ovo je ključno: kažemo klijentu da veruje self-signed dev sertifikatu
        ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
    });


builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigin",
        builder => builder.WithOrigins("http://localhost:3000") // Dozvoli zahteve sa frontenda
                           .AllowAnyHeader()
                           .AllowAnyMethod()
                           .AllowCredentials());
});


var databaseSettings = builder.Configuration.GetSection("DatabaseSettings");
var connectionString = builder.Configuration.GetConnectionString("TourDatabase");
builder.Services.AddSingleton<IMongoClient>(sp => new MongoClient(connectionString));
builder.Services.AddSingleton<TourService>(sp =>
{
    var client = sp.GetRequiredService<IMongoClient>();

    var dbName = databaseSettings["DatabaseName"];
    return new TourService(client, dbName);
});

builder.Services.AddSingleton<TourExecutionService>(sp =>
{
    var mongoClient = sp.GetRequiredService<IMongoClient>();
    var purchaseGrpcClient = sp.GetRequiredService<PurchaseVerification.PurchaseVerificationClient>();
    
    var dbName = builder.Configuration.GetSection("DatabaseSettings")["DatabaseName"];
    
    return new TourExecutionService(mongoClient, dbName, purchaseGrpcClient);
});


builder.Services.AddSingleton<IAmazonS3>(sp => {
    var config = sp.GetRequiredService<IConfiguration>();
    var s3Config = new AmazonS3Config
    {
        ServiceURL = config["Minio:Endpoint"],
        ForcePathStyle = true
    };
    return new AmazonS3Client(config["Minio:AccessKey"], config["Minio:SecretKey"], s3Config);
});


var jwtKey = builder.Configuration["JwtKey"];
if (string.IsNullOrEmpty(jwtKey))
{
    throw new InvalidOperationException("JWT Key is not configured.");
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



builder.Services.AddAuthorization();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddDiscoveryClient(builder.Configuration);

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var s3Client = scope.ServiceProvider.GetRequiredService<IAmazonS3>();
    var bucketName = builder.Configuration["Minio:BucketName"];
    if (!await AmazonS3Util.DoesS3BucketExistV2Async(s3Client, bucketName))
    {
        await s3Client.PutBucketAsync(bucketName);
    }
}


if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowSpecificOrigin");

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
app.MapPrometheusScrapingEndpoint().AllowAnonymous();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "UP" }));
app.Run();