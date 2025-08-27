import { useEffect, useState } from "react";
import { TouristNavbar } from "../components/TouristNavbar";
import { getPurchasedTours } from "../services/TourApi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function MyPurchasedToursPage() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTours = async () => {
      try {
        // Koristimo API funkciju koju smo ranije napravili
        const data = await getPurchasedTours();
        setTours(data);
      } catch (error) {
        console.error("Failed to fetch purchased tours:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTours();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-cyan-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <TouristNavbar />
      <main className="p-4 md:p-8">
        <h1 className="text-3xl font-bold tracking-tight mb-6 flex items-center gap-3">
          <Ticket className="h-8 w-8 text-cyan-700" />
          My Purchased Tours
        </h1>

        {tours.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tours.map(tour => (
              <Card key={tour.id}>
                <CardHeader>
                  <CardTitle>{tour.name}</CardTitle>
                  <CardDescription>{tour.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="flex flex-wrap gap-2">
                      {tour.tags?.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                    </div>
                  <div>
                    <h4 className="font-semibold mb-2">Key Points:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {/* OVDE PRIKAZUJEMO SVE KLJUČNE TAČKE */}
                      {tour.keyPoints.map(kp => (
                        <li key={kp.id}>{kp.name}</li>
                      ))}
                    </ul>
                  </div>
                  {/* Ovde možete dodati dugme za početak ture, npr. */}
                  {/* <Button className="w-full">Start Tour</Button> */}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Ticket className="mx-auto h-24 w-24 text-slate-300" />
            <h2 className="mt-4 text-xl font-semibold">You haven't purchased any tours yet.</h2>
            <Button onClick={() => navigate('/')} className="mt-6">Explore Tours</Button>
          </div>
        )}
      </main>
    </div>
  );
}