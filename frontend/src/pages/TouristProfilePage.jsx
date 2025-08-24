import { TouristNavbar } from "../components/TouristNavbar";
import { ProfileForm } from "../components/ProfileForm"; // Koristimo ISTU formu

export function TouristProfilePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <TouristNavbar />
      <main className="p-4 md:p-8 flex justify-center">
        {/* Turista može imati drugačiji layout ili dodatne sekcije */}
        <div className="w-full max-w-4xl space-y-8">
          <ProfileForm />
           {/* PRIMER: Ovde bi kasnije došle komponente specifične za turistu */}
           {/* <PurchasedToursList /> */}
           {/* <MyWishlist /> */}
        </div>
      </main>
    </div>
  );
}