# Koristimo .NET 8.0 SDK za build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Kopiraj SVE odjednom (i .csproj i .cs fajlove)
COPY . .

# Pokreni restore I publish u jednom koraku.
# Ovo osigurava da publish vidi pakete koje je restore upravo preuzeo.
RUN dotnet restore
RUN dotnet publish -c Release -o /app/publish


# Koristimo .NET 8.0 Runtime za izvršavanje
FROM mcr.microsoft.com/dotnet/aspnet:8.0

# Instaliraj curl za healthcheck
USER root
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
USER app

WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "tour-service.dll"]