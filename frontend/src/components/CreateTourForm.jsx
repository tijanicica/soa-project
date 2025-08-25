import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createTour } from "../services/TourApi"; // Uvozimo iz novog fajla
import { useAuth } from "../hooks/useAuth";
import { Loader2, AlertCircle } from "lucide-react";

export function CreateTourForm() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [tourData, setTourData] = useState({
    name: '',
    description: '',
    difficulty: 'Medium',
    tags: '',
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setTourData({ ...tourData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!auth.user) {
      setError("You must be logged in to create a tour.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...tourData,
        authorId: parseInt(auth.user.id), // Uzimamo ID iz tokena
        tags: tourData.tags.split(',').map(tag => tag.trim()).filter(tag => tag), // Pretvaramo string u niz tagova
      };
      
      const createdTour = await createTour(payload);
      
      navigate(`/guide/tours/edit/${createdTour.id}`);
      alert("Tour created successfully! ID: " + createdTour.id); // Privremeni feedback

    } catch (err) {
      setError("Failed to create tour. Please check the details and try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create a New Tour</CardTitle>
        <CardDescription>Fill in the basic details. You can add keypoints and other info later.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="name">Tour Name</Label>
            <Input id="name" name="name" value={tourData.name} onChange={handleChange} placeholder="e.g., Belgrade Fortress Sunset Walk" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" value={tourData.description} onChange={handleChange} placeholder="Describe the amazing experience of your tour..." required />
          </div>
           <div className="grid gap-2">
            <Label htmlFor="difficulty">Difficulty</Label>
            <select
              id="difficulty"
              name="difficulty"
              value={tourData.difficulty}
              onChange={handleChange}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input id="tags" name="tags" value={tourData.tags} onChange={handleChange} placeholder="e.g., walking, history, fortress" required />
          </div>
           {error && (
            <div className="text-sm font-medium text-red-500 flex items-center gap-2">
              <AlertCircle className="h-4 w-4"/>
              {error}
            </div>
            )}
           <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Tour"}
            </Button>
           </div>
        </form>
      </CardContent>
    </Card>
  );
}