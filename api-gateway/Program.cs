using Ocelot.DependencyInjection;
using Ocelot.Middleware;
using Ocelot.Provider.Eureka;

var builder = WebApplication.CreateBuilder(args);

// 1. Kazemo aplikaciji da ucita konfiguraciju iz tvog ocelot.json fajla
builder.Configuration.AddJsonFile("ocelot.json", optional: false, reloadOnChange: true);

// 2. Registrujemo Ocelot servise i kazemo mu da koristi Eureku za pronalazenje drugih servisa
builder.Services.AddOcelot().AddEureka();

var app = builder.Build();

// 3. Aktiviramo Ocelot. Od ovog trenutka, Ocelot preuzima kontrolu nad svim dolaznim zahtevima.
await app.UseOcelot();

app.Run();