import { GuideNavbar } from "../components/GuideNavbar"; // Uvezi Navbar za vodiča

export function GuidePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <GuideNavbar /> {/* Koristi Navbar za vodiča */}
      <main className="p-4 md:p-8">
        <h1 className="text-3xl font-bold">Guide Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Manage your tours and profile here.</p>
        {/* Ovde ćeš kasnije dodavati komponente za listu tura, itd. */}
      </main>
    </div>
  );
}