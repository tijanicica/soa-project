import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

// Dobijamo novu funkciju onRemoveItem
export function ShoppingCartDrawer({ isOpen, onClose, cart, isLoading, onCheckout, onRemoveItem }) {
  const navigate = useNavigate();
  // Stanje za praćenje koja se stavka trenutno briše
  const [removingItemId, setRemovingItemId] = useState(null);

  const handleCheckout = async () => {
    const success = await onCheckout();
    if (success) {
      onClose();
      navigate('/my-purchased-tours');
    }
  };

  const handleRemove = async (tourId) => {
    setRemovingItemId(tourId);
    await onRemoveItem(tourId);
    setRemovingItemId(null);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart /> My Cart
          </SheetTitle>
        </SheetHeader>
        
        {isLoading ? (
          <div className="flex-1 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
          </div>
        ) : cart && cart.items.length > 0 ? (
          <>
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {cart.items.map(item => (
                <div key={item.tourId} className="flex justify-between items-center p-2 border rounded-md">
                  <div className="flex-1 overflow-hidden">
                    <p className="font-semibold truncate">{item.tourName}</p>
                    <p className="text-sm text-muted-foreground">{item.price.toFixed(2)} RSD</p>
                    {/* PRIKAZUJEMO ID TURE */}
                    <p className="text-xs text-slate-400 mt-1">ID: {item.tourId}</p>
                  </div>
                  {/* DUGME ZA UKLANJANJE */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRemove(item.tourId)}
                    disabled={removingItemId === item.tourId}
                    className="ml-2"
                  >
                    {removingItemId === item.tourId ? (
                       <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                       <Trash2 className="h-4 w-4 text-red-500" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
            <SheetFooter className="mt-auto border-t pt-4">
              <div className="w-full space-y-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>{cart.totalPrice.toFixed(2)} RSD</span>
                </div>
                <Button onClick={handleCheckout} className="w-full" disabled={!onCheckout}>
                  Proceed to Checkout
                </Button>
              </div>
            </SheetFooter>
          </>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-center">
            <ShoppingCart className="h-20 w-20 text-slate-300" />
            <p className="mt-4 font-semibold">Your cart is empty</p>
            <Button variant="link" onClick={onClose}>Continue Shopping</Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}