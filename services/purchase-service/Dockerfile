FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["services/purchase-service/purchase-service.csproj", "services/purchase-service/"]
COPY ["protos/purchase.proto", "protos/"]
RUN dotnet restore "services/purchase-service/purchase-service.csproj"


COPY . .


WORKDIR "/src/services/purchase-service"
RUN dotnet publish "purchase-service.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0

USER root
RUN apt-get update && apt-get install -y curl wget && rm -rf /var/lib/apt/lists/*
USER app


WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "purchase-service.dll"]