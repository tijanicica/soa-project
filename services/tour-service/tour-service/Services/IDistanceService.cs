namespace tour_service.Services
{
    public interface IDistanceService
    {
        Task<double> CalculateDistanceAsync(double startLat, double startLon, double endLat, double endLon);
    }
}
