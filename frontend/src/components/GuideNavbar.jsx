import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "../hooks/useAuth";
import { User, LogOut, Compass, PlusCircle, LayoutDashboard, List } from "lucide-react";

export function GuideNavbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-white/95 px-4 backdrop-blur-sm md:px-6">
      <nav className="flex w-full items-center gap-6 text-lg font-medium">
        <Link to="/guide" className="flex items-center gap-2 text-lg font-semibold md:text-base">
          <Compass className="h-6 w-6 text-emerald-600" />
          <span className="font-bold">TourApp - Guide</span>
        </Link>
        <Link to="/guide/dashboard" className="text-muted-foreground transition-colors hover:text-foreground">
          <LayoutDashboard className="h-4 w-4 mr-2 inline-block"/>
          My Dashboard
        </Link>
        <Link to="/guide/tours/new" className="text-muted-foreground transition-colors hover:text-foreground">
          <PlusCircle className="h-4 w-4 mr-2 inline-block"/>
          Create Tour
        </Link>
         <Link to="/guide/my-tours" className="text-muted-foreground transition-colors hover:text-foreground">
          <List className="h-4 w-4 mr-2 inline-block"/>
          My Tours
        </Link>
        <div className="ml-auto flex items-center gap-2">
           <Button onClick={() => navigate('/guide/profile')} variant="ghost" size="icon" className="rounded-full">
            <User className="h-5 w-5" />
          </Button>
          <Button onClick={handleLogout} variant="ghost" size="sm">Logout</Button>
        </div>
      </nav>
    </header>
  );
}