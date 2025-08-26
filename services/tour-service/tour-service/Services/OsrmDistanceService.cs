using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
namespace tour_service.Services
{
    public class OsrmDistanceService : IDistanceService
    {
        private readonly HttpClient _httpClient;

        public OsrmDistanceService(HttpClient httpClient)
        {
            _httpClient = httpClient;
            // Podrazumevani OSRM server
            _httpClient.BaseAddress = new System.Uri("http://router.project-osrm.org/");
        }

        public async Task<double> CalculateDistanceAsync(double startLat, double startLon, double endLat, double endLon)
        {
            var requestUri = $"route/v1/driving/{startLon},{startLat};{endLon},{endLat}?overview=false";
            var response = await _httpClient.GetAsync(requestUri);

            if (!response.IsSuccessStatusCode)
            {
                // U realnoj aplikaciji, ovde bi bio bolji error handling
                return 0;
            }

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            var distanceInMeters = doc.RootElement.GetProperty("routes")[0].GetProperty("distance").GetDouble();

            return distanceInMeters / 1000; // Vraćamo u kilometrima
        }
    }
}
