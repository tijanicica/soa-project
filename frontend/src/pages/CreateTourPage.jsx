import { GuideNavbar } from "../components/GuideNavbar";
import { CreateTourForm } from "../components/CreateTourForm";

export function CreateTourPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <GuideNavbar />
      <main className="p-4 md:p-8 flex justify-center">
        <div className="w-full max-w-3xl">
          <CreateTourForm />
        </div>
      </main>
    </div>
  );
}