import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GuideNavbar } from "../components/GuideNavbar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getMyTours } from "../services/TourApi";
import { Loader2, Edit } from "lucide-react";

export function MyToursPage() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTours = async () => {
      try {
        const data = await getMyTours();
        setTours(data);
      } catch (err) {
        setError("Failed to load your tours.");
         console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTours();
  }, []);

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'published':
        return <Badge variant="success">Published</Badge>; // Trebaće ti custom varijanta u Badge komponenti
      case 'archived':
        return <Badge variant="secondary">Archived</Badge>;
      case 'draft':
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <GuideNavbar />
      <main className="p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Tours</h1>
          <Button onClick={() => navigate('/guide/tours/new')}>Create New Tour</Button>
        </div>
        
        {error ? <p className="text-red-500">{error}</p> : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tour Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tours.length > 0 ? tours.map((tour) => (
                <TableRow key={tour.id}>
                  <TableCell className="font-medium">{tour.name}</TableCell>
                  <TableCell>{getStatusBadge(tour.status)}</TableCell>
                  <TableCell>{new Date(tour.creationDate).toLocaleDateString()}</TableCell> {/* Pretpostavljam da imaš ovo polje */}
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/guide/tours/edit/${tour.id}`)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan="4" className="text-center">You haven't created any tours yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        )}
      </main>
    </div>
  );
}