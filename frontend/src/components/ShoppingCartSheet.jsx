import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contex/CartContex";
import { Loader2, Trash2, ShoppingCart as ShoppingCartIcon } from "lucide-react";

export function ShoppingCartSheet({ isOpen, onOpenChange }) {
  // Stanja za prikazivanje spinnera na dugmićima
  const [removingItemId, setRemovingItemId] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Sva logika i stanje dolaze direktno iz globalnog konteksta
  const { cart, loading, error, removeItemFromCart, checkoutCart } = useCart();

  // Handler funkcije sada ne koriste toast
  const handleRemoveItem = async (tourId) => {
    setRemovingItemId(tourId);
    await removeItemFromCart(tourId);
    console.log(`Removed item ${tourId} from cart.`);
    setRemovingItemId(null);
  };

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    const { success, error } = await checkoutCart();
    if (success) {
      console.log("Checkout successful!");
      onOpenChange(false); // Automatski zatvori Sheet nakon uspešnog checkout-a
    } else {
      alert(`Checkout failed: ${error}`);
    }
    setIsCheckingOut(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Your Shopping Cart</SheetTitle>
        </SheetHeader>
        <div className="flex-grow overflow-y-auto pr-6">
          {loading && <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}
          {error && <p className="text-red-500 text-center p-4">{error}</p>}
          
          {!loading && !error && cart && (
            <>
              {/* ISPRAVKA: Koristi se cart.Items umesto cart.items */}
              {cart.Items?.length > 0 ? (
                <div className="divide-y">
                  {/* ISPRAVKA: Koristi se cart.Items umesto cart.items */}
                  {cart.Items.map(item => (
                    // ISPRAVKA: Svi property-ji unutar item objekta su sada PascalCase
                    <div key={item.TourId} className="flex justify-between items-center py-4">
                      <div>
                        <p className="font-semibold">{item.Name}</p>
                        <p className="text-sm text-muted-foreground">{item.Price.toFixed(2)} RSD</p>
                        <p className="text-xs text-slate-400 mt-1">ID: {item.TourId}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleRemoveItem(item.TourId)}
                        disabled={removingItemId === item.TourId}
                      >
                        {removingItemId === item.TourId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="h-4 w-4 text-red-500" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground pt-16">
                  <ShoppingCartIcon className="mx-auto h-12 w-12" />
                  <p className="mt-4">Your cart is empty.</p>
                </div>
              )}
            </>
          )}
        </div>
        {/* ISPRAVKA: Koristi se cart.Items umesto cart.items */}
        {cart && cart.Items?.length > 0 && (
          <SheetFooter className="border-t pt-4">
            <div className="w-full">
              <div className="flex justify-between font-bold text-lg mb-4">
                <span>Total:</span>
                {/* ISPRAVKA: Koristi se cart.TotalPrice umesto cart.totalPrice */}
                <span>{cart.TotalPrice?.toFixed(2) ?? '0.00'} RSD</span>
              </div>
              <Button 
                className="w-full" 
                size="lg" 
                onClick={handleCheckout}
                disabled={isCheckingOut}
              >
                {isCheckingOut && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Proceed to Checkout
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}