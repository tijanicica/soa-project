using MongoDB.Driver;
using tour_service.Models;

namespace tour_service.Services
{
    public class TourService
    {
        private readonly IMongoCollection<Tour> _toursCollection;

        public TourService(IMongoClient mongoClient, string databaseName)
        {
            var database = mongoClient.GetDatabase(databaseName);
            _toursCollection = database.GetCollection<Tour>("tours");
        }

        // Funkcija za kreiranje ture
        public async Task CreateTourAsync(Tour newTour)
        {
            await _toursCollection.InsertOneAsync(newTour);
        }

        // Kasnije dodaješ druge funkcije...
        // public async Task<Tour?> GetTourAsync(string id) =>
        //     await _toursCollection.Find(x => x.Id == id).FirstOrDefaultAsync();
    }
}
