import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "../hooks/useAuth";
import { User, LogOut, Shield, Users, Flag } from "lucide-react";

export function AdminNavbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-red-50/80 px-4 backdrop-blur-sm md:px-6">
      <nav className="flex w-full items-center gap-6 text-lg font-medium">
        <Link to="/admin" className="flex items-center gap-2 text-lg font-semibold md:text-base">
          <Shield className="h-6 w-6 text-red-600" />
          <span className="font-bold">TourApp - Admin</span>
        </Link>
        <Link to="/admin/users" className="text-muted-foreground transition-colors hover:text-foreground">
          <Users className="h-4 w-4 mr-2 inline-block"/>
          User Management
        </Link>
        <Link to="/admin/reports" className="text-muted-foreground transition-colors hover:text-foreground">
          <Flag className="h-4 w-4 mr-2 inline-block"/>
          Reports
        </Link>
        <div className="ml-auto flex items-center gap-2">
           <Button onClick={() => navigate('/profile')} variant="ghost" size="icon" className="rounded-full">
            <User className="h-5 w-5" />
          </Button>
          <Button onClick={handleLogout} variant="destructive" size="sm">Logout</Button>
        </div>
      </nav>
    </header>
  );
}