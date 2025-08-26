import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, X, UploadCloud } from "lucide-react";
import { updateBlog } from "@/services/BlogApi";

export function EditBlogDialog({ blog, onBlogUpdated, trigger }) {
  const [open, setOpen] = useState(false);
  
  // Stanja za formu
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  
  // Stanja za slike
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [newImages, setNewImages] = useState([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Popunjavamo stanja kada se dijalog otvori
  useEffect(() => {
    // Proveravamo `open` da bi se resetovalo svaki put kad se otvori
    if (blog && open) {
      setTitle(blog.title);
      setDescription(blog.descriptionMarkdown);
      setExistingImages(blog.imageUrls || []);
      setImagesToDelete([]); // Resetuj listu za brisanje
      setNewImages([]);     // Resetuj listu novih slika
    }
  }, [blog, open]);

  // Funkcija za označavanje postojeće slike za brisanje
  const handleMarkForDeletion = (urlToDelete) => {
    // Ukloni sliku iz prikaza postojećih
    setExistingImages(existingImages.filter(url => url !== urlToDelete));
    // Dodaj je u listu za brisanje
    setImagesToDelete([...imagesToDelete, urlToDelete]);
  };

  // Funkcija za dodavanje novih slika
  const handleNewImagesChange = (e) => {
    if (e.target.files) {
      // Dodajemo nove fajlove u niz
      setNewImages([...newImages, ...Array.from(e.target.files)]);
    }
  };

  // Funkcija za uklanjanje nove (još ne-uploadovane) slike
  const removeNewImage = (indexToRemove) => {
    setNewImages(newImages.filter((_, index) => index !== indexToRemove));
  };
const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError("Title cannot be empty.");
      return;
    }

    setIsLoading(true);
    setError("");

    const formData = new FormData();
    let hasChanges = false;

   
    if (title.trim() !== blog.title) {
      formData.append("title", title);
      hasChanges = true;
    }

    if (description !== blog.descriptionMarkdown) {
      formData.append("descriptionMarkdown", description);
      hasChanges = true;
    }
    
    // Dodaj listu URL-ova slika koje treba obrisati
    if (imagesToDelete.length > 0) {
      imagesToDelete.forEach(url => {
        formData.append("imagesToDelete", url);
      });
      hasChanges = true;
    }

    // Dodaj nove slike
    if (newImages.length > 0) {
      newImages.forEach(file => {
        formData.append("images", file);
      });
      hasChanges = true;
    }
    
    // Ako korisnik nije napravio nijednu promenu, ne šaljemo zahtev.
    if (!hasChanges) {
      setOpen(false); // Samo zatvori dijalog
      return;
    }

    try {
      await updateBlog(blog.id, formData);
      onBlogUpdated(); // Osveži listu blogova
      setOpen(false);   // Zatvori dijalog
    } catch (err) {
      // Poboljšano ispisivanje greške koje će vam pomoći u debagovanju
      console.error("Update failed:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Failed to update blog. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Edit Blog Post</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} id="edit-blog-form" className="space-y-6 pt-4 max-h-[70vh] overflow-y-auto pr-4">
          
          {/* Polja za naslov i opis */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Markdown supported)</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[150px]" />
          </div>

          {/* === NOVI, NAPREDNI DEO ZA SLIKE === */}
          <div className="space-y-4">
            <Label>Manage Images</Label>
            
            {/* Prikaz postojećih slika sa "X" dugmetom */}
            <div className="p-3 border border-dashed rounded-md min-h-[80px]">
              <p className="text-xs text-muted-foreground mb-2">Current images (click 'X' to remove):</p>
              {existingImages.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {existingImages.map((url, index) => (
                    <div key={url} className="relative group">
                      <img src={url} alt={`Current image ${index + 1}`} className="h-20 w-20 object-cover rounded" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => handleMarkForDeletion(url)}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">No current images.</p>}
            </div>

            {/* Prikaz novih slika koje će biti dodate */}
            {newImages.length > 0 && (
              <div className="p-3 border border-dashed border-sky-400 rounded-md">
                 <p className="text-xs text-muted-foreground mb-2">New images to be added:</p>
                <div className="flex flex-wrap gap-2">
                  {newImages.map((file, index) => (
                    <div key={index} className="relative">
                      <img src={URL.createObjectURL(file)} alt={file.name} className="h-20 w-20 object-cover rounded" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeNewImage(index)}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      >
                        <X size={12} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dugme za dodavanje novih slika */}
            <label htmlFor="add-images" className="w-full flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted">
              <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="font-semibold">Click to add new images</span>
            </label>
            <Input
              id="add-images"
              type="file"
              multiple
              onChange={handleNewImagesChange}
              className="hidden" // Sakrivamo default input
            />
          </div>
        </form>
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        <DialogFooter className="pt-4">
          <Button type="submit" form="edit-blog-form" disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}