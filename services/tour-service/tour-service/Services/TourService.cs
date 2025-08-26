using MongoDB.Bson;
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


        public async Task<Tour?> GetTourAsync(string id)
        {
            return await _toursCollection.Find(x => x.Id == id).FirstOrDefaultAsync();
        }


        public async Task<bool> UpdateTourAsync(string tourId, Tour updatedTour)
        {
            var result = await _toursCollection.ReplaceOneAsync(x => x.Id == tourId, updatedTour);
            return result.IsAcknowledged && result.ModifiedCount > 0;
        }
        public async Task<List<Tour>> GetToursByAuthorAsync(long authorId) =>
            await _toursCollection.Find(x => x.AuthorId == authorId).ToListAsync();


        public async Task<bool> AddKeyPointAsync(string tourId, KeyPoint newKeyPoint)
        {
            newKeyPoint.Id = ObjectId.GenerateNewId().ToString();

            var filter = Builders<Tour>.Filter.Eq(x => x.Id, tourId);
            var update = Builders<Tour>.Update.Push(x => x.KeyPoints, newKeyPoint);

            var result = await _toursCollection.UpdateOneAsync(filter, update);
            return result.IsAcknowledged && result.ModifiedCount > 0;
        }

        public async Task<bool> UpdateKeyPointAsync(string tourId, KeyPoint updatedKeyPoint)
        {
            var filter = Builders<Tour>.Filter.And(
                Builders<Tour>.Filter.Eq(x => x.Id, tourId),
                Builders<Tour>.Filter.ElemMatch(x => x.KeyPoints, kp => kp.Id == updatedKeyPoint.Id)
            );

            // ISPRAVKA: Ažuriramo samo polja koja se menjaju, ne gazimo ceo objekat.
            var update = Builders<Tour>.Update
                .Set("KeyPoints.$.Name", updatedKeyPoint.Name)
                .Set("KeyPoints.$.Description", updatedKeyPoint.Description)
                .Set("KeyPoints.$.ImageUrl", updatedKeyPoint.ImageUrl);

            var result = await _toursCollection.UpdateOneAsync(filter, update);
            return result.IsAcknowledged && result.ModifiedCount > 0;
        }
        public async Task<bool> UpdateDistanceAsync(string tourId, double newDistance)
        {
            var filter = Builders<Tour>.Filter.Eq(x => x.Id, tourId);
            var update = Builders<Tour>.Update.Set(x => x.DistanceKm, newDistance);

            var result = await _toursCollection.UpdateOneAsync(filter, update);
            return result.IsAcknowledged && result.ModifiedCount > 0;
        }

        public async Task<bool> DeleteKeyPointAsync(string tourId, string keyPointId)
        {
            var filter = Builders<Tour>.Filter.Eq(x => x.Id, tourId);
            var update = Builders<Tour>.Update.PullFilter(x => x.KeyPoints, kp => kp.Id == keyPointId);

            var result = await _toursCollection.UpdateOneAsync(filter, update);
            return result.IsAcknowledged && result.ModifiedCount > 0;
        }
    }
}
