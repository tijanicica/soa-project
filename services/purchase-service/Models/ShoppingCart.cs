using System.ComponentModel.DataAnnotations;

namespace purchase_service.Models
{
    public class ShoppingCart
    {
        [Key] 
        public long TouristId { get; set; }
        public List<OrderItem> Items { get; set; } = new();

    }
}