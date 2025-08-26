using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using tour_service.DTO;
using tour_service.Services;

namespace tour_service.Controllers
{
    [ApiController]
    [Route("tours/position")]
    public class PositionController : ControllerBase
    {
        private readonly PositionService _positionService;

        public PositionController(PositionService positionService)
        {
            _positionService = positionService;
        }

        [HttpPut] // Odgovara na PUT /api/position
        [Authorize(Roles = "tourist")]
        public async Task<IActionResult> SetTouristPosition([FromBody] PositionUpdateDto positionDto)
        {
            var touristIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(touristIdString, out long touristId))
            {
                return Unauthorized("Token je nevalidan.");
            }

            await _positionService.SetPositionAsync(touristId, positionDto.Latitude, positionDto.Longitude);

            return Ok("Position updated successfully.");
        }


        [HttpGet] 
        [Authorize(Roles = "tourist")]
        public async Task<IActionResult> GetTouristPosition()
        {
            var touristIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!long.TryParse(touristIdString, out long touristId))
            {
                return Unauthorized("Token je nevalidan.");
            }

            var position = await _positionService.GetPositionAsync(touristId);

            if (position == null)
            {
                // Ako turista NEMA sačuvanu poziciju, vraćamo Not Found
                return NotFound();
            }

            // Ako ima, vraćamo je
            return Ok(position);
        }
    }
}