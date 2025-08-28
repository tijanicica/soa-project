using Microsoft.EntityFrameworkCore;
using purchase_service.Data;
using purchase_service.Models;
using System.Text.Json;

namespace purchase_service.Services
{
    // DTO for data received from tour-service
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

        // Constructor for dependency injection
        public PurchaseService(PurchaseDbContext context, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _httpClient = httpClientFactory.CreateClient("TourService");
        }
        /*public async Task<ShoppingCart> AddToCartAsync(long touristId, string tourId)
        {
            // 1. Get tour details from the tour-service
            var tourDetails = await GetTourDetailsFromTourServiceAsync(tourId);

            // 2. Business logic validation
            if (tourDetails.Status != "published")
            {
                throw new InvalidOperationException("Only published tours can be purchased.");
            }

            // 3. Find or create the shopping cart
            var cart = await _context.ShoppingCarts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.TouristId == touristId);

            if (cart == null)
            {
                cart = new ShoppingCart { TouristId = touristId };
                await _context.ShoppingCarts.AddAsync(cart);
            }

            // 4. Check if the tour is already in the cart
            if (cart.Items.Any(item => item.TourId == tourId))
            {
                throw new InvalidOperationException("The tour is already in the shopping cart.");
            }

            // 5. Create and add the new item
            var orderItem = new OrderItem
            {
                TourId = tourDetails.Id,
                Name = tourDetails.Name,
                Price = tourDetails.Price,
                ShoppingCartTouristId = touristId
            };

            cart.Items.Add(orderItem);
            await _context.SaveChangesAsync();

            return cart;
        }*/

        // U fajlu PurchaseService.cs

        /* public async Task<ShoppingCart> AddToCartAsync(long touristId, string tourId)
         {
             // <-- POČETAK DELA KOJI NEDOSTAJE ---
             // 1. Get tour details from the tour-service
             var tourDetails = await GetTourDetailsFromTourServiceAsync(tourId);

             // 2. Business logic validation
             if (tourDetails.Status != "published")
             {
                 throw new InvalidOperationException("Only published tours can be purchased.");
             }
             // --- KRAJ DELA KOJI NEDOSTAJE -->

             // 3. Find or create the shopping cart
             var cart = await _context.ShoppingCarts
                 .Include(c => c.Items)
                 .FirstOrDefaultAsync(c => c.TouristId == touristId);

             if (cart == null)
             {
                 cart = new ShoppingCart { TouristId = touristId };
                 await _context.ShoppingCarts.AddAsync(cart);
                 await _context.SaveChangesAsync();
             }

             // 4. Check if the tour is already in the cart
             if (cart.Items.Any(item => item.TourId == tourId))
             {
                 throw new InvalidOperationException("The tour is already in the shopping cart.");
             }

             // 5. Create the new item
             var orderItem = new OrderItem
             {
                 TourId = tourDetails.Id,
                 Name = tourDetails.Name,
                 Price = tourDetails.Price,
                 ShoppingCartTouristId = touristId
             };

             // 6. Add to context and save to database
             _context.OrderItems.Add(orderItem);
             await _context.SaveChangesAsync();

             // *** KLJUČNA IZMENA: Ručno dodajte novi artikal u praćeni objekat ***
             cart.Items.Add(orderItem);

             // 7. Vratite ažurirani 'cart' objekat koji EF Core već prati
             return cart;
         }*/

        // U fajlu: PurchaseService.cs

        public async Task<ShoppingCart> AddToCartAsync(long touristId, string tourId)
        {
            // 1. Dohvatanje i validacija ture (ostaje isto)
            var tourDetails = await GetTourDetailsFromTourServiceAsync(tourId);
            if (tourDetails.Status != "published")
            {
                throw new InvalidOperationException("Only published tours can be purchased.");
            }

            // 2. Pronalazak ili kreiranje korpe (ostaje isto)
            var cart = await _context.ShoppingCarts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.TouristId == touristId);

