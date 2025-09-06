using followers_service.Models;

namespace followers_service.Services;

public interface IFollowerService
{
    Task FollowUserAsync(long followerId, long followedId);
    Task UnfollowUserAsync(long followerId, long followedId);
    Task<IEnumerable<UserDto>> GetFollowingAsync(long userId);
    Task<IEnumerable<UserDto>> GetFollowersAsync(long userId);
    Task<IEnumerable<UserDto>> GetFollowRecommendationsAsync(long userId);
    Task<bool> IsFollowingAsync(long followerId, long followedId);
}