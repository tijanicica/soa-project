import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertCircle, Image as ImageIcon } from "lucide-react";

export function KeypointFormDialog({ open, onOpenChange, coordinates, onSave, keypointToEdit }) {
  const [keypointData, setKeypointData] = useState({ name: '', description: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null); // Stanje za prikaz slike
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null); // Referenca za skriveni input

  useEffect(() => {
    // Ako se dijalog uopšte ne prikazuje, ne radi ništa.
    if (!open) {
      return;
    }

    // Proveravamo da li smo u "edit modu"
    if (keypointToEdit) {
      // Ako editujemo, popuni formu sa postojećim podacima
      setKeypointData({
        name: keypointToEdit.name || '', // Koristimo || '' za svaki slučaj
        description: keypointToEdit.description || '',
      });
      // Postavi preview na postojeći URL slike, ili na null ako ga nema
      setPreview(keypointToEdit.imageUrl || null);
    } else {
      // Ako kreiramo novi, sve resetuj na početne vrednosti
      setKeypointData({ name: '', description: '' });
      setPreview(null);
    }
    
    // Uvek resetuj odabrani fajl i grešku kada se dijalog otvori
    setSelectedFile(null);
    setError('');

  }, [open, keypointToEdit]);

  const handleChange = (e) => {
    setKeypointData({ ...keypointData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Kreiramo privremeni URL za prikaz slike pre uploada
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!keypointData.name) {
      setError("Keypoint name is required.");
      return;
    }
    
    setLoading(true);
    setError('');
    
    const finalKeypoint = {
      ...keypointData,
      id: keypointToEdit?.id,
      latitude: keypointToEdit?.latitude || coordinates.lat,
      longitude: keypointToEdit?.longitude || coordinates.lng,
      // Važno: prosleđujemo i postojeći URL, jer će ga handleSaveKeypoint u roditelju pregaziti ako postoji novi fajl
      imageUrl: keypointToEdit?.imageUrl 
    };
    
    await onSave(finalKeypoint, selectedFile);
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{keypointToEdit ? 'Edit Keypoint' : 'Add New Keypoint'}</DialogTitle>
          <DialogDescription>
            {keypointToEdit ? 'Update the details for this keypoint.' : 'Fill in the details and add an image.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* --- NOVA SEKCIJA ZA SLIKU --- */}
          <div className="flex justify-center">
            <div 
              className="relative w-full h-48 bg-slate-100 rounded-md flex items-center justify-center border-2 border-dashed border-slate-300 cursor-pointer hover:border-slate-400 transition-colors"
              onClick={() => fileInputRef.current.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
              {preview ? (
                <img src={preview} alt="Keypoint preview" className="h-full w-full object-cover rounded-md" />
              ) : (
                <div className="text-center text-slate-500">
                  <ImageIcon className="mx-auto h-12 w-12" />
                  <p className="mt-2 text-sm">Click to upload an image</p>
                </div>
              )}
            </div>
          </div>
          
          {/* --- FORMA ZA PODATKE --- */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" value={keypointData.name} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" value={keypointData.description} onChange={handleChange} />
          </div>
        </div>
        {error && (
            <div className="text-sm font-medium text-red-500 flex items-center gap-2">
              <AlertCircle className="h-4 w-4"/> {error}
            </div>
         )}
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)} variant="ghost">Cancel</Button>
          <Button type="button" onClick={handleSave} disabled={loading}>
             {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Keypoint"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}