            if (cart == null)
            {
                cart = new ShoppingCart { TouristId = touristId };
                await _context.ShoppingCarts.AddAsync(cart);
                await _context.SaveChangesAsync();
            }

            // 3. Provera da li artikal već postoji (ostaje isto)
            if (cart.Items.Any(item => item.TourId == tourId))
            {
                throw new InvalidOperationException("The tour is already in the shopping cart.");
            }

            // 4. Kreiranje novog artikla (ostaje isto)
            var orderItem = new OrderItem
            {
                TourId = tourDetails.Id,
                Name = tourDetails.Name,
                Price = tourDetails.Price,
                ShoppingCartTouristId = touristId
            };

            // 5. Čuvanje u bazi (ostaje isto)
            _context.OrderItems.Add(orderItem);
            await _context.SaveChangesAsync();

            // *** KLJUČNA ISPRAVKA: Ručno dodajte novi artikal u praćeni objekat ***
            // Ovo osigurava da objekat koji se vraća frontendu sadrži novu stavku.
            cart.Items.Add(orderItem);

            // 6. Vraćanje ažuriranog objekta
            return cart;
        }

        public async Task<ShoppingCart?> GetCartAsync(long touristId)
        {
            return await _context.ShoppingCarts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.TouristId == touristId);
        }


        public Task<bool> HasUserPurchasedTourAsync(long touristId, string tourId)
        {
            throw new NotImplementedException();
        }

        // Private helper method to communicate with tour-service
        private async Task<TourDetailsDto> GetTourDetailsFromTourServiceAsync(string tourId)
        {
            HttpResponseMessage response;
            try
            {
                response = await _httpClient.GetAsync($"/tours/details-for-purchase/{tourId}");
            }
            catch (HttpRequestException ex)
            {
                // This happens if the service is down or network issue
                throw new Exception("Could not connect to the Tour service.", ex);
            }

            if (!response.IsSuccessStatusCode)
            {
                // This happens if the tour ID is not found (404 Not Found)
                throw new KeyNotFoundException("Tour not found or the tour service is unavailable.");
            }

            var tourDetails = await response.Content.ReadFromJsonAsync<TourDetailsDto>();
            if (tourDetails == null)
            {
                // This happens if the JSON response is malformed
                throw new JsonException("Failed to deserialize tour details from Tour service.");
            }

            return tourDetails;
        }

        /*public async Task<ShoppingCart> RemoveFromCartAsync(long touristId, string tourId)
        {
            // 1. Find the user's shopping cart
            var cart = await _context.ShoppingCarts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.TouristId == touristId);

            if (cart == null || !cart.Items.Any())
            {
                throw new InvalidOperationException("Shopping cart is already empty.");
            }

            // 2. Find the specific item to remove
            var itemToRemove = cart.Items.FirstOrDefault(item => item.TourId == tourId);

            if (itemToRemove == null)
            {
                throw new InvalidOperationException("This item is not in the shopping cart.");
            }

            // 3. Remove the item and save changes
            _context.OrderItems.Remove(itemToRemove); // EF Core će obrisati i iz liste i iz baze
            await _context.SaveChangesAsync();

            return cart;
        }*/

        // U fajlu: PurchaseService.cs

        public async Task<ShoppingCart> RemoveFromCartAsync(long touristId, string tourId)
        {
            // 1. Učitavanje korpe (ostaje isto)
            var cart = await _context.ShoppingCarts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.TouristId == touristId);

            if (cart == null || !cart.Items.Any())
            {
                throw new InvalidOperationException("Shopping cart is already empty.");
            }

            // 2. Pronalazak artikla za brisanje (ostaje isto)
            var itemToRemove = cart.Items.FirstOrDefault(item => item.TourId == tourId);

            if (itemToRemove == null)
            {
                throw new InvalidOperationException("This item is not in the shopping cart.");
            }

            // 3. Brisanje iz baze (ostaje isto)
            _context.OrderItems.Remove(itemToRemove);
            await _context.SaveChangesAsync();

            // *** KLJUČNA ISPRAVKA: Ručno uklonite stavku i iz liste u memoriji ***
            // Ovo osigurava da objekat koji se vraća frontendu VIŠE NE sadrži obrisanu stavku.
            cart.Items.Remove(itemToRemove);

            // 4. Vraćanje ažuriranog objekta
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
            // === SAGA KORAK 1: DOHVATI STANJE (KORPU) ===
            var cart = await _context.ShoppingCarts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.TouristId == touristId);

            if (cart == null || !cart.Items.Any())
            {
                throw new InvalidOperationException("Shopping cart is empty.");
            }

            // === SAGA KORAK 2: VALIDACIJA SA EKSTERNIM SERVISOM (Tour Service) ===
            // Proveravamo da li su sve ture i dalje 'published' pre nego što uzmemo novac
            foreach (var item in cart.Items)
            {
                var tourDetails = await GetTourDetailsFromTourServiceAsync(item.TourId);
                if (tourDetails.Status != "published")
                {
                    // Ako bilo koja tura nije dostupna, prekidamo celu operaciju.
                    // Nema potrebe za kompenzacijom jer nismo ništa menjali.
                    throw new InvalidOperationException($"Tour '{item.Name}' is no longer available for purchase.");
                }
            }

            // === SAGA KORAK 3: PROCESIRANJE PLAĆANJA (Simulacija) ===
            // U realnom svetu, ovde bi bio poziv ka Stripe-u, PayPal-u, itd.
            bool paymentSuccessful = await SimulatePaymentAsync(cart.Items.Sum(i => i.Price));
            if (!paymentSuccessful)
            {
                // Plaćanje nije uspelo, prekidamo.
                throw new Exception("Payment processing failed.");
            }

            // === SAGA KORAK 4: AŽURIRANJE LOKALNE BAZE (Transakciono) ===
            // Koristimo transakciju da osiguramo da se ili OBE operacije (čuvanje tokena i brisanje korpe)
            // izvrše uspešno, ili nijedna.
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 4a. Kreiraj i sačuvaj tokene o kupovini
                var tokens = cart.Items.Select(item => new TourPurchaseToken
                {
                    TouristId = touristId,
                    TourId = item.TourId,
                    PurchaseDate = DateTime.UtcNow
                }).ToList();

                await _context.PurchaseTokens.AddRangeAsync(tokens);
                await _context.SaveChangesAsync(); // Prvo čuvanje

                // 4b. Ukloni celu korpu (uključujući i njene stavke)
                _context.ShoppingCarts.Remove(cart);
                await _context.SaveChangesAsync(); // Drugo čuvanje

                // Ako je sve prošlo bez greške, potvrdi transakciju
                await transaction.CommitAsync();
            }
            catch (Exception)
            {
                // Ako bilo šta pukne unutar try bloka, poništi SVE promene u bazi
                await transaction.RollbackAsync();

                // === SAGA KOMPENZUJUĆA AKCIJA ===
                // Pošto je plaćanje prošlo (Korak 3), a upis u bazu nije (Korak 4),
                // moramo da poništimo plaćanje!
                await RefundPaymentAsync(); // Simulacija povraćaja novca

                // Javi korisniku da je došlo do interne greške
                throw new Exception("A critical error occurred while finalizing the purchase. Your payment will be refunded.");
            }
        }

        // Pomoćne metode za simulaciju
        private Task<bool> SimulatePaymentAsync(double amount)
        {
            Console.WriteLine($"Simulating payment of {amount}...");
            return Task.FromResult(true); // Uvek uspešno za sada
        }

        private Task RefundPaymentAsync()
        {
            Console.WriteLine("Simulating payment refund...");
            return Task.CompletedTask;
        }
    }
}