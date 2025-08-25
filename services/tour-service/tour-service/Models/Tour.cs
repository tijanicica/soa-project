using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Collections.Generic; // Dodajemo ovo za List<T>
using System; // Dodajemo ovo za DateTime
namespace tour_service.Models
{
    public class Tour
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        public long AuthorId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Difficulty { get; set; } = string.Empty;
        public List<string> Tags { get; set; } = new();
        public string Status { get; set; } = "draft"; // Postavljamo "draft" kao podrazumevani status
        public double Price { get; set; }
        public DateTime? PublishTime { get; set; } // Nullable tipovi ne moraju da se inicijalizuju
        public DateTime? ArchiveTime { get; set; }
        public double DistanceKm { get; set; }
        public List<TransportTime> TransportTimes { get; set; } = new();

        public List<KeyPoint> KeyPoints { get; set; } = new();
        public List<Review> Reviews { get; set; } = new();
    }

    public class KeyPoint
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
    }

    public class Review
    {
        public long TouristId { get; set; }
        public int Rating { get; set; }
        public string Comment { get; set; } = string.Empty;
        public DateTime VisitDate { get; set; }
        public DateTime CommentDate { get; set; }
        public List<string> ImageUrls { get; set; } = new();
    }

    public class TransportTime
    {
        public string TransportType { get; set; } = string.Empty;  // "walk", "bike", "car"
        public int DurationMinutes { get; set; }
    }
}
