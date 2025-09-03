namespace tour_service.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using tour_service.DTO;
using tour_service.Models;
using tour_service.Services;


[ApiController]
[Route("tour-executions")]
[Authorize(Roles = "tourist")]
public class TourExecutionController : ControllerBase
{
    private readonly TourExecutionService _executionService;

    public TourExecutionController(TourExecutionService executionService)
    {
        _executionService = executionService;
    }
    
    private long GetCurrentUserId() => long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

    // POST /tour-executions/{tourId}/start
    [HttpPost("{tourId}/start")]
    public async Task<IActionResult> StartTour(string tourId, [FromBody] PositionUpdateDto startPosition)
    {
        try
        {
            var execution = await _executionService.StartTourAsync(tourId, GetCurrentUserId(), new Position { Latitude = startPosition.Latitude, Longitude = startPosition.Longitude });
            return Ok(execution);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    // PUT /tour-executions/{executionId}/update-position
    [HttpPut("{executionId}/update-position")]
    public async Task<IActionResult> UpdatePosition(string executionId, [FromBody] PositionUpdateDto newPosition)
    {
        var execution = await _executionService.UpdatePositionAsync(executionId, GetCurrentUserId(), new Position { Latitude = newPosition.Latitude, Longitude = newPosition.Longitude });
        if (execution == null) return NotFound("Active tour session not found.");
        return Ok(execution);
    }
    
    // PATCH /tour-executions/{executionId}/abandon
    [HttpPatch("{executionId}/abandon")]
    public async Task<IActionResult> AbandonTour(string executionId)
    {
        var execution = await _executionService.AbandonTourAsync(executionId, GetCurrentUserId());
        if (execution == null) return NotFound("Tour session not found.");
        return Ok(execution);
    }

    // GET /tour-executions/{executionId}
    [HttpGet("{executionId}")]
    public async Task<IActionResult> GetExecution(string executionId)
    {
        var execution = await _executionService.GetExecutionAsync(executionId, GetCurrentUserId());
        if (execution == null) return NotFound("Tour session not found.");
        return Ok(execution);
    }
}