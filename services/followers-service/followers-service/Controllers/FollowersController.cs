namespace followers_service.Controllers;
using followers_service.Models;
using followers_service.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;


[ApiController]
[Route("api/[controller]")]
[Authorize] // Svi endpointi u ovom kontroleru zahtevaju autorizaciju
public class FollowersController : ControllerBase
{
    private readonly IFollowerService _followerService;

    public FollowersController(IFollowerService followerService)
    {
        _followerService = followerService;
    }

    // Helper funkcija za dobijanje ID-ja ulogovanog korisnika iz JWT tokena
    private long GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !long.TryParse(userIdClaim.Value, out var userId))
        {
            throw new InvalidOperationException("User ID not found in token.");
        }
        return userId;
    }

    // POST /api/followers/follow
    [HttpPost("follow")]
    public async Task<IActionResult> Follow([FromBody] FollowRequest request)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == request.FollowedId)
        {
            return BadRequest("You cannot follow yourself.");
        }
        await _followerService.FollowUserAsync(currentUserId, request.FollowedId);
        return Ok(new { message = "Successfully followed user." });
    }

    // DELETE /api/followers/unfollow/{followedId}
    [HttpDelete("unfollow/{followedId}")]
    public async Task<IActionResult> Unfollow(long followedId)
    {
        var currentUserId = GetCurrentUserId();
        await _followerService.UnfollowUserAsync(currentUserId, followedId);
        return Ok(new { message = "Successfully unfollowed user." });
    }

    // GET /api/followers/me/following
    [HttpGet("me/following")]
    public async Task<IActionResult> GetMyFollowing()
    {
        var currentUserId = GetCurrentUserId();
        var following = await _followerService.GetFollowingAsync(currentUserId);
        return Ok(following);
    }
    
    // GET /api/followers/{userId}/following - javni endpoint
    [HttpGet("{userId}/following")]
    [AllowAnonymous] // Dozvoljavamo da se vidi koga drugi prate
    public async Task<IActionResult> GetUserFollowing(long userId)
    {
        var following = await _followerService.GetFollowingAsync(userId);
        return Ok(following);
    }

    // GET /api/followers/recommendations
    [HttpGet("recommendations")]
    public async Task<IActionResult> GetRecommendations()
    {
        var currentUserId = GetCurrentUserId();
        var recommendations = await _followerService.GetFollowRecommendationsAsync(currentUserId);
        return Ok(recommendations);
    }

    // GET /api/followers/is-following/{followedId}
    [HttpGet("is-following/{followedId}")]
    public async Task<IActionResult> IsFollowing(long followedId)
    {
        var currentUserId = GetCurrentUserId();
        var isFollowing = await _followerService.IsFollowingAsync(currentUserId, followedId);
        return Ok(new { isFollowing });
    }
    
    // GET /api/followers/me/followers
    [HttpGet("me/followers")]
    public async Task<IActionResult> GetMyFollowers()
    {
        var currentUserId = GetCurrentUserId();
        var followers = await _followerService.GetFollowersAsync(currentUserId);
        return Ok(followers);
    }
    
    // GET /api/followers/{userId}/followers
    [HttpGet("{userId}/followers")]
    [AllowAnonymous]
    public async Task<IActionResult> GetUserFollowers(long userId)
    {
        var followers = await _followerService.GetFollowersAsync(userId);
        return Ok(followers);
    }
}