import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contex/CartContex";
import { Loader2, Trash2, ShoppingCart as ShoppingCartIcon, Tag } from "lucide-react";

export function ShoppingCartSheet({ isOpen, onOpenChange }) {
  const [removingItemId, setRemovingItemId] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const { cart, loading, error, removeItemFromCart, checkoutCart } = useCart();

  const handleRemoveItem = async (tourId) => {
    setRemovingItemId(tourId);
    await removeItemFromCart(tourId);
    setRemovingItemId(null);
  };

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    const { success, error } = await checkoutCart();
    if (success) {
      console.log("Checkout successful!");
      onOpenChange(false);
    } else {
      alert(`Checkout failed: ${error}`);
    }
    setIsCheckingOut(false);
  };

// U fajlu: src/components/ShoppingCartSheet.jsx

return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
     <SheetContent className="flex flex-col bg-slate-50 w-full sm:max-w-[480px]">
        
        {/* === HEADER === */}
        {/* Nema negativne margine, poravnat je sa ostatkom sadržaja */}
        <SheetHeader className="text-center border-b pb-4 shrink-0">
          <SheetTitle className="text-xl font-semibold">Your Shopping Cart</SheetTitle>
        </SheetHeader>
        
        {/* === GLAVNI SADRŽAJ === */}
        <div className="flex-grow overflow-y-auto py-2">
          {loading && <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-cyan-600" /></div>}
          {error && <p className="text-red-500 text-center p-4">{error}</p>}
          
          {!loading && !error && cart && (
            <>
              {cart.Items?.length > 0 ? (
                <div className="divide-y divide-slate-200">
                  {cart.Items.map(item => (
                    <div key={item.TourId} className="flex items-start gap-4 py-4 px-2">
                      <div className="bg-slate-200 p-3 rounded-lg mt-1">
                        <Tag className="h-5 w-5 text-slate-500" />
                      </div>
                      <div className="flex-grow">
                        <p className="font-semibold text-base leading-tight">{item.Name}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Price: <strong className="font-medium text-slate-800">{item.Price.toFixed(2)} RSD</strong>
                        </p>
                        <p className="text-xs text-slate-500 mt-1 font-mono">
                          ID: {item.TourId}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="shrink-0 text-slate-500 hover:text-red-500 hover:bg-red-100 transition-colors"
                        onClick={() => handleRemoveItem(item.TourId)}
                        disabled={removingItemId === item.TourId}
                      >
                        {removingItemId === item.TourId ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Trash2 className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <ShoppingCartIcon className="h-16 w-16 mb-4 text-slate-300" />
                  <h3 className="text-lg font-semibold">Your cart is empty</h3>
                  <p className="text-sm">Add tours to see them here.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* === FOOTER === */}
        {cart && cart.Items?.length > 0 && (
          // Nema negativne margine, poravnat je i ima 'shrink-0' da se ne bi smanjivao
          <SheetFooter className="border-t pt-6 shrink-0">
            <div className="w-full">
              <div className="flex justify-between font-bold text-lg mb-4">
                <span>Total:</span>
                <span>{cart.TotalPrice?.toFixed(2) ?? '0.00'} RSD</span>
              </div>
              <Button 
                className="w-full text-white bg-cyan-600 hover:bg-cyan-700" 
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