import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-routing-machine';

// Ovaj CSS import je neophodan za stilove linije, ali panel ćemo sakriti opcijama.
// Ako build puca zbog ovoga, vratite ga u index.css
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (onMapClick) onMapClick(e.latlng);
    },
  });
  return null;
}

// Komponenta za rutiranje
function Routing({ positions }) {
  const map = useMap();

  useEffect(() => {
    if (!map || positions.length < 2) return;

    const control = L.Routing.control({
      waypoints: positions.map(([lat, lng]) => L.latLng(lat, lng)),
      
      // --- KLJUČNE IZMENE ZA SKRIVANJE UI ELEMENATA ---
      
      // 1. Sakriva panel sa tekstualnim instrukcijama
      show: false, 
      
      // 2. Onemogućava korisniku da dodaje nove tačke na rutu
      addWaypoints: false, 

      // 3. Onemogućava iscrtavanje A, B, ... markera koje dodaje sama biblioteka
      //    Ovo je najvažnija izmena da ne biste imali duple markere.
      createMarker: function() { return null; },

      // --- Ostatak opcija ---
      lineOptions: { styles: [{ color: '#0891b2', weight: 5, opacity: 0.8 }] },
      routeWhileDragging: false,
      fitSelectedRoutes: true,
    }).addTo(map);

    return () => map.removeControl(control);
  }, [map, positions]);

  return null;
}

// Glavna komponenta
export function KeypointMap({ keypoints = [], onMapClick, onMarkerClick  }) {
  const center = keypoints.length > 0
    ? [keypoints[0].latitude, keypoints[0].longitude]
    : [44.8125, 20.4612];

  const positions = keypoints.map(kp => [kp.latitude, kp.longitude]);

  return (
    <div className="rounded-lg overflow-hidden border h-[400px] w-full relative z-10">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {/* OVI SU VAŠI MARKERI - ONI OSTAJU */}
      {keypoints.map((kp, index) => (
          <Marker 
            key={kp.id || index} 
            position={[kp.latitude, kp.longitude]}
            // 👉 2. DODAJEMO EVENT HANDLER ZA KLIK
            eventHandlers={{
              click: () => {
                // Ako je funkcija prosleđena, pozovi je sa celim keypoint objektom
                if (onMarkerClick) {
                  onMarkerClick(kp);
                }
              },
            }}
          />
        ))}

        {positions.length > 1 && <Routing positions={positions} />}

        {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
      </MapContainer>
    </div>
  );
}