using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Linq;


namespace tour_service.Models
{

    public class ShoppingCart
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        public long TouristId { get; set; }
        public List<OrderItem> Items { get; set; } = new List<OrderItem>();
        public double TotalPrice => Items.Sum(item => item.Price);

        public ShoppingCart(long touristId)
        {
            TouristId = touristId;
        }
    }
}
