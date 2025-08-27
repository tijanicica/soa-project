using followers_service.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Neo4j.Driver;
using Steeltoe.Discovery.Client;
using System.Text;


var builder = WebApplication.CreateBuilder(args);

// --- Konfiguracija Neo4j ---
builder.Services.AddSingleton<IDriver>(provider =>
{
    var configuration = provider.GetRequiredService<IConfiguration>();
    var uri = configuration["Neo4j:Uri"];
    var user = configuration["Neo4j:Username"];
    var password = configuration["Neo4j:Password"];
    return GraphDatabase.Driver(uri, AuthTokens.Basic(user, password));
});

// Registrujemo naš servisni sloj
builder.Services.AddScoped<IFollowerService, FollowerService>();

// --- Konfiguracija Autentifikacije ---
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
        ValidateIssuer = false, // U mikroservisima, issuer se često ne validira
        ValidateAudience = false, // Niti audience
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



var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var driver = scope.ServiceProvider.GetRequiredService<IDriver>();
    await using var session = driver.AsyncSession();
    
    // Uvek brišemo sve postojeće podatke da bismo krenuli od čistog stanja
    await session.ExecuteWriteAsync(async tx => await tx.RunAsync("MATCH (n) DETACH DELETE n"));
    
    await session.ExecuteWriteAsync(async tx =>
    {
        // Kreiramo čvorove za sve nove korisnike da bismo bili sigurni da postoje
        // Ovo nije strogo neophodno jer MERGE kreira čvorove, ali je dobra praksa
        await tx.RunAsync(@"
            UNWIND range(3, 14) AS userId
            MERGE (:User {userId: userId})
        ");

        // --- Kreiramo veze praćenja ---

        // Mika (3) prati Anu (4)
        await tx.RunAsync("MATCH (u1:User {userId: 3}), (u2:User {userId: 4}) MERGE (u1)-[:FOLLOWS]->(u2)");

        // Ana (4) prati Marka (5)
        await tx.RunAsync("MATCH (u1:User {userId: 4}), (u2:User {userId: 5}) MERGE (u1)-[:FOLLOWS]->(u2)");
        
        // Ana (4) prati i Jelenu (6)
        await tx.RunAsync("MATCH (u1:User {userId: 4}), (u2:User {userId: 6}) MERGE (u1)-[:FOLLOWS]->(u2)");
        
        // Marko (5) prati Nikolu (7)
        await tx.RunAsync("MATCH (u1:User {userId: 5}), (u2:User {userId: 7}) MERGE (u1)-[:FOLLOWS]->(u2)");

        // Dodajmo još par nasumičnih veza za bogatiji graf
        // Jelena (6) prati Milicu (10)
        await tx.RunAsync("MATCH (u1:User {userId: 6}), (u2:User {userId: 10}) MERGE (u1)-[:FOLLOWS]->(u2)");
        
        // Stefan (8) prati Miku (3)
        await tx.RunAsync("MATCH (u1:User {userId: 8}), (u2:User {userId: 3}) MERGE (u1)-[:FOLLOWS]->(u2)");
    });

    Console.WriteLine("Neo4j database seeded with new follower relationships.");
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Dodaj middleware za autentikaciju i autorizaciju
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "UP" }));

app.Run();