import { useEffect, useState } from "react";
import { TouristNavbar } from "../components/TouristNavbar";
import { Card, CardContent, CardFooter, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, BarChart3, Coins, Loader2, ShoppingCart, Route, Clock } from "lucide-react";
import { getPublishedTours } from "../services/TourApi";
import { useCart } from "@/contex/CartContex";

export function HomePage() {
  const [tours, setTours] = useState([]);
  const [loadingTours, setLoadingTours] = useState(true);
  const [error, setError] = useState("");
  const [addingTourId, setAddingTourId] = useState(null);

  // Uzimamo samo funkciju za dodavanje, jer nam samo ona treba ovde
  const { addItemToCart } = useCart(); 

  // Funkcija za dodavanje u korpu ostaje ista
  const handleAddToCart = async (tourId) => {
    setAddingTourId(tourId);
    const { success, error } = await addItemToCart(tourId);
    if (success) {
      console.log(`Successfully added tour ${tourId} to cart.`);
    } else {
      alert(`Error: ${error}`);
    }
    setAddingTourId(null);
  };

  // Učitavanje tura ostaje isto
  useEffect(() => {
    const fetchTours = async () => {
      setLoadingTours(true);
      try {
        const data = await getPublishedTours();
        setTours(data);
      } catch (err) {
        setError("Could not load tours. Please try again later.");
        console.error(err);
      } finally {
        setLoadingTours(false);
      }
    };
    fetchTours();
  }, []);

  return (
    <div className="min-h-screen w-full bg-slate-50">
      {/* Navbar se sada poziva bez prop-ova vezanih za korpu */}
      <TouristNavbar />
      
      <main className="flex flex-1 flex-col">
        {/* Ostatak komponente je nepromenjen */}
        <div className="relative w-full h-[300px] md:h-[400px]">
          <img src="/images/hero-background.webp" alt="Beautiful travel destination" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center text-white p-4">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">Find Your Next Adventure</h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-200">
              Explore unique tours created by local guides and discover the world like never before.
            </p>
          </div>
        </div>
        
        <div className="p-4 md-p-6 lg-p-8">
          <h2 className="text-3xl font-bold tracking-tight mb-6">Explore Our Tours</h2>
          
          {loadingTours && <div className="flex justify-center p-12"><Loader2 className="h-10 w-10 animate-spin text-cyan-600" /></div>}
          {error && <p className="text-red-500 text-center">{error}</p>}
          
          {!loadingTours && !error && (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {tours.length > 0 ? tours.map((tour) => (
                <Card key={tour.id} className="flex flex-col overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                  <div className="h-52 w-full bg-slate-200 flex items-center justify-center">
                    {tour.firstKeyPointImageUrl ? (
                       <img src={tour.firstKeyPointImageUrl} alt={tour.name} className="h-full w-full object-cover"/>
                    ) : (
                      <MapPin className="h-16 w-16 text-slate-400" />
                    )}
                  </div>
                  
                  <CardHeader>
                    <CardTitle className="text-xl">{tour.name}</CardTitle>
                    <CardDescription className="pt-1 h-20 overflow-hidden text-ellipsis">
                      {tour.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-grow space-y-4">
                    <div className="space-y-2 text-sm text-muted-foreground pt-2 border-t">
                      
                        <div className="flex items-center gap-2"><Coins className="h-4 w-4 text-cyan-700"/><span>Price: <strong>{tour.price > 0 ? `${tour.price.toFixed(2)} RSD` : 'Free'}</strong></span></div>
                        {tour.firstKeyPointName && (<div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-cyan-700"/><span>Starts at: <strong>{tour.firstKeyPointName}</strong></span></div>)}
                        {tour.distanceKm > 0 && (<div className="flex items-center gap-2"><Route className="h-4 w-4 text-cyan-700"/><span>Distance: <strong>{tour.distanceKm.toFixed(1)} km</strong></span></div>)}
                        {tour.transportTimes && tour.transportTimes.length > 0 && (<div className="flex items-center gap-2"><Clock className="h-4 w-4 text-cyan-700"/><span>Est. Time: <strong>{tour.transportTimes[0].durationMinutes} min ({tour.transportTimes[0].transportType})</strong></span></div>)}
                        
                    </div>
                  </CardContent>

                  <CardFooter className="p-4 border-t mt-auto bg-slate-50">
                    <Button 
                      className="w-full" 
                      onClick={() => handleAddToCart(tour.id)}
                      disabled={addingTourId === tour.id}
                    >
                      {addingTourId === tour.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ShoppingCart className="mr-2 h-4 w-4" />
                      )}
                      {addingTourId === tour.id ? 'Adding...' : 'Add to Cart'}
                    </Button>
                  </CardFooter>
                </Card>
              )) : (
                 <p className="col-span-3 text-center text-muted-foreground">No published tours available at the moment.</p>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ShoppingCartSheet je sada obrisan odavde */}
    </div>
  );
}