using Microsoft.EntityFrameworkCore;
using purchase_service.Data;
using purchase_service.Models;
using System.Text.Json;

namespace purchase_service.Services
{
    public class TourDetailsDto
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public double Price { get; set; }
        public string Status { get; set; }
    }

    public class PurchaseService
    {
        private readonly PurchaseDbContext _context;
        private readonly HttpClient _httpClient;

        public PurchaseService(PurchaseDbContext context, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _httpClient = httpClientFactory.CreateClient("TourService");
        }

        public async Task<ShoppingCart> AddToCartAsync(long touristId, string tourId)
        {
            var tourDetails = await GetTourDetailsFromTourServiceAsync(tourId);
            if (tourDetails.Status != "published")
            {
                throw new InvalidOperationException("Only published tours can be purchased.");
            }

            var cart = await _context.ShoppingCarts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.TouristId == touristId);

            if (cart == null)
            {
                cart = new ShoppingCart { TouristId = touristId };
                await _context.ShoppingCarts.AddAsync(cart);
                await _context.SaveChangesAsync();
            }

            if (cart.Items.Any(item => item.TourId == tourId))
            {
                throw new InvalidOperationException("The tour is already in the shopping cart.");
            }

            var orderItem = new OrderItem
            {
                TourId = tourDetails.Id,
                Name = tourDetails.Name,
                Price = tourDetails.Price,
                ShoppingCartTouristId = touristId
            };

            _context.OrderItems.Add(orderItem);
            await _context.SaveChangesAsync();

            cart.Items.Add(orderItem);

            return cart;
        }

        public async Task<ShoppingCart?> GetCartAsync(long touristId)
        {
            return await _context.ShoppingCarts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.TouristId == touristId);
        }

        // 17. tacka GRPC komunikacija za proveru da li je tura kupljena
        public async Task<bool> HasUserPurchasedTourAsync(long touristId, string tourId)
        {
            return await _context.PurchaseTokens
                .AnyAsync(t => t.TouristId == touristId && t.TourId == tourId);
        }

        private async Task<TourDetailsDto> GetTourDetailsFromTourServiceAsync(string tourId)
        {
            HttpResponseMessage response;
            try
            {
                response = await _httpClient.GetAsync($"/tours/details-for-purchase/{tourId}");
            }
            catch (HttpRequestException ex)
            {
                throw new Exception("Could not connect to the Tour service.", ex);
            }

            if (!response.IsSuccessStatusCode)
            {
                throw new KeyNotFoundException("Tour not found or the tour service is unavailable.");
            }

            var tourDetails = await response.Content.ReadFromJsonAsync<TourDetailsDto>();
            if (tourDetails == null)
            {
                throw new JsonException("Failed to deserialize tour details from Tour service.");
            }

            return tourDetails;
        }


        public async Task<ShoppingCart> RemoveFromCartAsync(long touristId, string tourId)
        {
            var cart = await _context.ShoppingCarts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.TouristId == touristId);

            if (cart == null || !cart.Items.Any())
            {
                throw new InvalidOperationException("Shopping cart is already empty.");
            }

            var itemToRemove = cart.Items.FirstOrDefault(item => item.TourId == tourId);

            if (itemToRemove == null)
            {
                throw new InvalidOperationException("This item is not in the shopping cart.");
            }

            _context.OrderItems.Remove(itemToRemove);
            await _context.SaveChangesAsync();

            cart.Items.Remove(itemToRemove);

            return cart;
        }

        public async Task<List<TourPurchaseToken>> GetPurchaseTokensAsync(long touristId)
        {
            return await _context.PurchaseTokens
                .Where(t => t.TouristId == touristId)
                .ToListAsync();
        }



        public async Task CheckoutAsync(long touristId)
        {
            // SAGA
            var cart = await _context.ShoppingCarts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.TouristId == touristId);

            if (cart == null || !cart.Items.Any())
            {
                throw new InvalidOperationException("Shopping cart is empty.");
            }

            var tourIdsInCart = cart.Items.Select(item => item.TourId).ToList();
            var existingTokens = await _context.PurchaseTokens
                .Where(token => token.TouristId == touristId && tourIdsInCart.Contains(token.TourId))
                .ToListAsync();

            if (existingTokens.Any())
            {
                var alreadyOwnedTourId = existingTokens.First().TourId;
                var tourNameInCart = cart.Items.First(item => item.TourId == alreadyOwnedTourId).Name;

                throw new InvalidOperationException($"You have already purchased the tour: '{tourNameInCart}'.");
            }


            // saga, da li su ture i dalje published
            foreach (var item in cart.Items)
            {
                var tourDetails = await GetTourDetailsFromTourServiceAsync(item.TourId);
                if (tourDetails.Status != "published")
                {
                    throw new InvalidOperationException($"Tour '{item.Name}' is no longer available for purchase.");
                }
            }

            // simulacija placanja
            bool paymentSuccessful = await SimulatePaymentAsync(cart.Items.Sum(i => i.Price));
            if (!paymentSuccessful)
            {
                throw new Exception("Payment processing failed.");
            }
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var tokens = cart.Items.Select(item => new TourPurchaseToken
                {
                    TouristId = touristId,
                    TourId = item.TourId,
                    PurchaseDate = DateTime.UtcNow
                }).ToList();

                await _context.PurchaseTokens.AddRangeAsync(tokens);
                await _context.SaveChangesAsync();

                _context.ShoppingCarts.Remove(cart);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                await RefundPaymentAsync(); // Simulacija povraćaja novca

                throw new Exception("A critical error occurred while finalizing the purchase. Your payment will be refunded.");
            }
        }

        private Task<bool> SimulatePaymentAsync(double amount)
        {
            Console.WriteLine($"Simulating payment of {amount}...");
            return Task.FromResult(true);
        }

        private Task RefundPaymentAsync()
        {
            Console.WriteLine("Simulating payment refund...");
            return Task.CompletedTask;
        }

        public async Task<List<PurchasedTourDetailsDto>> GetPurchasedToursWithDetailsAsync(long touristId)
        {
            var tokens = await GetPurchaseTokensAsync(touristId);
            if (tokens == null || !tokens.Any())
            {
                return new List<PurchasedTourDetailsDto>();
            }

            var purchasedTours = new List<PurchasedTourDetailsDto>();

            foreach (var token in tokens)
            {
                try
                {
                    var tourDetails = await _httpClient.GetFromJsonAsync<TourServiceResponseDto>($"/tours/{token.TourId}");

                    if (tourDetails != null)
                    {
                        purchasedTours.Add(new PurchasedTourDetailsDto
                        {
                            Id = tourDetails.Id,
                            Name = tourDetails.Name,
                            Description = tourDetails.Description,
                            Difficulty = tourDetails.Difficulty,
                            Tags = tourDetails.Tags,
                            Price = tourDetails.Price,
                            DistanceKm = tourDetails.DistanceKm,
                            TransportTimes = tourDetails.TransportTimes,
                            KeyPoints = tourDetails.KeyPoints,
                            PurchaseDate = token.PurchaseDate
                        });
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Could not fetch details for tour ID {token.TourId}: {ex.Message}");
                }
            }

            return purchasedTours;
        }
        
        
    }

    public class TourServiceResponseDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Difficulty { get; set; } = string.Empty;
        public List<string> Tags { get; set; } = new();
        public double Price { get; set; }
        public double DistanceKm { get; set; }
        public List<object> TransportTimes { get; set; } = new();
        public List<FullKeyPointDto> KeyPoints { get; set; } = new();
    }

    public class PurchasedTourDetailsDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Difficulty { get; set; } = string.Empty;
        public List<string> Tags { get; set; } = new();
        public double Price { get; set; }
        public double DistanceKm { get; set; }
        public List<object> TransportTimes { get; set; } = new();
        public List<FullKeyPointDto> KeyPoints { get; set; } = new();
        public DateTime PurchaseDate { get; set; }
    }

    public class FullKeyPointDto
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
    }
    
    
}