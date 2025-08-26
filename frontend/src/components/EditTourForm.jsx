import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getTourById, updateTour, addKeypointToTour, deleteKeypoint, updateKeypoint, uploadTourImage } from "../services/TourApi";
import { KeypointMap } from "./KeypointMap"; 
import { KeypointFormDialog } from "./KeypointFormDialog";
import { Loader2, AlertCircle, CheckCircle, Trash2, Edit } from "lucide-react";

export function EditTourForm() {
  const { tourId } = useParams();
  const [tourData, setTourData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCoordinates, setNewCoordinates] = useState(null);

  const [editingKeypoint, setEditingKeypoint] = useState(null);


   // Korak 2: "Umotaj" funkciju
  const fetchTourData = useCallback(async () => {
    setError(""); // Dobra praksa je da se resetuje greška pri svakom novom dohvatanju
    setLoading(true);
    try {
      const data = await getTourById(tourId);
      setTourData({
          ...data,
          tags: data.tags?.join(', ') || ''
      });
    } catch (err) {
      console.error("Failed to load tour data:", err);
      setError("Failed to load tour data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [tourId]); // Zavisnost je tourId

  // Korak 3: Ažuriraj useEffect
  useEffect(() => {
    fetchTourData();
  }, [fetchTourData]); // Zavisnost je sada funkcija


  const handleChange = (e) => {
    setTourData({ ...tourData, [e.target.name]: e.target.value });
  };

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        ...tourData,
        tags: tourData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      };
      await updateTour(tourId, payload);
      setSuccess("Tour details saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Failed to save changes.";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleMapClick = (latlng) => {
    setNewCoordinates(latlng);
    setEditingKeypoint(null);
    setIsDialogOpen(true);
  };

   const handleEditClick = (keypoint) => {
    console.log("Editing keypoint:", keypoint); 
    setEditingKeypoint(keypoint);
    setIsDialogOpen(true);
  };

 
  
const handleSaveKeypoint = async (keypointData, imageFile) => {
    try {
        // Kreiramo finalni objekat samo sa imenom i opisom iz forme
        let finalPayload = {
            name: keypointData.name,
            description: keypointData.description,
        };

        // 1. Ako je korisnik odabrao novi fajl, uploaduj ga i dodaj URL u payload
        if (imageFile) {
            const uploadResponse = await uploadTourImage(imageFile);
            finalPayload.imageUrl = uploadResponse.imageUrl;
        } 
        // 2. Ako NE postoji novi fajl I U EDIT MODU SMO, zadrži stari URL
        else if (editingKeypoint) {
            finalPayload.imageUrl = editingKeypoint.imageUrl;
        }

        // 3. Proveri da li editujemo ili dodajemo novi
        if (editingKeypoint) {
            // Editujemo postojeći: šaljemo samo ono što se menja
            await updateKeypoint(tourId, editingKeypoint.id, finalPayload);
        } else {
            // Dodajemo novi: moramo dodati i koordinate
            finalPayload.latitude = keypointData.latitude;
            finalPayload.longitude = keypointData.longitude;
            await addKeypointToTour(tourId, finalPayload);
        }

      setIsDialogOpen(false);
      setEditingKeypoint(null);
      fetchTourData();
    } catch (err) {
      alert("Failed to save keypoint.");
      console.error(err);
    }
};

  const handleDeleteKeypoint = async (keypointId) => {
    if (window.confirm("Are you sure you want to delete this keypoint?")) {
      try {
        await deleteKeypoint(tourId, keypointId);
        fetchTourData(); // Osveži podatke o turi da se ukloni tačka
      } catch (err) {
        alert("Failed to delete keypoint.");
        console.error(err);
      }
    }
  }

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (error && !tourData) return <p className="text-red-500">{error}</p>;
  if (!tourData) return <p>Tour not found.</p>;

  return (
    <div className="space-y-8">
      <form onSubmit={handleDetailsSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Edit Tour Details</CardTitle>
            <CardDescription>Update the basic information for your tour.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Tour Name</Label>
              <Input id="name" name="name" value={tourData.name} onChange={handleChange} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" value={tourData.description} onChange={handleChange} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <select id="difficulty" name="difficulty" value={tourData.difficulty} onChange={handleChange} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input id="tags" name="tags" value={tourData.tags} onChange={handleChange} required />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between items-center border-t pt-4">
            <div className="text-sm h-5">
              {success && <span className="text-green-600 flex items-center gap-2"><CheckCircle className="h-4 w-4" /> {success}</span>}
              {error && <span className="text-red-500 flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {error}</span>}
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Basic Info"}
            </Button>
          </CardFooter>
        </Card>
      </form>
      
      <Card>
        <CardHeader>
          <CardTitle>Keypoints</CardTitle>
          <CardDescription>Click on the map to add a new keypoint. Current keypoints are shown below.</CardDescription>
        </CardHeader>
        <CardContent>
            <KeypointMap keypoints={tourData.keyPoints || []} onMapClick={handleMapClick} onMarkerClick={handleEditClick} />
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Keypoint List</h3>
              <div className="border rounded-md">
                {(tourData.keyPoints && tourData.keyPoints.length > 0) ? (
                  <ul className="divide-y">
                    {tourData.keyPoints.map((kp, index) => (
                      <li key={kp.id} className="flex justify-between items-center p-3">
                        <div className="flex items-center gap-3">
                           <span className="font-mono text-sm bg-slate-100 rounded-full h-6 w-6 flex items-center justify-center">{index + 1}</span>
                           <span className="font-medium">{kp.name}</span>
                        </div>
                        <div className="flex gap-2">
                         <Button variant="outline" size="icon" onClick={() => handleEditClick(kp)}>
                             <Edit className="h-4 w-4"/>
                           </Button>
                           <Button variant="destructive" size="icon" onClick={() => handleDeleteKeypoint(kp.id)}>
                             <Trash2 className="h-4 w-4"/>
                           </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="p-4 text-sm text-center text-muted-foreground">
                    No keypoints added yet. Click on the map to start building your tour!
                  </p>
                )}
              </div>
            </div>
        </CardContent>
      </Card>

        <KeypointFormDialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
            setIsDialogOpen(open);
            // Kada se dijalog zatvori (na 'x' ili 'cancel'), resetuj stanje editovanja
            if (!open) setEditingKeypoint(null);
        }}
        coordinates={newCoordinates}
        onSave={handleSaveKeypoint}
        keypointToEdit={editingKeypoint}
      />

    </div>
  );
}