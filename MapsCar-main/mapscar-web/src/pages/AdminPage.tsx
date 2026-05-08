import { Cable, Fuel, LayoutDashboard, SlidersHorizontal, UserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AdminBrandsModelsPanel } from '../components/AdminBrandsModelsPanel';
import { AdminGasStationsPanel } from '../components/AdminGasStationsPanel';
import { AdminReviewsPanel } from '../components/AdminReviewsPanel';
import type { GasStation } from '../data/mock';
import { fetchStations, getCurrentUser, isAdminUser } from '../services/api';

export function AdminPage() {
    const navigate = useNavigate();
    const currentUser = getCurrentUser();
    const isAdmin = isAdminUser();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const userMenuRef = useRef<HTMLDivElement | null>(null);

    const [stations, setStations] = useState<GasStation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const handleLogout = () => {
        setIsLoggingOut(true);
        localStorage.removeItem('mapscar_token');
        localStorage.removeItem('mapscar_user');
        localStorage.removeItem('mapscar_vehicle');
        setUserMenuOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;

            if (userMenuRef.current && !userMenuRef.current.contains(target)) {
                setUserMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const loadStations = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await fetchStations();
            setStations(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudieron cargar las gasolineras');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStations();
    }, []);

    if (isLoggingOut) {
        return <Navigate to="/login" replace />;
    }

    if (!isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="dashboard-web-page">
            <header className="site-header dashboard-web-header">
                <div className="site-brand">
                    <span className="brand-badge"><Fuel size={28} /></span>
                    <span>
                        <strong>MapsCar</strong>
                        <small>Administrador</small>
                    </span>
                </div>

                <nav className="dashboard-header-nav">

                    <button className="dashboard-nav-pill active" type="button">
                        <Cable size={16} /> Administrador
                    </button>

                    <button
                        className="dashboard-nav-pill"
                        type="button"
                        onClick={() => navigate('/dashboard')}
                    >
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
                            onClick={() => setUserMenuOpen((prev) => !prev)}
                        >
                            <UserRound size={18} />
                            <span>{currentUser?.Username || 'Administrador'}</span>
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

            <main className="admin-page-main">
                <section className="admin-page-hero">
                    <div className="admin-page-hero-title">
                        <span className="admin-page-icon">
                            <Cable size={24} />
                        </span>
                        <div>
                            <h1>Administrador</h1>
                        </div>
                    </div>
                </section>

                {loading && <div className="admin-page-alert">Cargando información...</div>}
                {!loading && error && <div className="error-box">{error}</div>}

                {!loading && !error && (
                    <div className="admin-page-grid">
                        <section className="admin-page-card admin-page-card-wide">
                            <AdminGasStationsPanel stations={stations} onRefresh={loadStations} />
                        </section>

                        <section className="admin-page-card">
                            <AdminReviewsPanel />
                        </section>

                        <section className="admin-page-card">
                            <AdminBrandsModelsPanel />
                        </section>
                    </div>
                )}
            </main>
        </div>
    );
}