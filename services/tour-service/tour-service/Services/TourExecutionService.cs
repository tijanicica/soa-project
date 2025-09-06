using MongoDB.Driver;
using tour_service.Models;
using PurchaseService; // gRPC klijent
using Geolocation; // Potreban paket: dotnet add package Geolocation.NetStandard

namespace tour_service.Services;

public class TourExecutionService
{
    private readonly IMongoCollection<TourExecution> _executionsCollection;
    private readonly IMongoCollection<Tour> _toursCollection;
    private readonly PurchaseVerification.PurchaseVerificationClient _purchaseClient; // gRPC klijent

    public TourExecutionService(IMongoClient mongoClient, string dbName, PurchaseVerification.PurchaseVerificationClient purchaseClient)
    {
        var database = mongoClient.GetDatabase(dbName);
        _executionsCollection = database.GetCollection<TourExecution>("tourExecutions");
        _toursCollection = database.GetCollection<Tour>("tours");
        _purchaseClient = purchaseClient;
    }

    public async Task<TourExecution> StartTourAsync(string tourId, long touristId, Position startPosition)
    {
        // 1. Proveri da li je tura kupljena (RPC POZIV)
        var purchaseCheckRequest = new PurchaseCheckRequest { TouristId = touristId, TourId = tourId };
        var purchaseResponse = await _purchaseClient.HasUserPurchasedTourAsync(purchaseCheckRequest);

        if (!purchaseResponse.HasPurchased)
        {
            throw new UnauthorizedAccessException("You have not purchased this tour.");
        }

        // 2. Proveri da li već postoji aktivna sesija za ovu turu
        var existingExecution = await _executionsCollection.Find(e => e.TourId == tourId && e.TouristId == touristId && e.Status == "active").FirstOrDefaultAsync();
        if (existingExecution != null)
        {
            return existingExecution; // Vrati postojeću sesiju
        }

        // 3. Kreiraj novu sesiju
        var newExecution = new TourExecution
        {
            TourId = tourId,
            TouristId = touristId,
            Status = "active",
            StartTime = DateTime.UtcNow,
            LastActivityTime = DateTime.UtcNow,
            CurrentPosition = startPosition
        };

        await _executionsCollection.InsertOneAsync(newExecution);
        return newExecution;
    }
    
    public async Task<TourExecution?> UpdatePositionAsync(string executionId, long touristId, Position newPosition)
    {
        var execution = await _executionsCollection.Find(e => e.Id == executionId && e.TouristId == touristId).FirstOrDefaultAsync();
        if (execution == null || execution.Status != "active")
        {
            return null; // Sesija ne postoji ili nije aktivna
        }

        var tour = await _toursCollection.Find(t => t.Id == execution.TourId).FirstOrDefaultAsync();
        if (tour == null) return null;

        // Pronađi sledeću ključnu tačku koju treba posetiti
        var nextKeyPoint = tour.KeyPoints.FirstOrDefault(kp => !execution.CompletedKeyPoints.Any(ckp => ckp.KeyPointId == kp.Id));

        if (nextKeyPoint != null)
        {
            // Izračunaj udaljenost (Haversine formula)
            var distance = GeoCalculator.GetDistance(
                newPosition.Latitude, newPosition.Longitude,
                nextKeyPoint.Latitude, nextKeyPoint.Longitude, 
                decimalPlaces: 1, DistanceUnit.Meters);

            // Ako je korisnik na manje od 50 metara, smatramo da je posetio tačku
            if (distance < 50)
            {
                execution.CompletedKeyPoints.Add(new CompletedKeyPoint
                {
                    KeyPointId = nextKeyPoint.Id,
                    CompletionTime = DateTime.UtcNow
                });

                // Ako su sve tačke završene, kompletiraj turu
                if (execution.CompletedKeyPoints.Count == tour.KeyPoints.Count)
                {
                    execution.Status = "completed";
                    execution.EndTime = DateTime.UtcNow;
                }
            }
        }

        // Ažuriraj poziciju i vreme poslednje aktivnosti
        execution.CurrentPosition = newPosition;
        execution.LastActivityTime = DateTime.UtcNow;
        
        await _executionsCollection.ReplaceOneAsync(e => e.Id == execution.Id, execution);
        return execution;
    }


    public async Task<TourExecution?> AbandonTourAsync(string executionId, long touristId)
    {
        var filter = Builders<TourExecution>.Filter.Where(e => e.Id == executionId && e.TouristId == touristId);
        var update = Builders<TourExecution>.Update
            .Set(e => e.Status, "abandoned")
            .Set(e => e.EndTime, DateTime.UtcNow);

        var options = new FindOneAndUpdateOptions<TourExecution> { ReturnDocument = ReturnDocument.After };
        
        return await _executionsCollection.FindOneAndUpdateAsync(filter, update, options);
    }
    
     public async Task<TourExecution?> GetExecutionAsync(string executionId, long touristId)
    {
        return await _executionsCollection.Find(e => e.Id == executionId && e.TouristId == touristId).FirstOrDefaultAsync();
    }
}