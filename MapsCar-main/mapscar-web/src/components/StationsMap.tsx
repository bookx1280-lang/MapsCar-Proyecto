import { useEffect, useMemo, useRef, useState } from 'react';
import { CircleHelp, LocateFixed, Navigation } from 'lucide-react';
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
} from 'react-leaflet';
import { GasStationDetail } from '../components/GasStationDetail';
import L, { LatLngBoundsExpression } from 'leaflet';
import type { GasStation } from '../data/mock';

type Props = {
  stations: GasStation[];
  selectedStationId: number;
  onSelectStation: (station: GasStation | null) => void;
  currentUserId: string;
  onDeleteComment: (stationId: number, commentId: number) => void;
  onRateStation: (station: GasStation) => void;
};

const COLIMA_CENTER: [number, number] = [19.2433, -103.7241];

const COLIMA_BOUNDS: LatLngBoundsExpression = [
  [19.145, -103.815],
  [19.345, -103.615],
];

const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: '<div class="user-location-dot"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function createStationIcon(isSelected: boolean) {
  return L.divIcon({
    className: 'station-marker-wrapper',
    html: `
      <div class="station-pin ${isSelected ? 'selected' : ''}">
        <svg xmlns="http://www.w3.org/2000/svg" width="42" height="56" viewBox="0 0 42 56" fill="none">
          <path
            d="M21 54C21 54 4 37.8 4 21.5C4 11.8 11.8 4 21.5 4C31.2 4 39 11.8 39 21.5C39 37.8 21 54 21 54Z"
            fill="${isSelected ? '#10b981' : '#ffffff'}"
            stroke="#10b981"
            stroke-width="2.5"
          />
          <circle
            cx="21.5"
            cy="21.5"
            r="11"
            fill="${isSelected ? '#ffffff' : '#10b981'}"
          />
          <path
            d="M18.2 14.8h4.4c.72 0 1.3.58 1.3 1.3v8.55c0 .72-.58 1.3-1.3 1.3h-4.4c-.72 0-1.3-.58-1.3-1.3V16.1c0-.72.58-1.3 1.3-1.3Zm0 3.38h4.4M23.95 17.2l1.65 1.38v3.95a1.1 1.1 0 0 0 2.2 0V19c0-.66-.28-1.31-.82-1.75l-1.16-.94"
            stroke="${isSelected ? '#10b981' : '#ffffff'}"
            stroke-width="1.9"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
    `,
    iconSize: [42, 56],
    iconAnchor: [21, 54],
  });
}

