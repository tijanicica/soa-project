using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace tour_service.Models
{
    public class TouristPosition
    {
        [BsonId]
        public long TouristId { get; set; } // Koristimo ID turiste kao glavni ključ

        public double Latitude { get; set; }

        public double Longitude { get; set; }

        public DateTime LastUpdated { get; set; }
    }
}