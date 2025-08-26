using tour_service.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace tour_service.Services
{
    public interface ITourService
    {
        Task CreateTourAsync(Tour newTour);
        Task<Tour?> GetTourAsync(string id);
        Task<bool> UpdateTourAsync(string tourId, Tour updatedTour);
        Task<List<Tour>> GetToursByAuthorAsync(long authorId);
        Task<bool> AddKeyPointAsync(string tourId, KeyPoint newKeyPoint);
        Task<bool> UpdateKeyPointAsync(string tourId, KeyPoint updatedKeyPoint);
        Task<bool> DeleteKeyPointAsync(string tourId, string keyPointId);
        Task<(bool Success, string ErrorMessage)> PublishTourAsync(string tourId);
        Task<bool> ArchiveTourAsync(string tourId);
        Task<bool> ReactivateTourAsync(string tourId);
        Task<List<Tour>> GetPublishedToursForTouristsAsync();
    }
}