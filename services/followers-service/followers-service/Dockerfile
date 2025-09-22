# Build faza
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["services/followers-service/followers-service/followers-service.csproj", "services/followers-service/followers-service/"]

RUN dotnet restore "services/followers-service/followers-service/followers-service.csproj"

# 3. Kopiraj ostatak koda
COPY . .

# 4. Publish aplikaciju
WORKDIR "/src/services/followers-service/followers-service"
RUN dotnet publish "followers-service.csproj" -c Release -o /app/publish /p:UseAppHost=false


# Finalna faza
FROM mcr.microsoft.com/dotnet/aspnet:8.0
USER root
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
USER app

WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "followers-service.dll"]