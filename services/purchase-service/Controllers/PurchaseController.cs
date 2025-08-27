using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using purchase_service.Data;
using purchase_service.Models;
using System.Security.Claims;

namespace purchase_service.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class PurchaseController : ControllerBase
    {
        private readonly PurchaseDbContext _context;
        private readonly HttpClient _httpClient;

        public PurchaseController(PurchaseDbContext context, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _httpClient = httpClientFactory.CreateClient("TourService");
        }

        private long GetCurrentUserId() => long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

        [HttpPost("cart/add")]
        [Authorize(Roles = "turista")]
        public async Task<IActionResult> AddToCart([FromBody] OrderItem item)
        {
            var touristId = GetCurrentUserId();
            var cart = await _context.ShoppingCarts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.TouristId == touristId);

            if (cart == null)
            {
                cart = new ShoppingCart { TouristId = touristId };
                await _context.ShoppingCarts.AddAsync(cart);
            }


            cart.Items.Add(item);
            await _context.SaveChangesAsync();
            return Ok(cart);
        }

        [HttpGet("cart")]
        [Authorize(Roles = "tourist")]
        public async Task<IActionResult> GetCart()
        {
            var touristId = GetCurrentUserId();
            var cart = await _context.ShoppingCarts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.TouristId == touristId);

            if (cart == null)
            {
                return Ok(new ShoppingCart { TouristId = touristId }); 
            }
            return Ok(cart);
        }

    }
}