import { useEffect, useState } from "react";
import { TouristNavbar } from "../components/TouristNavbar.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, BarChart3, Coins, Loader2 } from "lucide-react";
import { getPublishedTours } from "../services/TourApi.js";
import { ReviewForm } from "../components/ReviewForm.jsx";
import { useAuth } from "../hooks/useAuth.js";

// Pomoćna komponenta za prikaz jedne kartice ture
function TourCard({ tour, onReviewClick }) {
  const { auth } = useAuth(); // Uzimamo podatke o ulogovanom korisniku

  const shortDescription = tour.description.length > 100 
    ? `${tour.description.substring(0, 100)}...` 
    : tour.description;
  
  const coverImage = tour.firstKeyPointImageUrl || '/placeholder.png'; // Koristi sliku prve tačke ili lokalni placeholder

  return (
    <Card className="flex flex-col overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
      <div className="h-52 w-full bg-slate-200 flex items-center justify-center">
        <img src={coverImage} alt={tour.name} className="h-full w-full object-cover"/>
      </div>
      
      <CardHeader>
        <CardTitle className="text-xl">{tour.name}</CardTitle>
        <CardDescription className="pt-1 h-20 overflow-hidden text-ellipsis">
          {shortDescription}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-grow space-y-4">
        <div className="flex flex-wrap gap-2">
          {tour.tags?.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
        </div>

        <div className="space-y-2 text-sm text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-cyan-700"/>
              <span>Difficulty: <strong>{tour.difficulty}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-cyan-700"/>
              <span>Price: <strong>{tour.price > 0 ? `${tour.price.toFixed(2)} RSD` : 'Free'}</strong></span>
            </div>
            {tour.firstKeyPointName && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-cyan-700"/>
                <span>Starts at: <strong>{tour.firstKeyPointName}</strong></span>
              </div>
            )}
        </div>
      </CardContent>
      
      <CardFooter>
        {/* Dugme se prikazuje samo ako je korisnik ulogovan i ako je turista */}
        {auth.user?.role === 'tourist' && (
          <Button className="w-full" onClick={() => onReviewClick(tour)}>
            Leave a Review
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// Glavna komponenta stranice
export function HomePage() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Stanje za upravljanje prozorom za recenziju
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [selectedTour, setSelectedTour] = useState(null);

  // Funkcija za dohvatanje tura sa servera
  const fetchTours = async () => {
    try {
      setLoading(true);
      const data = await getPublishedTours();
      setTours(data);
    } catch (err) {
      setError("Could not load tours. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTours();
  }, []);

  // Funkcija koja se poziva kada korisnik klikne na dugme za recenziju
  const handleReviewClick = (tour) => {
    setSelectedTour(tour);
    setIsReviewFormOpen(true);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <TouristNavbar />
      
      <main className="flex flex-1 flex-col">
        {/* Hero baner */}
        <div className="relative w-full h-[300px] md:h-[400px]">
          <img src="/placeholder.png" alt="Beautiful travel destination" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center text-white p-4">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">Find Your Next Adventure</h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-200">
              Explore unique tours created by local guides and discover the world like never before.
            </p>
          </div>
        </div>
        
        {/* Sekcija sa listom tura */}
        <div className="p-4 md:p-6 lg:p-8">
          <h2 className="text-3xl font-bold tracking-tight mb-6">Explore Our Tours</h2>
          
          {loading && <div className="flex justify-center p-12"><Loader2 className="h-10 w-10 animate-spin text-cyan-600" /></div>}
          {error && <p className="text-red-500 text-center">{error}</p>}
          
          {!loading && !error && (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {tours.length > 0 ? tours.map((tour) => (
                <TourCard 
                  key={tour.id} 
                  tour={tour} 
                  onReviewClick={handleReviewClick} 
                />
              )) : (
                 <p className="col-span-3 text-center text-muted-foreground">No published tours available at the moment.</p>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Prozor za recenziju, prikazuje se samo ako je odabrana neka tura */}
      {selectedTour && (
        <ReviewForm 
          open={isReviewFormOpen}
          onOpenChange={setIsReviewFormOpen}
          tour={selectedTour}
          onReviewSubmitted={() => {
            alert('Thank you for your review!');
            // Idealno, ovde bismo osvežili podatke da se prikaže nova recenzija
            // fetchTours(); 
          }}
        />
      )}
    </div>
  );
}