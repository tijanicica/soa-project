using PurchaseService;
namespace purchase_service.GrpcServices;
using Grpc.Core;

public class PurchaseVerificationService : PurchaseVerification.PurchaseVerificationBase
{
    private readonly purchase_service.Services.PurchaseService _purchaseService;

    public PurchaseVerificationService(purchase_service.Services.PurchaseService purchaseService)
    {
        _purchaseService = purchaseService;
    }

    public override async Task<PurchaseCheckResponse> HasUserPurchasedTour(PurchaseCheckRequest request, ServerCallContext context)
    {
        var hasPurchased = await _purchaseService.HasUserPurchasedTourAsync(request.TouristId, request.TourId);
        return new PurchaseCheckResponse { HasPurchased = hasPurchased };
    }
}