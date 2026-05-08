import {
  Cable,
  ChevronRight,
  Fuel,
  LayoutDashboard,
  Navigation,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  TrendingUp,
  UserRound,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GasStation } from '../data/mock';
import { RatingModal } from '../components/RatingModal';
import { StationsMap } from '../components/StationsMap';
import {
  fetchMyVehicles,
  fetchStations,
  getCurrentUser,
  getStoredVehicle,
  isAdminUser,
  deleteComment,
  type UserVehicle
} from '../services/api';

const filters = [
  { label: 'Cercanas', icon: Navigation },
  { label: 'Mejor rendimiento', icon: TrendingUp },
  { label: 'Mejor calificación', icon: Star },
];

type UserCoords = {
  lat: number;
  lng: number;
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getDistanceKm(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(toLat - fromLat);
  const dLng = toRadians(toLng - fromLng);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(fromLat)) *
    Math.cos(toRadians(toLat)) *
    Math.sin(dLng / 2) ** 2;

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parsePerformanceValue(value?: string) {
  if (!value) return 0;
  const match = value.replace(',', '.').match(/(\d+(\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState(filters[0].label);
  const [selectedStation, setSelectedStation] = useState<GasStation | null>(null);
  const [stations, setStations] = useState<GasStation[]>([]);
  const [search, setSearch] = useState('');
  const [showRating, setShowRating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vehicles, setVehicles] = useState<UserVehicle[]>([]);
  const currentUser = getCurrentUser();
  const isAdmin = isAdminUser();
  const [userCoords, setUserCoords] = useState<UserCoords | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<number>(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [vehicleMenuOpen, setVehicleMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const vehicleMenuRef = useRef<HTMLDivElement | null>(null);

  const selectedVehicle = useMemo(
    () => vehicles.find((item) => item.idvehiculo === selectedVehicleId) || null,
    [vehicles, selectedVehicleId],
  );

  const vehicleAlias = useMemo(() => {
    if (selectedVehicle?.alias) return selectedVehicle.alias;
    if (selectedVehicle?.marca?.nombre || selectedVehicle?.modelo?.nombre) {
      return `${selectedVehicle?.marca?.nombre || ''} ${selectedVehicle?.modelo?.nombre || ''}`.trim();
    }

    const stored = getStoredVehicle();
    if (stored?.alias) return stored.alias;
    if (stored?.marca?.nombre || stored?.modelo?.nombre) {
      return `${stored?.marca?.nombre || ''} ${stored?.modelo?.nombre || ''}`.trim();
    }

    return 'Vehículo';
  }, [selectedVehicle]);

  const loadStations = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchStations();
      setStations(data);
      setSelectedStation((prev) =>
        prev ? data.find((station) => station.id === prev.id) || null : null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las gasolineras');
    } finally {
      setLoading(false);
    }
  };

  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Tu navegador no permite geolocalización.');
      return;
    }

    setGeoLoading(true);
    setGeoError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGeoLoading(false);
      },
      () => {
        setGeoError('No se pudo obtener tu ubicación.');
        setGeoLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      },
    );
  };

  const handleVehicleChange = async (id: number) => {
    setSelectedVehicleId(id);

    const vehicle = vehicles.find((item) => item.idvehiculo === id);
    if (vehicle) {
      localStorage.setItem('mapscar_vehicle', JSON.stringify(vehicle));
    }

    setSelectedStation(null);
    await loadStations();
  };

  const handleLogout = () => {
    localStorage.removeItem('mapscar_token');
    localStorage.removeItem('mapscar_user');
    localStorage.removeItem('mapscar_vehicle');
    setUserMenuOpen(false);
    navigate('/login');
  };

  const handleDeleteComment = async (_stationId: number, commentId: number) => {
    try {
      await deleteComment(commentId);
      await loadStations();
    } catch (error) {
      console.error('Error al borrar comentario:', error);
    }
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const data = await fetchMyVehicles();
        setVehicles(data);

        const stored = getStoredVehicle();

        if (stored?.idvehiculo && data.some((item) => item.idvehiculo === stored.idvehiculo)) {
          setSelectedVehicleId(stored.idvehiculo);
        } else if (data[0]?.idvehiculo) {
          setSelectedVehicleId(data[0].idvehiculo);
          localStorage.setItem('mapscar_vehicle', JSON.stringify(data[0]));
        } else {
          localStorage.removeItem('mapscar_vehicle');
          setSelectedVehicleId(0);
          setStations([]);
        }
      } catch {
        setVehicles([]);
        setSelectedVehicleId(0);
        localStorage.removeItem('mapscar_vehicle');
        setStations([]);
      }
    };

    loadDashboardData();

    const handleVehicleChanged = async () => {
      await loadDashboardData();
    };

    window.addEventListener('vehicleChanged', handleVehicleChanged);

    return () => {
      window.removeEventListener('vehicleChanged', handleVehicleChanged);
    };
  }, []);

  useEffect(() => {
    if (!selectedVehicleId) return;

    const vehicle = vehicles.find((item) => item.idvehiculo === selectedVehicleId);
    if (!vehicle) return;

    localStorage.setItem('mapscar_vehicle', JSON.stringify(vehicle));
    setSelectedStation(null);
    loadStations();
  }, [selectedVehicleId, vehicles]);

  useEffect(() => {
    if (selectedFilter === 'Cercanas' && !userCoords && !geoLoading) {
      requestUserLocation();
    }
  }, [selectedFilter, userCoords, geoLoading]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }

      if (vehicleMenuRef.current && !vehicleMenuRef.current.contains(target)) {
        setVehicleMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredStations = useMemo(() => {
    const value = search.trim().toLowerCase();

    let result = stations.filter((station) => {
      const name = station.name ?? station.nombre ?? '';
      const address = station.address ?? station.domicilio ?? '';
      const municipio = station.municipio ?? '';
      const estado = station.estado ?? '';

      return (
        !value ||
        name.toLowerCase().includes(value) ||
        address.toLowerCase().includes(value) ||
        municipio.toLowerCase().includes(value) ||
        estado.toLowerCase().includes(value)
      );
    });

    if (selectedFilter === 'Cercanas' && userCoords) {
      result = [...result].sort((a, b) => {
        const aDistance =
          a.lat != null && a.lng != null
            ? getDistanceKm(userCoords.lat, userCoords.lng, a.lat, a.lng)
            : Number.POSITIVE_INFINITY;

        const bDistance =
          b.lat != null && b.lng != null
            ? getDistanceKm(userCoords.lat, userCoords.lng, b.lat, b.lng)
            : Number.POSITIVE_INFINITY;

        return aDistance - bDistance;
      });
    }

    if (selectedFilter === 'Mejor rendimiento') {
      result = [...result].sort((a, b) => {
        const perfA = parsePerformanceValue(a.estimatedPerformance) || 0;
        const perfB = parsePerformanceValue(b.estimatedPerformance) || 0;

        if (perfB !== perfA) {
          return perfB - perfA;
        }

        const ratingA = Number(a.rating) || 0;
        const ratingB = Number(b.rating) || 0;

        return ratingB - ratingA;
      });
    }

    if (selectedFilter === 'Mejor calificación') {
      result = [...result].sort((a, b) => {
        const ratingA = Number(a.rating) || 0;
        const ratingB = Number(b.rating) || 0;

        if (ratingB !== ratingA) {
          return ratingB - ratingA;
        }

        const reviewsA = Number(a.reviewCount) || 0;
        const reviewsB = Number(b.reviewCount) || 0;

        return reviewsB - reviewsA;
      });
    }

    return result;
  }, [search, stations, selectedFilter, userCoords]);

  const activeStation =
    filteredStations.find((station) => station.id === selectedStation?.id) ?? null;

  useEffect(() => {
  if (filteredStations.length === 0) {
    setSelectedStation(null);
    return;
  }

  setSelectedStation(filteredStations[0]);
}, [selectedFilter, userCoords]);

  const activeStationDistance =
    userCoords && activeStation?.lat != null && activeStation?.lng != null
      ? getDistanceKm(userCoords.lat, userCoords.lng, activeStation.lat, activeStation.lng)
      : null;

  return (
    <div className="dashboard-web-page">
      <header className="site-header dashboard-web-header">
        <div className="site-brand">
          <span className="brand-badge"><Fuel size={28} /></span>
          <span>
            <strong>MapsCar</strong>
            <small>Colima</small>
          </span>
        </div>

        <nav className="dashboard-header-nav">
          {isAdmin && (
            <button
              className="dashboard-nav-pill"
              type="button"
              onClick={() => navigate('/admin')}
            >
              <Cable size={16} /> Administrador
            </button>
          )}

          <button className="dashboard-nav-pill active" type="button">
            <LayoutDashboard size={16} /> Mapa
          </button>

          <button
            className="dashboard-nav-pill"
            type="button"
            onClick={() => navigate('/vehicle-setup')}
          >
            <SlidersHorizontal size={16} /> Agregar vehículo
          </button>
        </nav>

        <div className="dashboard-header-actions">
          <div className="dashboard-user-menu" ref={userMenuRef}>
            <button
              className="dashboard-user-pill"
              type="button"
              onClick={() => {
                setUserMenuOpen((prev) => !prev);
                setVehicleMenuOpen(false);
              }}
            >
              <UserRound size={18} />
              <span>{currentUser?.Username || 'Mi perfil'}</span>
            </button>

            {userMenuOpen && (
              <div className="dashboard-user-dropdown compact">
                <button
                  type="button"
                  className="dashboard-user-dropdown-item danger"
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="dashboard-web-main">
        <section id="dashboard-workspace" className="dashboard-workspace">
          <aside className="dashboard-sidebar-panel">
            <div className="dashboard-sidebar-top">
              <div className="dashboard-panel-title">
                <h2>Filtros</h2>
              </div>

              <div className="dashboard-searchbox">
                <Search size={20} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar gasolinera o dirección..."
                />
              </div>
            </div>

            <div className="dashboard-filter-grid">
              {filters.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  className={`dashboard-filter-card ${selectedFilter === label ? 'active' : ''}`}
                  onClick={() => {
                    if (label === 'Cercanas') {
                      requestUserLocation();
                    }

                    setSelectedFilter(label);
                  }}
                  type="button"
                >
                  <span className="dashboard-filter-icon"><Icon size={18} /></span>
                  <span>
                    <strong>{label}</strong>
                  </span>
                </button>
              ))}
            </div>

            {selectedFilter === 'Cercanas' && geoLoading && (
              <div className="admin-empty-state">Obteniendo tu ubicación...</div>
            )}

            {selectedFilter === 'Cercanas' && geoError && (
              <div className="error-box">{geoError}</div>
            )}

            <div className="dashboard-sidebar-summary">
              <div className="dashboard-summary-card vehicle-summary-select-card">
                <ShieldCheck size={18} />
                <div className="vehicle-selector-wrap">
                  <span className="vehicle-selector-label">Vehículo</span>

                  <div className="vehicle-custom-select" ref={vehicleMenuRef}>
                    <button
                      type="button"
                      className="vehicle-custom-select-trigger"
                      onClick={() => {
                        setVehicleMenuOpen((prev) => !prev);
                        setUserMenuOpen(false);
                      }}
                    >
                      <span className="vehicle-custom-select-value">{vehicleAlias}</span>
                      <span className="vehicle-custom-select-arrow">⌄</span>
                    </button>

                    {vehicleMenuOpen && (
                      <div className="vehicle-custom-select-menu">
                        {vehicles.length === 0 ? (
                          <div className="vehicle-custom-select-empty">Sin vehículos</div>
                        ) : (
                          vehicles.map((vehicle) => {
                            const label =
                              vehicle.alias ||
                              `${vehicle.marca?.nombre || ''} ${vehicle.modelo?.nombre || ''}`.trim() ||
                              `Vehículo ${vehicle.idvehiculo}`;

                            return (
                              <button
                                key={vehicle.idvehiculo}
                                type="button"
                                className={`vehicle-custom-select-item ${selectedVehicleId === vehicle.idvehiculo ? 'active' : ''
                                  }`}
                                onClick={() => {
                                  handleVehicleChange(vehicle.idvehiculo);
                                  setVehicleMenuOpen(false);
                                }}
                              >
                                {label}
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="dashboard-summary-card">
                <TrendingUp size={18} />
                <div>
                  <strong>
                    {selectedFilter === 'Cercanas'
                      ? userCoords
                        ? 'Ubicación activa'
                        : geoLoading
                          ? 'Buscando...'
                          : 'Sin ubicación'
                      : selectedFilter === 'Mejor rendimiento'
                        ? activeStation?.estimatedPerformance || 'Sin datos'
                        : `${activeStation?.rating?.toFixed(1) || '0.0'} ★`}
                  </strong>
                </div>
              </div>
            </div>

            <div className="dashboard-station-section">
              <div className="dashboard-panel-title compact">
                <h2>Gasolineras</h2>
                <span>{filteredStations.length}</span>
              </div>

              <div className="dashboard-station-list">
                {loading && <div className="admin-empty-state">Cargando gasolineras...</div>}
                {!loading && error && <div className="error-box">{error}</div>}
                {!loading && !error && filteredStations.length === 0 && (
                  <div className="admin-empty-state">No hay gasolineras registradas.</div>
                )}

                {!loading && !error && filteredStations.map((station) => {
                  const distanceKm =
                    userCoords && station.lat != null && station.lng != null
                      ? getDistanceKm(userCoords.lat, userCoords.lng, station.lat, station.lng)
                      : null;

                  return (
                    <article
                      key={station.id}
                      className={`dashboard-station-card ${activeStation?.id === station.id ? 'selected' : ''}`}
                      onClick={() =>
                        setSelectedStation((prev) => (prev?.id === station.id ? null : station))
                      }
                    >
                      <div className="dashboard-station-head">
                        <div>
                          <strong>{station.name}</strong>
                          <p>{station.address}</p>
                        </div>
                        <ChevronRight size={18} />
                      </div>

                      <div className="station-meta-row">
                        <span className="station-rating">
                          <Star size={16} fill="currentColor" /> {station.rating.toFixed(1)}
                        </span>
                        <span>{station.reviewCount} reseñas</span>

                        {selectedFilter === 'Cercanas' && distanceKm != null && (
                          <span>A {distanceKm.toFixed(1)} km</span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </aside>

          <section className="dashboard-map-panel">
            <div className="dashboard-map-shell">
              <StationsMap
                stations={filteredStations}
                selectedStationId={selectedStation?.id ?? 0}
                onSelectStation={setSelectedStation}
                currentUserId={String(currentUser?.IDusuario ?? '')}
                onDeleteComment={handleDeleteComment}
                onRateStation={(station) => {
                  setSelectedStation(station);
                  setShowRating(true);
                }}
              />
            </div>
          </section>
        </section>
      </main>

      <RatingModal
        open={showRating && !!activeStation}
        onClose={() => setShowRating(false)}
        stationId={activeStation?.id || 0}
        stationName={activeStation?.name || 'Gasolinera'}
        onSaved={loadStations}
      />
    </div>
  );
}