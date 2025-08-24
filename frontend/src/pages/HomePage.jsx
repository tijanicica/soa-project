import { TouristNavbar } from "../components/TouristNavbar";
// --- POČETAK ISPRAVKE: Dodati importi za komponente ---
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input"; // KLJUČNI IMPORT KOJI JE NEDOSTAJAO
import { Search } from "lucide-react";
import { Link } from "react-router-dom";
// --- KRAJ ISPRAVKE ---

// Primer podataka za ture - kasnije ćeš ovo dobavljati sa backenda
const featuredTours = [
  { id: 1, title: "Historical Walk through Old Town", guide: "Pera Peric", rating: 4.8, imageUrl: "/images/tour1.webp" },
  { id: 2, title: "Riverside Cycling Adventure", guide: "Ana Anic", rating: 4.9, imageUrl: "/images/tour2.webp" },
  { id: 3, title: "Hidden Gems Food Tour", guide: "Marko Markovic", rating: 5.0, imageUrl: "/images/tour3.webp" },
];

export function HomePage() {
  return (
    <div className="min-h-screen w-full bg-slate-50">
      <TouristNavbar />
      
      <main className="flex flex-1 flex-col p-4 md:p-6 lg:p-8">
        {/* === Glavni Hero Section === */}
        <div className="relative w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden mb-8">
          <img src="/images/hero-background.webp" alt="Beautiful destination" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center text-white p-4">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">Find Your Next Adventure</h1>
            <p className="mt-4 max-w-2xl text-lg">Explore unique tours created by local guides and discover the world like never before.</p>
            <div className="mt-6 w-full max-w-lg">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input type="search" placeholder="Search for a city, tour, or guide..." className="w-full pl-10 h-12 rounded-full bg-white/90 text-gray-800" />
              </div>
            </div>
          </div>
        </div>

        {/* === Sekcija sa Izdvojenim Turama === */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight mb-4">Featured Tours</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredTours.map((tour) => (
              <Card key={tour.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <img src={tour.imageUrl} alt={tour.title} className="h-48 w-full object-cover"/>
                <CardHeader>
                  <CardTitle>{tour.title}</CardTitle>
                  <CardDescription>By {tour.guide}</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-between items-center">
                  <span className="font-semibold">{`⭐ ${tour.rating}`}</span>
                  <Link to={`/tours/${tour.id}`}>
                    <Button>View Details</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}