import { GuideNavbar } from "../components/GuideNavbar";
import { EditTourForm } from "../components/EditTourForm";

export function EditTourPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <GuideNavbar />
      <main className="p-4 md:p-8 flex justify-center">
        <div className="w-full max-w-4xl">
          <EditTourForm />
        </div>
      </main>
    </div>
  );
}