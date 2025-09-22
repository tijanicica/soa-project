using Ocelot.DependencyInjection;
using Ocelot.Middleware;
using Ocelot.Provider.Eureka;

var builder = WebApplication.CreateBuilder(args);

// ucitava konfig iz ocelot json
builder.Configuration.AddJsonFile("ocelot.json", optional: false, reloadOnChange: true);

// registracija servisa preko eureke
builder.Services.AddOcelot().AddEureka();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:3000") 
            .AllowAnyHeader()  // Dozvoli sve headere (npr. Authorization, Content-Type)
            .AllowAnyMethod()
            .AllowCredentials(); //cookies i authorization header
    });
});

var app = builder.Build();

app.UseCors();

// aktiviramo ocelot
await app.UseOcelot();

app.Run();