import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "../hooks/useAuth";
import { User, LogOut, Compass, Map, Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";

export function TouristNavbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-white/95 px-4 backdrop-blur-sm md:px-6">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          to="/home"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <Compass className="h-6 w-6 text-cyan-600" />
          <span className="font-bold">TourApp</span>
        </Link>
        <Link
          to="/tours/search"
          className="text-foreground transition-colors hover:text-foreground"
        >
          Find Tours
        </Link>
        <Link
          to="/blogs"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          Blogs
        </Link>
        <Link
          to="/community"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          Community
        </Link>
        <Link
          to="/network"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          My Network
        </Link>
        <Link
          to="/location-simulator"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          Location Simulator
        </Link>
        <Link
          to="/simulator"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          Position Simulator
        </Link>
      </nav>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <form className="ml-auto flex-1 sm:flex-initial">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tours..."
              className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
            />
          </div>
        </form>
        <Button
          onClick={() => navigate("/tourist/profile")}
          variant="ghost"
          size="icon"
          className="rounded-full"
        >
          <User className="h-5 w-5" />
        </Button>
        <Button onClick={handleLogout} variant="ghost" size="sm">
          Logout
        </Button>
      </div>
    </header>
  );
}
