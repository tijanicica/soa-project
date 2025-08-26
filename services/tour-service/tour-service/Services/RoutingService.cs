
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace tour_service.Services
{
    public class RoutingService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        public RoutingService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = configuration["OpenRouteService:ApiKey"];
        }

        public async Task<(List<List<double>> coordinates, double distance)> GetRouteAndDistance(List<Models.KeyPoint> keypoints)
        {
            if (keypoints.Count < 2)
                return (new List<List<double>>(), 0);

            var coordinates = keypoints.Select(kp => new[] { kp.Longitude, kp.Latitude }).ToList();
            var requestBody = JsonSerializer.Serialize(new { coordinates });

            var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openrouteservice.org/v2/directions/driving-car/geojson")
            {
                Content = new StringContent(requestBody, Encoding.UTF8, "application/json")
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);

            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var responseBody = await response.Content.ReadAsStringAsync();

            // Parsiranje GeoJSON odgovora
            using var jsonDoc = JsonDocument.Parse(responseBody);
            var routeCoordinates = jsonDoc.RootElement.GetProperty("features")[0].GetProperty("geometry").GetProperty("coordinates")
                .EnumerateArray()
                .Select(coord => new List<double> { coord[1].GetDouble(), coord[0].GetDouble() }) // Vraćamo na [lat, lon] format
                .ToList();

            var distanceInMeters = jsonDoc.RootElement.GetProperty("features")[0].GetProperty("properties").GetProperty("summary").GetProperty("distance").GetDouble();

            return (routeCoordinates, distanceInMeters / 1000); // Vraćamo distancu u KM
        }
    }
}