using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace tour_service.Models
{

    public class TourExecution
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        [BsonRepresentation(BsonType.ObjectId)]
        public string TourId { get; set; } = string.Empty;

        public long TouristId { get; set; }
        public string Status { get; set; } = "active"; // Postavljamo "active" kao podrazumevani status
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public DateTime LastActivityTime { get; set; }
        public Position CurrentPosition { get; set; } = new();
        public List<CompletedKeyPoint> CompletedKeyPoints { get; set; } = new();
    }

    public class Position
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
    }

    public class CompletedKeyPoint
    {
        [BsonRepresentation(BsonType.ObjectId)]
        public string KeyPointId { get; set; } = string.Empty;
        public DateTime CompletionTime { get; set; }
    }
}
