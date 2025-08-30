// U fajlu: src/pages/MyPurchasedToursPage.jsx

import { useEffect, useState } from "react";
import { TouristNavbar } from "../components/TouristNavbar";
import { getMyPurchaseTokens } from "../services/PurchaseApi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Loader2, Calendar, Ticket, MapPin, Image as ImageIcon, Milestone, BarChart3, Route, Clock, Tag, Coins } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export function MyPurchasedToursPage() {
  const [purchasedTours, setPurchasedTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMyTours = async () => {
      setLoading(true);
      setError("");
      try {
        const tours = await getMyPurchaseTokens();
        setPurchasedTours(tours);
      } catch (err) {
        setError("Could not load your purchased tours. Please try again later.");
        console.error("Greška pri dohvatanju kupljenih tura:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMyTours();
  }, []);

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <TouristNavbar />
      {/* --- POČETAK IZMENA: Centriranje glavnog sadržaja --- */}
      <main className="container max-w-7xl mx-auto py-8 md:py-12">
        <div className="mb-10">
            <h1 className="text-4xl font-extrabold tracking-tight">My Purchased Tours</h1>
            <p className="text-muted-foreground mt-2">Here you can find all the adventures you've unlocked.</p>
        </div>

        {loading && <div className="flex justify-center p-12"><Loader2 className="h-10 w-10 animate-spin text-cyan-600" /></div>}
        {error && <p className="text-red-500 text-center">{error}</p>}

        {!loading && !error && (
          <>
            {purchasedTours.length > 0 ? (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {purchasedTours.map((tour) => (
                  <Card key={tour.Id} className="flex flex-col overflow-hidden shadow-sm">
                    
                    <CardContent className="p-0">
                      <div className="h-48 w-full bg-slate-200 flex items-center justify-center">
                        {tour.KeyPoints && tour.KeyPoints.length > 0 && tour.KeyPoints[0].ImageUrl ? (
                          <img src={tour.KeyPoints[0].ImageUrl} alt={tour.Name} className="h-full w-full object-cover"/>
                        ) : (
                          <MapPin className="h-16 w-16 text-slate-400" />
                        )}
                      </div>
                    </CardContent>

                    <CardHeader>
                      <CardTitle>{tour.Name}</CardTitle>
                      <CardDescription className="pt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Purchased on: {new Date(tour.PurchaseDate).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Tag className="h-4 w-4 text-cyan-700 shrink-0"/>
                            Tags: <div className="flex flex-wrap gap-1">{tour.Tags?.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}</div>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <BarChart3 className="h-4 w-4 text-cyan-700 shrink-0"/>
                            <span>Difficulty: <strong>{tour.Difficulty}</strong></span>
                        </div>
                         <div className="flex items-center gap-2 text-muted-foreground">
                            <Coins className="h-4 w-4 text-cyan-700 shrink-0"/>
                            <span>Price: <strong>{tour.Price.toFixed(2)} RSD</strong></span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Route className="h-4 w-4 text-cyan-700 shrink-0"/>
                            <span>Distance: <strong>{tour.DistanceKm.toFixed(1)} km</strong></span>
                        </div>
                        {tour.TransportTimes && tour.TransportTimes.length > 0 && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4 text-cyan-700 shrink-0"/>
                            {/* --- ISPRAVKA: Pristup 'transportType' i 'durationMinutes' --- */}
                            <span>Est. Time: <strong>{tour.TransportTimes[0].durationMinutes} min ({tour.TransportTimes[0].transportType})</strong></span>
                          </div>
                        )}
                      </div>
                      
                      <Accordion type="single" collapsible className="w-full">
                         <AccordionItem value="item-1">
                            <AccordionTrigger>Key Points ({tour.KeyPoints.length})</AccordionTrigger>
                            <AccordionContent>
                                <div className="space-y-4">
                                {/* --- ISPRAVKA: Mapiranje kroz KeyPoints za prikaz slika --- */}
                                {tour.KeyPoints.map((kp, index) => (
                                    <div key={index} className="border-t pt-4">
                                        <h4 className="font-semibold flex items-center gap-2"><MapPin className="h-4 w-4" /> {kp.Name}</h4>
                                        {kp.ImageUrl ? (
                                            <img src={kp.ImageUrl} alt={kp.Name} className="w-full h-auto max-h-48 object-cover rounded-md my-2 border" />
                                        ) : (
                                            <div className="w-full h-24 bg-slate-100 flex items-center justify-center rounded-md my-2">
                                                <ImageIcon className="h-8 w-8 text-slate-400" />
                                            </div>
                                        )}
                                        <p className="text-xs text-muted-foreground">{kp.Description}</p>
                                    </div>
                                ))}
                                </div>
                            </AccordionContent>
                         </AccordionItem>
                      </Accordion>
                    </CardContent>
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