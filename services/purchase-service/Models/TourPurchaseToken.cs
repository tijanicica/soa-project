namespace purchase_service.Models
{
    public class TourPurchaseToken
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public long TouristId { get; set; }
        public string TourId { get; set; }
        public DateTime PurchaseDate { get; set; }
    }
}