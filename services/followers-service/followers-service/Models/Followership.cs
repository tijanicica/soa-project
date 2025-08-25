namespace followers_service.Models
{
    // Model za telo (body) zahteva za praćenje
    public class FollowRequest
    {
        public long FollowedId { get; set; } // ID korisnika kojeg želim da zapratim
    }

    // Model za prikazivanje korisnika (npr. u listi pratilaca ili preporukama)
    public class UserDto // DTO = Data Transfer Object
    {
        public long UserId { get; set; }
        // Kasnije možeš dodati i npr. Username, ali to bi zahtevalo poziv ka stakeholders-service
    }
}
