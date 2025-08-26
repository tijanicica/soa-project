

using Amazon.S3;
using Amazon.S3.Util;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using Steeltoe.Discovery.Client;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using tour_service.Services;

var builder = WebApplication.CreateBuilder(args);


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
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "UP" }));
app.Run();