import { useState, useEffect } from "react";
import { TouristNavbar } from "../components/TouristNavbar";
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
// 1. Uvozimo nove API funkcije
import { getMyPosition, updateMyPosition } from "../services/StakeholdersApi";
import { Loader2, CheckCircle } from "lucide-react";

// Ispravka za ikonicu markera koja često nedostaje u React Leaflet-u
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({ iconUrl, iconRetinaUrl, shadowUrl, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// Pomoćna komponenta koja detektuje klik na mapu
function MapClickHandler({ onPositionSet }) {
  useMapEvents({
    click(e) {
      onPositionSet(e.latlng); // Pozovi funkciju sa novim koordinatama
    },
  });
  return null;
}

export function PositionSimulatorPage() {
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
 
  // Dohvati poslednju sačuvanu poziciju pri prvom učitavanju stranice
  useEffect(() => {
    const fetchPosition = async () => {
      try {
        const data = await getMyPosition();
        // Backend vraća { latitude: { Float64: vrednost, Valid: true }, ... }
        if (data.latitude.Valid && data.longitude.Valid) {
          setPosition({ lat: data.latitude.Float64, lng: data.longitude.Float64 });
        }
      } catch (err) {
        console.error("Failed to fetch initial position", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosition();
  }, []); // Prazan niz znači da se ovo izvršava samo jednom, na početku

  // Funkcija koja se poziva kada korisnik klikne na mapu
  const handleSetPosition = async (latlng) => {
    setSaving(true);
    setSuccess(false);
    setPosition(latlng); // Odmah pomeri marker na frontendu za bolji doživljaj

    try {
      await updateMyPosition(latlng.lat, latlng.lng);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000); // Sakrij poruku o uspehu posle 2 sekunde
    } catch (err) {
      console.error("Failed to save position", err);
      alert("Error: Could not save your position. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Prikaz učitavanja dok ne stignu podaci o poziciji
  if (loading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-10 w-10 animate-spin"/></div>;
  }

  // Određujemo centar mape. Ako imamo poziciju, centriraj na nju. Ako ne, na podrazumevanu lokaciju.
  const mapCenter = position || [44.8125, 20.4612]; // Beograd kao podrazumevani centar

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <TouristNavbar />
      <div className="flex-grow flex flex-col items-center p-4 md:p-8">
        <div className="w-full max-w-5xl text-center mb-4">
          <h1 className="text-3xl font-bold">Position Simulator</h1>
          <p className="text-muted-foreground">Click on the map to set your current location.</p>
        </div>
       
        <div className="relative w-full max-w-5xl h-[65vh] border rounded-lg shadow-lg overflow-hidden">
           <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {position && <Marker position={position} />}
            <MapClickHandler onPositionSet={handleSetPosition} />
          </MapContainer>
         
          {/* Indikator čuvanja/uspeha u gornjem desnom uglu mape */}
          {(saving || success) && (
            <div className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-lg flex items-center text-sm z-[1000]">
              {saving && <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Saving...</>}
              {success && <><CheckCircle className="h-5 w-5 text-green-500 mr-2" /> Position Saved!</>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}