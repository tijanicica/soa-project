using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using purchase_service.Services;
using System.Security.Claims;

namespace purchase_service.Controllers
{
    // DTO received from the frontend
    public class AddToCartDto
    {
        public required string TourId { get; set; }
    }

    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class PurchaseController : ControllerBase
    {
        private readonly PurchaseService _purchaseService;

        // The service is injected here via the constructor
        public PurchaseController(PurchaseService purchaseService)
        {
            _purchaseService = purchaseService;
        }

        /*[HttpPost("cart/add")]
        [Authorize(Roles = "tourist")]
        public async Task<IActionResult> AddToCart([FromBody] AddToCartDto dto)
        {
            try
            {
                var touristId = GetCurrentUserId();
                var updatedCart = await _purchaseService.AddToCartAsync(touristId, dto.TourId);
                return Ok(updatedCart);
            }
            catch (InvalidOperationException ex)
            {
                // This catches specific, expected errors like "tour already in cart"
                return BadRequest(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                // This catches the error if the tour doesn't exist
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                // This catches unexpected errors like service connection problems
                return StatusCode(500, $"An internal error occurred: {ex.Message}");
            }
        }*/

        [HttpGet("cart")]
        [Authorize(Roles = "tourist")]
        public async Task<IActionResult> GetCart()
        {
            var touristId = GetCurrentUserId();
            var cart = await _purchaseService.GetCartAsync(touristId);

            if (cart == null)
            {
                // If the user has never added anything, return an empty cart structure
                return Ok(new { Items = new List<object>(), TotalPrice = 0 });
            }

            // Calculate the total price
            var totalPrice = cart.Items.Sum(item => item.Price);

            return Ok(new { cart.Items, TotalPrice = totalPrice });
        }

        /*[HttpDelete("cart/item/{tourId}")]
        [Authorize(Roles = "tourist")]
        public async Task<IActionResult> RemoveFromCart(string tourId)
        {
            try
            {
                var touristId = GetCurrentUserId();
                var updatedCart = await _purchaseService.RemoveFromCartAsync(touristId, tourId);
                return Ok(updatedCart);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An internal error occurred: {ex.Message}");
            }
        }*/
        [HttpPost("cart/add")]
        [Authorize(Roles = "tourist")]
        public async Task<IActionResult> AddToCart([FromBody] AddToCartDto dto)
        {
            try
            {
                var touristId = GetCurrentUserId();
                var updatedCart = await _purchaseService.AddToCartAsync(touristId, dto.TourId);

                // ISPRAVKA: Izračunaj TotalPrice i vrati konzistentan objekat
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
                var touristId = GetCurrentUserId(); // Imate ispravan touristId ovde

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


        // Helper method to get the current user's ID from the JWT token
        private long GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !long.TryParse(userIdClaim.Value, out var userId))
            {
                // This should not happen if the [Authorize] attribute is working correctly
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
                // ISPRAVKA: Pozivamo servis umesto direktnog pristupa bazi
                var tokens = await _purchaseService.GetPurchaseTokensAsync(touristId);
                return Ok(tokens);
            }
            catch (Exception ex)
            {
                // Dobra praksa je imati obradu grešaka i ovde
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

                // Ako nema greške, checkout je uspeo
                return Ok(new { message = "Purchase successful!" });
            }
            catch (InvalidOperationException ex)
            {
                // Hvata greške kao "korpa je prazna" ili "tura nije dostupna"
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                // Hvata kritične greške kao "plaćanje nije uspelo" ili greške u transakciji
                return StatusCode(500, ex.Message);
            }
        }



        [HttpGet("my-purchased-tours")] // Bolje ime za endpoint
        [Authorize(Roles = "tourist")]
        public async Task<IActionResult> GetMyPurchasedTours()
        {
            try
            {
                var touristId = GetCurrentUserId();
                // Pozivamo novu, pametnu metodu iz servisa
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