function MapController({
  selectedStation,
  locateRequest,
  centerRequest,
  onLocated,
  mapRef,
}: {
  selectedStation?: GasStation | null;
  locateRequest: number;
  centerRequest: number;
  onLocated: (coords: [number, number] | null) => void;
  mapRef: React.MutableRefObject<L.Map | null>;
}) {
  const map = useMap();

  useEffect(() => {
    mapRef.current = map;
    map.fitBounds(COLIMA_BOUNDS, { padding: [40, 40] });
  }, [map, mapRef]);

  useEffect(() => {
    if (!selectedStation || selectedStation.lat == null || selectedStation.lng == null) return;

    map.flyTo(
      [selectedStation.lat, selectedStation.lng],
      Math.max(map.getZoom(), 15),
      { duration: 0.8 },
    );
  }, [map, selectedStation]);

  useEffect(() => {
    if (!locateRequest) return;
    if (!navigator.geolocation) {
      onLocated(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        map.flyTo(coords, 15, { duration: 0.8 });
        onLocated(coords);
      },
      () => onLocated(null),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, [locateRequest, map, onLocated]);

  useEffect(() => {
    if (!centerRequest) return;
    map.fitBounds(COLIMA_BOUNDS, { padding: [40, 40] });
  }, [centerRequest, map]);

  return null;
}

export function StationsMap({
  stations,
  selectedStationId,
  onSelectStation,
  currentUserId,
  onDeleteComment,
  onRateStation,
}: Props) {
  const [locateRequest, setLocateRequest] = useState(0);
  const [centerRequest, setCenterRequest] = useState(0);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [detailPosition, setDetailPosition] = useState<{ x: number; y: number } | null>(null);

  const mapRef = useRef<L.Map | null>(null);

  const selectedStation = useMemo(
    () => stations.find((station) => station.id === selectedStationId) ?? null,
    [selectedStationId, stations],
  );

  const validStations = stations.filter(
    (station) => station.lat != null && station.lng != null,
  );

  const updateDetailPosition = (station: GasStation | null) => {
    if (!mapRef.current || !station || station.lat == null || station.lng == null) {
      setDetailPosition(null);
      return;
    }

    const point = mapRef.current.latLngToContainerPoint([station.lat, station.lng]);

    const cardWidth = 420;
    const cardHeight = 520; // antes 340
    const margin = 16;
    const offset = 18;

    let x = point.x + offset;
    let y = point.y - cardHeight / 2;

    const mapWidth = mapRef.current.getSize().x;
    const mapHeight = mapRef.current.getSize().y;

    // si no cabe a la derecha, pásala a la izquierda
    if (x + cardWidth > mapWidth - margin) {
      x = point.x - cardWidth - offset;
    }

    // límites horizontales
    if (x < margin) {
      x = margin;
    }

    if (x + cardWidth > mapWidth - margin) {
      x = mapWidth - cardWidth - margin;
    }

    // límites verticales
    if (y < margin) {
      y = margin;
    }

    if (y + cardHeight > mapHeight - margin) {
      y = mapHeight - cardHeight - margin;
    }

    setDetailPosition({ x, y });
  };

  useEffect(() => {
    updateDetailPosition(selectedStation);
  }, [selectedStation]);

  useEffect(() => {
    if (!mapRef.current || !selectedStation) return;

    const map = mapRef.current;
    const handleReposition = () => updateDetailPosition(selectedStation);

    map.on('move', handleReposition);
    map.on('zoom', handleReposition);
    map.on('resize', handleReposition);

    return () => {
      map.off('move', handleReposition);
      map.off('zoom', handleReposition);
      map.off('resize', handleReposition);
    };
  }, [selectedStation]);

  const handleMarkerClick = (station: GasStation) => {
    onSelectStation(station);
    updateDetailPosition(station);
  };

  return (
    <div className="map-embed-shell">
      <div className="map-city-badge">Colima, México</div>

      <MapContainer
        center={COLIMA_CENTER}
        zoom={13}
        className="leaflet-map-canvas"
        zoomControl={false}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <MapController
          selectedStation={selectedStation}
          locateRequest={locateRequest}
          centerRequest={centerRequest}
          onLocated={setUserLocation}
          mapRef={mapRef}
        />

        {validStations.map((station) => {
          const isSelected = station.id === selectedStationId;

          return (
            <Marker
              key={station.id}
              position={[station.lat as number, station.lng as number]}
              icon={createStationIcon(isSelected)}
              eventHandlers={{
                click: () => handleMarkerClick(station),
              }}
            />
          );
        })}

        {userLocation && (
          <Marker position={userLocation} icon={userLocationIcon} />
        )}
      </MapContainer>

      {validStations.length === 0 && (
        <div className="map-empty-state">
          <strong>No hay gasolineras registradas</strong>
          <span>Agrega una desde administración para verla en el mapa.</span>
        </div>
      )}

      {/* Panel dinámico: se mueve según la gasolinera seleccionada */}
      {selectedStation && detailPosition && (
        <GasStationDetail
          station={{
            id: selectedStation.id,
            name: selectedStation.name,
            address: selectedStation.address,
            location: `${selectedStation.reviewCount} reseñas`,
            rating: selectedStation.rating,
            comments: selectedStation.comments ?? [],
            estimatedPerformance: selectedStation.estimatedPerformance,
            image: selectedStation.image ?? '',
          }}
          currentUserId={currentUserId}
          onRate={() => {
            onRateStation(selectedStation);
          }}
          onDeleteComment={(commentId) => {
            onDeleteComment(selectedStation.id, commentId);
          }}
          onClose={() => {
            onSelectStation(null);
            setDetailPosition(null);
          }}
          detailPosition={detailPosition}
        />
      )}

      <div className="map-floating-actions">
        <button
          className="map-fab"
          type="button"
          title="Centrar mapa"
          onClick={() => setCenterRequest((prev) => prev + 1)}
        >
          <Navigation size={20} />
        </button>

        <button
          className="map-fab"
          type="button"
          onClick={() => setLocateRequest((prev) => prev + 1)}
          title="Mi ubicación"
        >
          <LocateFixed size={20} />
        </button>

        <button className="map-fab map-fab-light" type="button" title="Ayuda">
          <CircleHelp size={22} />
        </button>
      </div>
    </div>
  );
}