# Build faza
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["services/tour-service/tour-service/tour-service.csproj", "services/tour-service/tour-service/"]
COPY ["protos/purchase.proto", "protos/"]

RUN dotnet restore "services/tour-service/tour-service/tour-service.csproj"

COPY . .

WORKDIR "/src/services/tour-service/tour-service"
RUN dotnet publish "tour-service.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0

USER root
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
USER app

WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "tour-service.dll"]