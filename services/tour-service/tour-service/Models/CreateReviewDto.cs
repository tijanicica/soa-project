// Kreirajte novi fajl /src/Models/CreateReviewDto.cs
namespace tour_service.Models
{
    public class CreateReviewDto
    {
        public int Rating { get; set; }
        public string Comment { get; set; } = string.Empty;
        public DateTime VisitDate { get; set; }
        public List<string> ImageUrls { get; set; } = new();
    }
}