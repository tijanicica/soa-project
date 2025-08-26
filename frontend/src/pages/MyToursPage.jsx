import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GuideNavbar } from "../components/GuideNavbar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getMyTours, publishTour, archiveTour, reactivateTour } from "../services/TourApi";
import { Loader2, Edit } from "lucide-react";

export function MyToursPage() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchTours = async () => {
    try {
      // setLoading(true); // Opciono: može da se ukloni da bi osvežavanje bilo "tiho"
      const data = await getMyTours();
      setTours(data);
    } catch (err) {
      setError("Failed to load your tours.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTours();
  }, []);

  const handleStatusChange = async (action, tourId) => {
    if (!window.confirm(`Are you sure you want to ${action} this tour?`)) {
      return;
    }
    try {
      switch(action) {
        case 'publish':
          await publishTour(tourId);
          break;
        case 'archive':
          await archiveTour(tourId);
          break;
        case 'reactivate':
          await reactivateTour(tourId);
          break;
        default:
          return;
      }
      fetchTours(); // Ponovo učitaj ture da se vidi promena
    } catch (err) {
      const errorMessage = err.response?.data || `Failed to ${action} the tour. Make sure all conditions are met.`;
      alert(errorMessage);
      console.error(err);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'published':
        return <Badge variant="success">Published</Badge>;
      case 'archived':
        return <Badge variant="secondary">Archived</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  const renderActionButtons = (tour) => {
    const status = tour.status?.toLowerCase();
    return (
      <div className="flex justify-end items-center gap-2">
        {status === 'draft' && (
          <Button size="sm" variant="success" onClick={() => handleStatusChange('publish', tour.id)}>
            Publish
          </Button>
        )}
        {status === 'published' && (
          <Button size="sm" variant="secondary" onClick={() => handleStatusChange('archive', tour.id)}>
            Archive
          </Button>
        )}
        {status === 'archived' && (
          <Button size="sm" onClick={() => handleStatusChange('reactivate', tour.id)}>
            Reactivate
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={() => navigate(`/guide/tours/edit/${tour.id}`)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </div>
    );
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
        <div className="border rounded-lg bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tour Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Update</TableHead>
                <TableHead className="text-right w-[250px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tours.length > 0 ? tours.map((tour) => (
                <TableRow key={tour.id}>
                  <TableCell className="font-medium">{tour.name}</TableCell>
                  <TableCell>{getStatusBadge(tour.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {tour.status?.toLowerCase() === 'published' && tour.publishTime 
                      ? `Published on ${new Date(tour.publishTime).toLocaleDateString()}`
                      : tour.status?.toLowerCase() === 'archived' && tour.archiveTime
                      ? `Archived on ${new Date(tour.archiveTime).toLocaleDateString()}`
                      : `Created on ${new Date(tour.creationDate).toLocaleDateString()}`
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    {renderActionButtons(tour)}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan="4" className="text-center h-24">You haven't created any tours yet.</TableCell>
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
