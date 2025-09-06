using MongoDB.Bson;
using MongoDB.Driver;
using tour_service.Models;
using System.Text.Json.Serialization;

namespace tour_service.Services
{

    public class AddReviewResult
    {
        public bool Success { get; set; }
        public string ErrorMessage { get; set; } = string.Empty;
    }
    public class TourService
    {
        private readonly IMongoCollection<Tour> _toursCollection;
        private readonly IMongoCollection<TourExecution> _tourExecutionsCollection;


        public TourService(IMongoClient mongoClient, string databaseName)
        {
            var database = mongoClient.GetDatabase(databaseName);
            _toursCollection = database.GetCollection<Tour>("tours");
            _tourExecutionsCollection = database.GetCollection<TourExecution>("tourExecutions");

        }
        public async Task<bool> HasTouristCompletedTourAsync(long touristId, string tourId)
        {
            var filter = Builders<TourExecution>.Filter.And(
                Builders<TourExecution>.Filter.Eq(x => x.TouristId, touristId),
                Builders<TourExecution>.Filter.Eq(x => x.TourId, tourId),
                Builders<TourExecution>.Filter.Eq(x => x.Status, "completed") // Status mora biti "completed"
            );

            // AnyAsync vraća true ako postoji bar jedan dokument koji zadovoljava filter
            return await _tourExecutionsCollection.Find(filter).AnyAsync();
        }

        // --- Ostatak metoda (CreateTourAsync, GetTourAsync, itd.) ostaje isti ---

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
            var filter = Builders<Tour>.Filter.Eq(x => x.Id, tourId);

            // Ažuriramo samo polja koja se menjaju, umesto da gazimo ceo dokument
            var update = Builders<Tour>.Update
                .Set(x => x.Name, updatedTour.Name)
                .Set(x => x.Description, updatedTour.Description)
                .Set(x => x.Difficulty, updatedTour.Difficulty)
                .Set(x => x.Tags, updatedTour.Tags)
                .Set(x => x.Price, updatedTour.Price); // <-- DODALI SMO CENU

            var result = await _toursCollection.UpdateOneAsync(filter, update);
            return result.IsAcknowledged && result.ModifiedCount > 0;
        }

        public async Task<List<PublishedTourDto>> GetAllPublishedToursAsync()
        {
            // 1. Filtriraj samo ture koje su "published"
            var publishedTours = await _toursCollection.Find(t => t.Status == "published").ToListAsync();

            // 2. Mapiraj svaku turu u DTO
            var tourDtos = publishedTours.Select(tour => new PublishedTourDto
            {
                Id = tour.Id,
                Name = tour.Name,
                Description = tour.Description,
                Difficulty = tour.Difficulty,
                Tags = tour.Tags,
                Price = tour.Price,
                // Uzmi ime i sliku samo PRVE ključne tačke, ako postoji
                FirstKeyPointName = tour.KeyPoints.FirstOrDefault()?.Name,
                FirstKeyPointImageUrl = tour.KeyPoints.FirstOrDefault()?.ImageUrl
            }).ToList();

            return tourDtos;
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

        public async Task<bool> UpdateTransportTimesAsync(string tourId, List<TransportTime> transportTimes)
        {
            var filter = Builders<Tour>.Filter.Eq(x => x.Id, tourId);
            var update = Builders<Tour>.Update.Set(x => x.TransportTimes, transportTimes);

            var result = await _toursCollection.UpdateOneAsync(filter, update);
            return result.IsAcknowledged && result.ModifiedCount > 0;
        }

        public async Task<bool> PublishTourAsync(string tourId)
        {
            var filter = Builders<Tour>.Filter.Eq(x => x.Id, tourId);
            var update = Builders<Tour>.Update
                .Set(x => x.Status, "published")
                .Set(x => x.PublishTime, DateTime.UtcNow);

            var result = await _toursCollection.UpdateOneAsync(filter, update);
            return result.IsAcknowledged && result.ModifiedCount > 0;
        }

        public async Task<bool> ArchiveTourAsync(string tourId)
        {
            var filter = Builders<Tour>.Filter.Eq(x => x.Id, tourId);
            var update = Builders<Tour>.Update
                .Set(x => x.Status, "archived")
                .Set(x => x.ArchiveTime, DateTime.UtcNow);

            var result = await _toursCollection.UpdateOneAsync(filter, update);
            return result.IsAcknowledged && result.ModifiedCount > 0;
        }

        public async Task<bool> ReactivateTourAsync(string tourId)
        {
            var filter = Builders<Tour>.Filter.Eq(x => x.Id, tourId);
            var update = Builders<Tour>.Update
                .Set(x => x.Status, "published")
                .Unset(x => x.ArchiveTime); // Uklanjamo vreme arhiviranja

            var result = await _toursCollection.UpdateOneAsync(filter, update);
            return result.IsAcknowledged && result.ModifiedCount > 0;
        }


        // Izmenjena metoda
        // U fajlu: /src/Services/TourService.cs

        public async Task<AddReviewResult> AddReviewAsync(string tourId, long touristId, CreateReviewDto reviewDto)
        {
            var tourFilter = Builders<Tour>.Filter.Eq(x => x.Id, tourId);
            if (!await _toursCollection.Find(tourFilter).AnyAsync())
            {
                return new AddReviewResult { Success = false, ErrorMessage = "Tour not found." };
            }

            var reviewExistsFilter = Builders<Tour>.Filter.And(
                tourFilter,
                Builders<Tour>.Filter.ElemMatch(x => x.Reviews, r => r.TouristId == touristId)
            );
            if (await _toursCollection.Find(reviewExistsFilter).AnyAsync())
            {
                return new AddReviewResult { Success = false, ErrorMessage = "You have already reviewed this tour." };
            }

            var newReview = new Review
            {
                TouristId = touristId,
                Rating = reviewDto.Rating,
                Comment = reviewDto.Comment,
                VisitDate = reviewDto.VisitDate,
                CommentDate = DateTime.UtcNow,
                ImageUrls = reviewDto.ImageUrls
            };

            var update = Builders<Tour>.Update.Push(x => x.Reviews, newReview);
            var result = await _toursCollection.UpdateOneAsync(tourFilter, update);

            if (result.IsAcknowledged && result.ModifiedCount > 0)
            {
                return new AddReviewResult { Success = true };
            }

            return new AddReviewResult { Success = false, ErrorMessage = "Failed to save the review to the database." };
        }
    }
}
