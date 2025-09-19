namespace followers_service.Models;
using System.Text.Json.Serialization;

public class StakeholderUserDto
{
    [JsonPropertyName("id")]
    public long Id { get; set; }

    [JsonPropertyName("role")]
    public string Role { get; set; }
}