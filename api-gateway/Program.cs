using Ocelot.DependencyInjection;
using Ocelot.Middleware;
using Ocelot.Provider.Eureka;

var builder = WebApplication.CreateBuilder(args);

// 1. Kazemo aplikaciji da ucita konfiguraciju iz tvog ocelot.json fajla
builder.Configuration.AddJsonFile("ocelot.json", optional: false, reloadOnChange: true);

// 2. Registrujemo Ocelot servise i kazemo mu da koristi Eureku za pronalazenje drugih servisa
builder.Services.AddOcelot().AddEureka();

builder.Services.AddCors(options =>
{
    // Definišemo "default" politiku
    options.AddDefaultPolicy(policy =>
    {
        // Dozvoli zahteve samo sa adrese tvog frontenda
        policy.WithOrigins("http://localhost:3000") 
            .AllowAnyHeader()  // Dozvoli sve headere (npr. Authorization, Content-Type)
            .AllowAnyMethod()  // Dozvoli sve HTTP metode (GET, POST, DELETE, itd.)
            .AllowCredentials(); // Dozvoli slanje kolačića i Authorization headera
    });
});

var app = builder.Build();

app.UseCors();

// 3. Aktiviramo Ocelot. Od ovog trenutka, Ocelot preuzima kontrolu nad svim dolaznim zahtevima.
await app.UseOcelot();

app.Run();