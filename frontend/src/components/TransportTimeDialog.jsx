import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateTransportTimes } from "../services/TourApi";
import { Loader2, AlertCircle, Footprints, Bike, Car } from "lucide-react";

const TRANSPORT_TYPES = [
  { name: "Walk", icon: <Footprints className="h-5 w-5" /> },
  { name: "Bike", icon: <Bike className="h-5 w-5" /> },
  { name: "Car", icon: <Car className="h-5 w-5" /> },
];


export function TransportTimeDialog({ open, onOpenChange, tour, onSaveSuccess }) {
  // Stanje uvek inicijalizujemo kao prazan objekat
  const [times, setTimes] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Ovaj useEffect će se pokrenuti SVAKI put kada se dijalog otvori ili se tura promeni
  useEffect(() => {
  if (open && tour) {
    const initialTimes = {};
    TRANSPORT_TYPES.forEach(type => {
      const tt = tour.transportTimes?.find(t => t.transportType === type.name);
      initialTimes[type.name] = tt ? tt.durationMinutes.toString() : "";
    });
    setTimes(initialTimes);
    setError("");
    setSaving(false);
  }
}, [open, tour]);
const handleTimeChange = (typeName, value) => {
  if (/^\d*$/.test(value)) {
    setTimes(prev => ({ ...prev, [typeName]: value }));
  }
};

    const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = Object.entries(times)
        .map(([typeName, duration]) => ({
          transportType: typeName, // "Walk", "Bike", "Car"
          durationMinutes: duration === "" ? 0 : parseInt(duration, 10),
        }))
        .filter(item => item.durationMinutes > 0);

      console.log("Payload being sent:", payload);

      await updateTransportTimes(tour.id, payload);
      onSaveSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to save times:", err);
      setError("Failed to save times. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Tour Durations</DialogTitle>
          {/* Rešava 'Warning: Missing `Description`' */}
          <DialogDescription>
            Enter the estimated time in minutes for each transport type. Leave blank if not applicable.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {TRANSPORT_TYPES.map(type => (
            <div key={type.id} className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor={`time-${type.name}`} className="flex items-center gap-2">
                {type.icon}
                <span>{type.name}</span>
              </Label>
              <Input
                id={`time-${type.name}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={times[type.name] || ""}
                onChange={e => handleTimeChange(type.name, e.target.value)}
                className="col-span-2"
                placeholder={`${type.name} minutes`}
                />

            </div>
          ))}
        </div>
         {error && (
            <div className="text-sm font-medium text-red-500 flex items-center gap-2">
              <AlertCircle className="h-4 w-4"/> {error}
            </div>
         )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Durations"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}