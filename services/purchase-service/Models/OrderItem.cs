
using System.ComponentModel.DataAnnotations;
namespace purchase_service.Models
{
    public class OrderItem
    {
        [Key] // <-- DODAJTE OVAJ ATRIBUT
        public Guid Id { get; set; } = Guid.NewGuid();
        public string TourId { get; set; }
        public string Name { get; set; }
        public double Price { get; set; }

        public long ShoppingCartTouristId { get; set; }
    }
}