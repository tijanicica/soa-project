import { GuideNavbar } from "../components/GuideNavbar";
import { ProfileForm } from "../components/ProfileForm"; // Kreiraćemo ovu deljenu komponentu

export function GuideProfilePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <GuideNavbar />
      <main className="p-4 md:p-8 flex justify-center">
        {/* Vodič može imati dodatne sekcije pored osnovnog profila */}
        <div className="w-full max-w-4xl space-y-8">
          <ProfileForm />
          {/* PRIMER: Ovde bi kasnije došle komponente specifične za vodiča */}
          {/* <MyToursList /> */}
          {/* <MyReviewsSummary /> */}
        </div>
      </main>
    </div>
  );
}