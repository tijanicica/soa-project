import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import ReactDOMServer from "react-dom/server";
import { Loader2, Flag, FlagOff, XCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getTourExecution,
  updateTourPosition,
  abandonTour,
} from "../services/TourExecutionApi.js";
import { getTourDetails } from "../services/TourApi.js";
import { getMyPosition } from "../services/StakeholdersApi";

// --- Leaflet Icon Setup ---

// 1. Ispravka za defaultnu ikonicu markera koja ponekad nedostaje
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// 2. Pomoćna funkcija za kreiranje ikonica na mapi od Lucide React ikonica
const createLucideIcon = (IconComponent, colorClass) => {
  return new L.DivIcon({
    html: ReactDOMServer.renderToString(
      <IconComponent className={`h-6 w-6 ${colorClass}`} strokeWidth={2.5} />
    ),
    className: "bg-transparent border-0", // Uklanja defaultnu pozadinu i okvir
    iconSize: [24, 24],
    iconAnchor: [12, 24], // Sidro na dnu ikonice
    popupAnchor: [0, -24], // Pomeri popup iznad ikonice
  });
};

// 3. Definicija naših custom ikonica
const keyPointIcon = createLucideIcon(Flag, "text-blue-600");
const completedKeyPointIcon = createLucideIcon(FlagOff, "text-green-600");
const userPositionIcon = createLucideIcon(MapPin, "text-red-600");

export function ActiveTourPage() {
  const { executionId } = useParams();
  const navigate = useNavigate();

  const [execution, setExecution] = useState(null);
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userPosition, setUserPosition] = useState(null);

  const intervalRef = useRef(null);

  const handleTourEnd = useCallback(
    (status) => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      alert(`Tour ${status}!`);
      setTimeout(() => {
        navigate("/my-purchased-tours");
      }, 5);
    },
    [navigate]
  );

  // Glavna funkcija za proveru i ažuriranje pozicije, poziva se periodično
  const checkPosition = async () => {
    try {
      console.log("Checking position..."); // Dobra praksa za debagovanje
      const posData = await getMyPosition();
      if (!posData.latitude.Valid || !posData.longitude.Valid) return;

      const currentPosition = {
        latitude: posData.latitude.Float64,
        longitude: posData.longitude.Float64,
      };
      setUserPosition([currentPosition.latitude, currentPosition.longitude]);

      const updatedExecution = await updateTourPosition(
        executionId,
        currentPosition
      );

      // --- IZMENJENO: Dodajemo log da vidimo šta API vraća ---
      console.log("API Response from updateTourPosition:", updatedExecution);

      setExecution(updatedExecution);

      // Proveravamo da li je tura završena nakon ažuriranja
      if (
        updatedExecution.status === "completed" ||
        updatedExecution.status === "abandoned"
      ) {
        handleTourEnd(updatedExecution.status); // Koristimo novu funkciju
      }
    } catch (err) {
      console.error("Error updating position:", err);
    }
  };

  // Učitavanje inicijalnih podataka i pokretanje intervala
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const execData = await getTourExecution(executionId);

        // --- KLJUČNA ISPRAVKA: Provera statusa ODMAH nakon učitavanja ---
        // Ako je tura već završena ili napuštena, odmah pozovi logiku za kraj.
        if (
          execData.status === "completed" ||
          execData.status === "abandoned"
        ) {
          setExecution(execData); // Postavi state da korisnik vidi finalno stanje pre redirecta
          setLoading(false); // Prestani sa učitavanjem
          handleTourEnd(execData.status); // Pokaži alert i preusmeri
          return; // Prekini dalje izvršavanje funkcije
        }

        // Ako tura nije završena, nastavi sa normalnim učitavanjem
        setExecution(execData);
        setUserPosition([
          execData.currentPosition.latitude,
          execData.currentPosition.longitude,
        ]);

        const tourData = await getTourDetails(execData.tourId);
        setTour(tourData);

        // Pokreni interval samo ako je tura aktivna
        if (execData.status === "active") {
          // Odmah pokreni prvu proveru, ne čekaj 10 sekundi
          checkPosition();
          intervalRef.current = setInterval(checkPosition, 10000);
        }
      } catch (err) {
        setError(
          "Failed to load active tour session. It might have ended or does not exist."
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

    // Očisti interval kada se komponenta zatvori (npr. korisnik ode na drugu stranicu)
    // Očisti interval
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // Dodajemo handleTourEnd u dependency array
  }, [executionId, handleTourEnd]);

  const handleAbandonTour = async () => {
    if (
      window.confirm(
        "Are you sure you want to abandon this tour? Your progress will be saved."
      )
    ) {
      try {
        // Ne treba nam povratna vrednost jer će handleTourEnd odraditi posao
        await abandonTour(executionId);
        handleTourEnd("abandoned"); // Odmah pozivamo logiku za kraj
      } catch (err) {
        console.error("Failed to abandon tour:", err);
        alert("Could not abandon the tour. Please try again.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center mt-20 text-red-500 p-4">{error}</div>;
  }

  // Kreiramo set ID-jeva završenih tačaka za brzu proveru
  const completedKeyPointIds = new Set(
    execution.completedKeyPoints.map((kp) => kp.keyPointId)
  );

  return (
    <div className="h-screen w-screen flex antialiased">
      {/* Leva strana - Informacije o turi */}
      <aside className="w-full md:w-1/3 max-w-sm h-full bg-white shadow-lg overflow-y-auto p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-2">{tour.name}</h1>
        <p className="text-muted-foreground mb-6">
          Status:{" "}
          <span className="font-semibold capitalize">{execution.status}</span>
        </p>

        <div className="flex-grow">
          <h2 className="text-lg font-semibold mb-4">Key Points</h2>
          <ul className="space-y-4">
            {tour.keyPoints.map((kp, index) => (
              <li key={kp.id} className="flex items-start gap-4">
                {completedKeyPointIds.has(kp.id) ? (
                  <FlagOff className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                ) : (
                  <Flag className="h-6 w-6 text-gray-400 mt-1 flex-shrink-0" />
                )}
                <div>
                  <h3 className="font-semibold">
                    {index + 1}. {kp.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {kp.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <Button
          variant="destructive"
          className="w-full mt-6"
          onClick={handleAbandonTour}
        >
          <XCircle className="mr-2 h-4 w-4" /> Abandon Tour
        </Button>
      </aside>

      {/* Desna strana - Mapa */}
      <main className="hidden md:block w-2/3 h-full">
        {userPosition && (
          <MapContainer
            center={userPosition}
            zoom={15}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />

            <Marker position={userPosition} icon={userPositionIcon}>
              <Popup>Your current position</Popup>
            </Marker>

            {tour.keyPoints.map((kp) => (
              <Marker
                key={kp.id}
                position={[kp.latitude, kp.longitude]}
                icon={
                  completedKeyPointIds.has(kp.id)
                    ? completedKeyPointIcon
                    : keyPointIcon
                }
              >
                <Popup>
                  <div className="font-semibold">{kp.name}</div>
                  <div className="text-sm">{kp.description}</div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </main>
    </div>
  );
}
