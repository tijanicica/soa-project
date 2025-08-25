import { MapContainer, TileLayer, Marker, useMapEvents, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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
      if (onMapClick) {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
}

// VAŽNO: Koristimo "named export"
export function KeypointMap({ keypoints = [], onMapClick }) {
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
          <Marker key={kp.id || index} position={[kp.latitude, kp.longitude]} />
        ))}
        {positions.length > 1 && <Polyline positions={positions} color="blue" />}
        {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
      </MapContainer>
    </div>
  );
}