using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
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
        [HttpPost("create")]
        [Authorize(Roles = "guide")] // SAMO korisnici sa ulogom "guide" mogu da pozovu ovu metodu
        public async Task<IActionResult> Create([FromBody] Tour newTour)
        {
            var authorIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(authorIdString) || !long.TryParse(authorIdString, out long authorId))
            {
                return Unauthorized("Invalid token: User ID is missing.");
            }
            

            newTour.AuthorId = authorId; // Postavljamo ID ulogovanog korisnika
            newTour.Status = "draft";
            newTour.Price = 0;
            newTour.CreationDate = DateTime.UtcNow; // Koristimo univerzalno vreme


            await _tourService.CreateTourAsync(newTour);

            return CreatedAtAction(nameof(GetById), new { id = newTour.Id }, newTour);
        }


        [HttpGet("{id:length(24)}")]
        public async Task<ActionResult<Tour>> GetById(string id)
        {
            var tour = await _tourService.GetTourAsync(id);

            if (tour is null)
            {
                return NotFound();
            }

            return tour;
        }


        [HttpPut("{id:length(24)}")]
        [Authorize(Roles = "guide")] 
        public async Task<IActionResult> Update(string id, [FromBody] Tour updatedTour)
        {
            var tour = await _tourService.GetTourAsync(id);
            if (tour is null)
            {
                return NotFound();
            }

            var authorIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(authorIdString, out long userId))
            {
                return Unauthorized();
            }

     
            updatedTour.Id = id;
            updatedTour.AuthorId = tour.AuthorId;

            var success = await _tourService.UpdateTourAsync(id, updatedTour);

            if (!success)
            {
                return BadRequest("Could not update the tour.");
            }

            return NoContent(); 
        }

        [HttpGet("my-tours")]
        [Authorize(Roles = "guide")] 
        public async Task<ActionResult<List<Tour>>> GetMyTours()
        {
            var authorIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(authorIdString, out long authorId))
            {
                return Unauthorized("Invalid token: User ID is missing.");
            }

            var tours = await _tourService.GetToursByAuthorAsync(authorId);

            return Ok(tours);
        }

        [HttpPut("{tourId:length(24)}/transport-times")]
        [Authorize(Roles = "guide")]
        public async Task<IActionResult> UpdateTourTransportTimes(string tourId, [FromBody] List<TransportTime> transportTimes)
        {
            var tour = await _tourService.GetTourAsync(tourId);
            if (tour is null) return NotFound("Tour not found.");

            // Provera autorizacije
            var authorIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(authorIdString, out long userId) || tour.AuthorId != userId)
            {
                return Forbid();
            }

            var success = await _tourService.UpdateTransportTimesAsync(tourId, transportTimes);
            if (!success)
            {
                return BadRequest("Could not update transport times.");
            }
            return NoContent();
        }
        
        [HttpPatch("{tourId:length(24)}/publish")]
        [Authorize(Roles = "guide")]
        public async Task<IActionResult> PublishTour(string tourId)
        {
            var tour = await _tourService.GetTourAsync(tourId);
            if (tour is null) return NotFound("Tour not found.");

            var authorIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(authorIdString, out long userId) || tour.AuthorId != userId) return Forbid();

            if (string.IsNullOrEmpty(tour.Name) || string.IsNullOrEmpty(tour.Description) ||
                string.IsNullOrEmpty(tour.Difficulty) || !tour.Tags.Any())
            {
                return BadRequest("Tour is missing basic information (name, description, difficulty, or tags).");
            }
            if (tour.KeyPoints.Count < 2)
            {
                return BadRequest("Tour must have at least two keypoints to be published.");
            }
            if (!tour.TransportTimes.Any())
            {
                return BadRequest("At least one transport time must be defined to publish the tour.");
            }

            var success = await _tourService.PublishTourAsync(tourId);
            if (!success) return BadRequest("Could not publish the tour.");

            return NoContent();
        }

        [HttpPatch("{tourId:length(24)}/archive")]
        [Authorize(Roles = "guide")]
        public async Task<IActionResult> ArchiveTour(string tourId)
        {
            var tour = await _tourService.GetTourAsync(tourId);
            if (tour is null) return NotFound("Tour not found.");

            var authorIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(authorIdString, out long userId) || tour.AuthorId != userId) return Forbid();

            var success = await _tourService.ArchiveTourAsync(tourId);
            if (!success) return BadRequest("Could not archive the tour.");

            return NoContent();
        }

        [HttpPatch("{tourId:length(24)}/reactivate")]
        [Authorize(Roles = "guide")]
        public async Task<IActionResult> ReactivateTour(string tourId)
        {
            var tour = await _tourService.GetTourAsync(tourId);
            if (tour is null) return NotFound("Tour not found.");

            var authorIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(authorIdString, out long userId) || tour.AuthorId != userId) return Forbid();

            var success = await _tourService.ReactivateTourAsync(tourId);
            if (!success) return BadRequest("Could not reactivate the tour.");

            return NoContent();
        }

        [HttpGet("published")]
        [AllowAnonymous] // Eksplicitno kažemo da ne treba autorizacija
        public async Task<ActionResult<List<PublishedTourDto>>> GetPublishedTours()
        {
            var tours = await _tourService.GetAllPublishedToursAsync();
            return Ok(tours);
        }

        // POST /tours/{tourId}/keypoints
        [HttpPost("{tourId:length(24)}/keypoints")]
        [Authorize(Roles = "guide")] 
        public async Task<IActionResult> AddKeyPoint(string tourId, [FromBody] KeyPoint newKeyPoint)
        {
            var tour = await _tourService.GetTourAsync(tourId);
            if (tour is null)
            {
                return NotFound("Tour not found.");
            }

            var authorIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(authorIdString, out long userId))
            {
                return Unauthorized();
            }

            var success = await _tourService.AddKeyPointAsync(tourId, newKeyPoint);
            if (!success)
            {
                return BadRequest("Could not add keypoint.");
            }

            var updatedTour = await _tourService.GetTourAsync(tourId);
            return Ok(updatedTour);
        }

        // PUT /tours/{tourId}/keypoints/{keyPointId}
        [HttpPut("{tourId:length(24)}/keypoints/{keyPointId:length(24)}")]
        [Authorize(Roles = "guide")]
        public async Task<IActionResult> UpdateKeyPoint(string tourId, string keyPointId, [FromBody] KeyPoint updatedKeyPoint)
        {
            var tour = await _tourService.GetTourAsync(tourId);
            if (tour is null)
            {
                return NotFound("Tour not found.");
            }

            var authorIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(authorIdString, out long userId))
            {
                return Unauthorized();
            }

            updatedKeyPoint.Id = keyPointId; 

            var success = await _tourService.UpdateKeyPointAsync(tourId, updatedKeyPoint);
            if (!success)
            {
                return BadRequest("Could not update keypoint.");
            }
            return NoContent();
        }


        [HttpPut("{tourId:length(24)}/distance")]
        [Authorize(Roles = "guide")]
        public async Task<IActionResult> UpdateTourDistance(string tourId, [FromBody] DistanceUpdateDto distanceDto)
        {
            var tour = await _tourService.GetTourAsync(tourId);
            if (tour is null) return NotFound("Tour not found.");

            // Provera autorizacije (da li je korisnik vlasnik ture)
            var authorIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(authorIdString, out long userId) || tour.AuthorId != userId)
            {
                return Forbid();
            }

            var success = await _tourService.UpdateDistanceAsync(tourId, distanceDto.Distance);
            if (!success)
            {
                return BadRequest("Could not update tour distance.");
            }
            return NoContent();
        }

        public class DistanceUpdateDto
        {
            public double Distance { get; set; }
        }

        // DELETE /tours/{tourId}/keypoints/{keyPointId}
        [HttpDelete("{tourId:length(24)}/keypoints/{keyPointId:length(24)}")]
        [Authorize(Roles = "guide")]
        public async Task<IActionResult> DeleteKeyPoint(string tourId, string keyPointId)
        {
            var tour = await _tourService.GetTourAsync(tourId);
            if (tour is null)
            {
                return NotFound("Tour not found.");
            }

            var authorIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(authorIdString, out long userId))
            {
                return Unauthorized();
            }

        

            var success = await _tourService.DeleteKeyPointAsync(tourId, keyPointId);
            if (!success)
            {
                return BadRequest("Could not delete keypoint.");
            }
            return NoContent();
        }
    }
}