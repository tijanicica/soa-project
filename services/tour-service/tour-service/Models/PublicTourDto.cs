namespace tour_service.Models
{
    public class PublicTourDto
    {
        public string Id { get; set; } = string.Empty;
        public long AuthorId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Difficulty { get; set; } = string.Empty;
        public List<string> Tags { get; set; } = new();
        public double Price { get; set; }
        public double DistanceKm { get; set; }
        public List<TransportTime> TransportTimes { get; set; } = new();

        // Vraćamo samo prvu ključnu tačku, kako je i traženo
        public KeyPoint? FirstKeyPoint { get; set; }
    }
}
