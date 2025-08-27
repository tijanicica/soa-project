
using MongoDB.Driver;
using tour_service.Models;

namespace tour_service.Services
{
    public class ShoppingCartService
    {
        private readonly IMongoCollection<ShoppingCart> _shoppingCartCollection;
        private readonly IMongoCollection<Tour> _toursCollection;
        private readonly IMongoCollection<TourPurchaseToken> _purchaseTokensCollection;

        public ShoppingCartService(IMongoClient mongoClient, string databaseName)
        {
            var database = mongoClient.GetDatabase(databaseName);
            _shoppingCartCollection = database.GetCollection<ShoppingCart>("shoppingCarts");
            _toursCollection = database.GetCollection<Tour>("tours"); // Potrebno za proveru tura
            _purchaseTokensCollection = database.GetCollection<TourPurchaseToken>("purchaseTokens");
        }

        public async Task<ShoppingCart> GetCartByTouristIdAsync(long touristId)
        {
            return await _shoppingCartCollection.Find(cart => cart.TouristId == touristId).FirstOrDefaultAsync()
                   ?? new ShoppingCart(touristId);
        }

        public async Task AddItemToCartAsync(long touristId, string tourId)
        {
            // 1. Proveri da li je tura objavljena i da li se može kupiti
            var tour = await _toursCollection.Find(t => t.Id == tourId && t.Status == "published").FirstOrDefaultAsync();
            if (tour == null)
            {
                throw new Exception("Tour is not available for purchase.");
            }

            // 2. Pronađi korpu ili kreiraj novu
            var cart = await GetCartByTouristIdAsync(touristId);
            if (string.IsNullOrEmpty(cart.Id))
            {
                await _shoppingCartCollection.InsertOneAsync(cart);
            }

            // 3. Dodaj stavku (ako već ne postoji)
            if (!cart.Items.Any(item => item.TourId == tourId))
            {
                var orderItem = new OrderItem { TourId = tour.Id, TourName = tour.Name, Price = tour.Price };
                var filter = Builders<ShoppingCart>.Filter.Eq(c => c.TouristId, touristId);
                var update = Builders<ShoppingCart>.Update.Push(c => c.Items, orderItem);
                await _shoppingCartCollection.UpdateOneAsync(filter, update);
            }
        }

        public async Task<List<TourPurchaseToken>> CheckoutAsync(long touristId)
        {
            var cart = await GetCartByTouristIdAsync(touristId);
            if (!cart.Items.Any())
            {
                throw new Exception("Shopping cart is empty.");
            }

            var newTokens = new List<TourPurchaseToken>();
            foreach (var item in cart.Items)
            {
                var token = new TourPurchaseToken
                {
                    TouristId = touristId,
                    TourId = item.TourId,
                    PurchaseTime = DateTime.UtcNow
                };
                newTokens.Add(token);
            }

            // Sačuvaj sve tokene u bazu i isprazni korpu
            await _purchaseTokensCollection.InsertManyAsync(newTokens);
            await _shoppingCartCollection.DeleteOneAsync(c => c.TouristId == touristId);

            return newTokens;
        }

        public async Task<List<Tour>> GetPurchasedToursAsync(long touristId)
        {
            // Pronađi sve tokene za datog turistu
            var purchasedTokens = await _purchaseTokensCollection.Find(t => t.TouristId == touristId).ToListAsync();
            var purchasedTourIds = purchasedTokens.Select(t => t.TourId).ToList();

            if (!purchasedTourIds.Any()) return new List<Tour>();

            // Vrati pune objekte tura koje su kupljene
            return await _toursCollection.Find(t => purchasedTourIds.Contains(t.Id)).ToListAsync();
        }

        public async Task RemoveItemFromCartAsync(long touristId, string tourId)
        {
            var filter = Builders<ShoppingCart>.Filter.Eq(c => c.TouristId, touristId);
            var update = Builders<ShoppingCart>.Update.PullFilter(c => c.Items, item => item.TourId == tourId);

            await _shoppingCartCollection.UpdateOneAsync(filter, update);
        }
    }
}