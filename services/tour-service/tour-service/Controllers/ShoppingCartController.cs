// In Controllers/ShoppingCartController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using tour_service.Services;

namespace tour_service.Controllers
{

    [ApiController]
    [Route("tours/shoppingcart")]
    [Authorize(Roles = "tourist")] // Samo turisti mogu pristupiti
    public class ShoppingCartController : ControllerBase
    {
        private readonly ShoppingCartService _cartService;

        public ShoppingCartController(ShoppingCartService cartService)
        {
            _cartService = cartService;
        }

        private long GetCurrentUserId()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (long.TryParse(userIdString, out long userId))
            {
                return userId;
            }
            throw new UnauthorizedAccessException("User ID is not valid.");
        }

        [HttpGet]
        public async Task<IActionResult> GetMyCart()
        {
            var touristId = GetCurrentUserId();
            var cart = await _cartService.GetCartByTouristIdAsync(touristId);
            return Ok(cart);
        }

        [HttpPost("items/{tourId}")]
        public async Task<IActionResult> AddToCart(string tourId)
        {
            try
            {
                var touristId = GetCurrentUserId();
                await _cartService.AddItemToCartAsync(touristId, tourId);
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("checkout")]
        public async Task<IActionResult> Checkout()
        {
            try
            {
                var touristId = GetCurrentUserId();
                var tokens = await _cartService.CheckoutAsync(touristId);
                return Ok(tokens);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("items/{tourId}")]
        public async Task<IActionResult> RemoveFromCart(string tourId)
        {
            try
            {
                var touristId = GetCurrentUserId();
                await _cartService.RemoveItemFromCartAsync(touristId, tourId);
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
