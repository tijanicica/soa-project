using Microsoft.EntityFrameworkCore;
using purchase_service.Models;

namespace purchase_service.Data
{
    public class PurchaseDbContext : DbContext
    {
        public PurchaseDbContext(DbContextOptions<PurchaseDbContext> options) : base(options) { }

        public DbSet<ShoppingCart> ShoppingCarts { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<TourPurchaseToken> PurchaseTokens { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<OrderItem>()
                .HasOne<ShoppingCart>()
                .WithMany(sc => sc.Items)
                .HasForeignKey(oi => oi.ShoppingCartTouristId);

            modelBuilder.Entity<OrderItem>()
                .HasIndex(oi => new { oi.ShoppingCartTouristId, oi.TourId })
                .IsUnique();
        }
    }
}