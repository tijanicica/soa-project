using Microsoft.AspNetCore.Mvc;
using tour_service.Models;
using tour_service.Services;

namespace tour_service.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ToursController : ControllerBase
    {
        private readonly TourService _tourService;

        public ToursController(TourService tourService)
        {
            _tourService = tourService;
        }

        // POST /tours
        [HttpPost]
        public async Task<IActionResult> Create(Tour newTour)
        {
            // Postavi inicijalne vrednosti kako je definisano u specifikaciji
            newTour.Status = "draft";
            newTour.Price = 0;

            await _tourService.CreateTourAsync(newTour); 

            // Vracamo 201 Created sa rutom do novog resursa
            return CreatedAtAction(nameof(Create), new { id = newTour.Id }, newTour);
        }
    }
}