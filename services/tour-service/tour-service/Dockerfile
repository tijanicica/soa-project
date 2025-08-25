FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY *.csproj .
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0

USER root
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
USER app

WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "tour-service.dll"]