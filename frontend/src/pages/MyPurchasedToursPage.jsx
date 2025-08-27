import { useEffect, useState } from "react";
import { TouristNavbar } from "../components/TouristNavbar";
// ISPRAVKA: Uvozimo funkciju koja nedostaje
import { getMyPurchaseTokens } from "../services/PurchaseApi"; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Loader2, Key, Calendar, Ticket } from "lucide-react";

// ISPRAVKA: Dodata je 'export' ključna reč
export function MyPurchasedToursPage() {
  const [purchasedTours, setPurchasedTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMyTours = async () => {
      setLoading(true);
      try {
        const tokensResponse = await getMyPurchaseTokens();
        const tokens = tokensResponse.data;

        if (tokens.length === 0) {
          setPurchasedTours([]);
          return; // Ne zaboravite 'finally' će se svakako izvršiti
        }

        const tourDetailsPromises = tokens.map(token => 
            getTourDetails(token.tourId).then(response => ({
                ...response.data,
                purchaseDate: token.purchaseDate
            }))
        );
        
        const resolvedTours = await Promise.all(tourDetailsPromises);
        setPurchasedTours(resolvedTours);

      } catch (err) {
        setError("Could not load your purchased tours. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMyTours();
  }, []);

  // Ostatak komponente je bio u redu, ostaje isti...
  return (
    <div className="min-h-screen w-full bg-slate-50">
      <TouristNavbar onCartClick={() => { /* Implement if needed */ }} />
      <main className="container py-8">
        <div className="mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight">My Purchased Tours</h1>
            <p className="text-muted-foreground mt-2">Here you can find all the adventures you've unlocked.</p>
        </div>

        {loading && <div className="flex justify-center p-12"><Loader2 className="h-10 w-10 animate-spin text-cyan-600" /></div>}
        {error && <p className="text-red-500 text-center">{error}</p>}

        {!loading && !error && (
          <>
            {purchasedTours.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {purchasedTours.map((tour) => (
                  <Card key={tour.id} className="flex flex-col">
                    <CardHeader>
                      <CardTitle>{tour.name}</CardTitle>
                      <CardDescription className="pt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Purchased on: {new Date(tour.purchaseDate).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-sm text-muted-foreground line-clamp-3">{tour.description}</p>
                    </CardContent>
                    <CardFooter>
                      <Button asChild className="w-full">
                        <Link to={`/tours/${tour.id}`}>
                          <Key className="mr-2 h-4 w-4" /> View Full Tour Details
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <Ticket className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-4 text-lg font-semibold">No adventures yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">You haven't purchased any tours. Let's find your next one!</p>
                <Button asChild className="mt-6">
                  <Link to="/home">Explore Tours</Link>
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}