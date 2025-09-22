namespace followers_service.Models
{
    public class FollowRequest
    {
        public long FollowedId { get; set; } // ID korisnika kojeg želim da zapratim
    }

    public class UserDto
    {
        public long UserId { get; set; }
    }
}
