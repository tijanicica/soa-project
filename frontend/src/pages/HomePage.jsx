import { useEffect, useState } from "react";
import { TouristNavbar } from "../components/TouristNavbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Tag, BarChart3, Coins, Loader2 } from "lucide-react";
import { getPublishedTours } from "../services/TourApi"; // <-- Uvozimo novu funkciju

export function HomePage() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTours = async () => {
      try {
        const data = await getPublishedTours();
        setTours(data);
      } catch (err) {
        setError("Could not load tours. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTours();
  }, []);

 return (
    <div className="min-h-screen w-full bg-slate-50">
      <TouristNavbar />
      
      <main className="flex flex-1 flex-col">
        {/* === NOVI "HERO" BANER (BEZ PRETRAGE) === */}
        <div className="relative w-full h-[300px] md:h-[400px]">
          <img src="/images/hero-background.webp" alt="Beautiful travel destination" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center text-white p-4">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">Find Your Next Adventure</h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-200">
              Explore unique tours created by local guides and discover the world like never before.
            </p>
          </div>
        </div>
        
        {/* === Sekcija sa Turama === */}
        <div className="p-4 md:p-6 lg:p-8">
          <h2 className="text-3xl font-bold tracking-tight mb-6">Explore Our Tours</h2>
          
          {loading && <div className="flex justify-center p-12"><Loader2 className="h-10 w-10 animate-spin text-cyan-600" /></div>}
          {error && <p className="text-red-500 text-center">{error}</p>}
          
          {!loading && !error && (
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
                </Card>
              )) : (
                 <p className="col-span-3 text-center text-muted-foreground">No published tours available at the moment.</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
