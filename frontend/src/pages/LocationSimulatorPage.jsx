import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { TouristNavbar } from '@/components/TouristNavbar'; // Proverite da li je putanja tačna

// >>> ISPRAVLJEN IMPORT - DODALI SMO getTouristPosition <<<
import { getTouristPosition, updateTouristPosition } from '@/services/TourApi'; 

// Ispravka za ikonicu markera
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;


function DraggableMarker({ position, setPosition }) {
  const markerRef = useRef(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) setPosition(marker.getLatLng());
      },
    }),
    [setPosition],
  );

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return (
    <Marker draggable={true} eventHandlers={eventHandlers} position={position} ref={markerRef}>
      <Popup>
        Your position is set here. <br/> Drag me or click on the map to change.
      </Popup>
    </Marker>
  );
}


export function LocationSimulatorPage() {
  const [position, setPosition] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  
  // >>> PAMETNI EFEKAT ZA UČITAVANJE POČETNE LOKACIJE <<<
  useEffect(() => {
    const fetchInitialPosition = async () => {
      try {
        // 1. POKUŠAJ DA DOBIJEŠ SAČUVANU POZICIJU SA SERVERA
        const savedPosition = await getTouristPosition();
        if (savedPosition && savedPosition.latitude) {
          setPosition({ lat: savedPosition.latitude, lng: savedPosition.longitude });
          return; // Ako uspe, stani ovde
        }
      } catch (error) {
        console.warn("Could not fetch saved position, trying geolocation.", error);
      }

      // 2. AKO SERVER NIJE VRATIO POZICIJU, PITAJ PRETRAŽIVAČ
      navigator.geolocation.getCurrentPosition(
        (pos) => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        // 3. AKO SVE PROPADNE, STAVI NA BEOGRAD
        () => setPosition({ lat: 44.7866, lng: 20.4489 })
      );
    };

    fetchInitialPosition();
  }, []); // [] znači da se efekat izvrši samo jednom, kad se komponenta učita

  const handleSaveLocation = async () => {
    if (!position) return;
    setIsLoading(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const locationData = { latitude: position.lat, longitude: position.lng };
      await updateTouristPosition(locationData);
      setStatusMessage({ type: 'success', text: 'Location saved successfully!' });
    } catch (error) {
      const errorMsg = error.response?.data || error.message;
      setStatusMessage({ type: 'error', text: `Failed to save: ${errorMsg}` });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <TouristNavbar />
      
      <div className="container mx-auto p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden mt-6">
          <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Location Simulator</h1>
            <p className="mb-6 text-gray-600">
              Your last saved position is shown below. Drag the pin or click on the map to set a new one.
            </p>
            
            {/* Mapa se prikazuje tek kad imamo poziciju */}
            {position ? (
              <MapContainer center={position} zoom={13} style={{ height: '50vh', width: '100%', borderRadius: '8px' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <DraggableMarker position={position} setPosition={setPosition} />
              </MapContainer>
            ) : (
              <div className="flex items-center justify-center h-[50vh] bg-gray-100 rounded-lg">
                <p className="text-gray-500">Fetching location data...</p>
              </div>
            )}
            
            <div className="mt-6 text-center">
              <Button onClick={handleSaveLocation} disabled={isLoading || !position} size="lg">
                {isLoading ? "Saving..." : "Save Location"}
              </Button>
              {statusMessage.text && (
                <p className={`mt-4 text-sm ${statusMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {statusMessage.text}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}