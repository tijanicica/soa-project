using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using purchase_service.Services;
using System.Security.Claims;

namespace purchase_service.Controllers
{
    public class AddToCartDto
    {
        public required string TourId { get; set; }
    }

    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class PurchaseController : ControllerBase
    {
        private readonly Services.PurchaseService _purchaseService;

        public PurchaseController(Services.PurchaseService purchaseService)
        {
            _purchaseService = purchaseService;
        }

        [HttpGet("cart")]
        [Authorize(Roles = "tourist")]
        public async Task<IActionResult> GetCart()
        {
            var touristId = GetCurrentUserId();
            var cart = await _purchaseService.GetCartAsync(touristId);

            if (cart == null)
            {
                return Ok(new { Items = new List<object>(), TotalPrice = 0 });
            }

            var totalPrice = cart.Items.Sum(item => item.Price);

            return Ok(new { cart.Items, TotalPrice = totalPrice });
        }

        [HttpPost("cart/add")]
        [Authorize(Roles = "tourist")]
        public async Task<IActionResult> AddToCart([FromBody] AddToCartDto dto)
        {
            try
            {
                var touristId = GetCurrentUserId();
                var updatedCart = await _purchaseService.AddToCartAsync(touristId, dto.TourId);

                var totalPrice = updatedCart.Items.Sum(item => item.Price);
                return Ok(new { Items = updatedCart.Items, TotalPrice = totalPrice });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"An internal error occurred: {ex.Message}" });
            }
        }

        [HttpDelete("cart/item/{tourId}")]
        [Authorize(Roles = "tourist")]
        public async Task<IActionResult> RemoveFromCart(string tourId)
        {
            try
            {
                var touristId = GetCurrentUserId();

                var updatedCart = await _purchaseService.RemoveFromCartAsync(touristId, tourId);

                var totalPrice = updatedCart.Items.Sum(item => item.Price);
                return Ok(new { Items = updatedCart.Items, TotalPrice = totalPrice });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"An internal error occurred: {ex.Message}" });
            }
        }


        //id iz jwt tokena
        private long GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !long.TryParse(userIdClaim.Value, out var userId))
            {
                throw new InvalidOperationException("User ID could not be determined from the token.");
            }
            return userId;
        }

        [HttpGet("my-tokens")]
        [Authorize(Roles = "tourist")]
        public async Task<IActionResult> GetMyPurchaseTokens()
        {
            try
            {
                var touristId = GetCurrentUserId();
                var tokens = await _purchaseService.GetPurchaseTokensAsync(touristId);
                return Ok(tokens);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An internal error occurred: {ex.Message}");
            }
        }



        [HttpPost("cart/checkout")]
        [Authorize(Roles = "tourist")]
        public async Task<IActionResult> Checkout()
        {
            try
            {
                var touristId = GetCurrentUserId();
                await _purchaseService.CheckoutAsync(touristId);

                return Ok(new { message = "Purchase successful!" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }



        [HttpGet("my-purchased-tours")]
        [Authorize(Roles = "tourist")]
        public async Task<IActionResult> GetMyPurchasedTours()
        {
            try
            {
                var touristId = GetCurrentUserId();
                var purchasedTours = await _purchaseService.GetPurchasedToursWithDetailsAsync(touristId);
                return Ok(purchasedTours);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An internal error occurred: {ex.Message}");
            }
        }
    }
}