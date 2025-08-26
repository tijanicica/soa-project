import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-routing-machine';
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
//  1. DODAJEMO NOVI PROP: onDistanceCalculated
function Routing({ positions, onDistanceCalculated }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Ako nema dovoljno tačaka, javi da je distanca 0 i ne radi ništa više
    if (positions.length < 2) {
      if(onDistanceCalculated) onDistanceCalculated(0);
      return;
    }

    const control = L.Routing.control({
      waypoints: positions.map(([lat, lng]) => L.latLng(lat, lng)),
      show: false, 
      addWaypoints: false, 
      createMarker: function() { return null; },
      lineOptions: { styles: [{ color: '#0891b2', weight: 5, opacity: 0.8 }] },
      routeWhileDragging: false,
      fitSelectedRoutes: true,
    });
    
    // 👉 2. DODAJEMO EVENT LISTENER
    control.on('routesfound', function(e) {
        const routes = e.routes;
        if (routes.length > 0) {
            const summary = routes[0].summary;
            // Dobijamo distancu u metrima, pa je konvertujemo u km
            const distanceKm = summary.totalDistance / 1000;
            // Pozivamo funkciju koju smo dobili od roditelja
            if (onDistanceCalculated) {
                onDistanceCalculated(distanceKm);
            }
        }
    }).addTo(map);

    return () => map.removeControl(control);
  }, [map, positions, onDistanceCalculated]); // 👉 3. DODAJEMO PROP U ZAVISNOSTI

  return null;
}

// Glavna komponenta
//  4. DODAJEMO NOVI PROP: onDistanceCalculated
export function KeypointMap({ keypoints = [], onMapClick, onMarkerClick, onDistanceCalculated }) {
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
        {keypoints.map((kp, index) => (
          <Marker 
            key={kp.id || index} 
            position={[kp.latitude, kp.longitude]}
            eventHandlers={{
              click: () => {
                if (onMarkerClick) onMarkerClick(kp);
              },
            }}
          />
        ))}
        
        {/*  5. PROSLEĐUJEMO PROP U <Routing> KOMPONENTU */}
        <Routing positions={positions} onDistanceCalculated={onDistanceCalculated} />

        {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
      </MapContainer>
    </div>
  );
}