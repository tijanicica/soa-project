using MongoDB.Driver;
using System.Threading.Tasks;
using tour_service.Models;

namespace tour_service.Services
{
    public class PositionService
    {
        private readonly IMongoCollection<TouristPosition> _positionsCollection;

        public PositionService(IMongoClient mongoClient, string databaseName)
        {
            var database = mongoClient.GetDatabase(databaseName);
            _positionsCollection = database.GetCollection<TouristPosition>("tourist-positions");
        }

        public async Task<TouristPosition> GetPositionAsync(long touristId)
        {
            var filter = Builders<TouristPosition>.Filter.Eq(p => p.TouristId, touristId);
            return await _positionsCollection.Find(filter).FirstOrDefaultAsync();
        }
        public async Task SetPositionAsync(long touristId, double latitude, double longitude)
        {
            var filter = Builders<TouristPosition>.Filter.Eq(p => p.TouristId, touristId);

            var update = Builders<TouristPosition>.Update
                .Set(p => p.Latitude, latitude)
                .Set(p => p.Longitude, longitude)
                .Set(p => p.LastUpdated, System.DateTime.UtcNow);

            // ReplaceOne sa "Upsert=true" će AŽURIRATI ako postoji, ili KREIRATI ako ne postoji.
            await _positionsCollection.ReplaceOneAsync(filter,
                new TouristPosition
                {
                    TouristId = touristId,
                    Latitude = latitude,
                    Longitude = longitude,
                    LastUpdated = System.DateTime.UtcNow
                },
                new ReplaceOptions { IsUpsert = true });
        }
    }
}