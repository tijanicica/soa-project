using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;


namespace tour_service.Models
{
    public class TourPurchaseToken
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }
        public long TouristId { get; set; }
        public string TourId { get; set; }
        public DateTime PurchaseTime { get; set; }
    }
}
