import {
  Bike, Cable, Car, Fuel, LayoutDashboard, Palette,
  Save, SlidersHorizontal, Trash2, UserRound, Pencil, Check, X
} from 'lucide-react';
import { FormEvent, useEffect, useRef, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  createMyVehicle,
  deleteMyVehicle,
  fetchMyVehicles,
  fetchVehicleCatalogs,
  updateMyVehicle,
  isAdminUser,
  getCurrentUser,
  type UserVehicle,
  type VehicleCatalogs,
} from '../services/api';



const iconMap = {
  car: Car,
  truck: Car,
  bike: Bike,
};

const emptyCatalogs: VehicleCatalogs = { tipos: [], marcas: [], modelos: [] };

export function VehicleSetupPage() {
  const navigate = useNavigate();
  const isAdmin = isAdminUser();
  const currentUser = getCurrentUser();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const [catalogs, setCatalogs] = useState<VehicleCatalogs>(emptyCatalogs);
  const [vehicles, setVehicles] = useState<UserVehicle[]>([]);
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [form, setForm] = useState({ idMarca: '', idmodelo: '', color: '', alias: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingAliasId, setEditingAliasId] = useState<number | null>(null);
  const [editingAliasValue, setEditingAliasValue] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('mapscar_token');
    localStorage.removeItem('mapscar_user');
    localStorage.removeItem('mapscar_vehicle');
    setUserMenuOpen(false);
    navigate('/login');
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

  useEffect(() => {
    Promise.all([fetchVehicleCatalogs(), fetchMyVehicles().catch(() => [])])
      .then(([catalogData, vehicleData]) => {
        setCatalogs(catalogData);
        setVehicles(vehicleData);
        setSelectedType(catalogData.tipos[0]?.id ?? null);

        if (vehicleData[0]) {
          localStorage.setItem('mapscar_vehicle', JSON.stringify(vehicleData[0]));
        }
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'No se pudo cargar el catálogo de vehículos'),
      );
  }, []);

  useEffect(() => {
    if (!form.idMarca) {
      setCatalogs((current) => ({ ...current, modelos: [] }));
      setForm((current) => ({ ...current, idmodelo: '' }));
      return;
    }

    fetchVehicleCatalogs(form.idMarca)
      .then((catalogData) => {
        setCatalogs((current) => ({ ...current, modelos: catalogData.modelos }));
        setForm((current) => {
          const exists = catalogData.modelos.some((model) => String(model.id) === current.idmodelo);
          return exists ? current : { ...current, idmodelo: '' };
        });
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los modelos'),
      );
  }, [form.idMarca]);

  const selectedTypeLabel = useMemo(
    () => catalogs.tipos.find((item) => item.id === selectedType)?.nombre ?? 'Sin tipo',
    [selectedType, catalogs],
  );

  const selectedModel = catalogs.modelos.find((item) => String(item.id) === form.idmodelo);

  const vehicleSummary = [
    { label: 'Tipo', value: selectedTypeLabel },
    {
      label: 'Marca',
      value:
        catalogs.marcas.find((item) => String(item.id) === form.idMarca)?.nombre || 'Pendiente',
    },
    { label: 'Modelo', value: selectedModel?.nombre || 'Pendiente' },
    { label: 'Año', value: String(selectedModel?.anio || 'Pendiente') },
    { label: 'Color', value: form.color || 'Pendiente' },
    { label: 'Alias', value: form.alias || 'Sin alias' },
  ];

 const handleSelectSavedVehicle = async (vehicle: UserVehicle) => {
  setSelectedVehicleId(vehicle.idvehiculo);
  setError('');

  const brandId = vehicle.marca?.id ? String(vehicle.marca.id) : '';
  const modelId = vehicle.modelo?.id ? String(vehicle.modelo.id) : '';

  setForm({
    idMarca: brandId,
    idmodelo: modelId,
    color: vehicle.color || '',
    alias: vehicle.alias || '',
  });

  if (vehicle.tipo?.id) {
    setSelectedType(vehicle.tipo.id);
  }

  if (brandId) {
    try {
      const catalogData = await fetchVehicleCatalogs(brandId);
      setCatalogs((current) => ({ ...current, modelos: catalogData.modelos }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los modelos');
    }
  }

  localStorage.setItem('mapscar_vehicle', JSON.stringify(vehicle));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('vehicleChanged'));
  }
};

  const handleDeleteVehicle = async (vehicle: UserVehicle) => {
    const title =
      vehicle.alias ||
      `${vehicle.marca?.nombre || ''} ${vehicle.modelo?.nombre || ''}`.trim() ||
      'este vehículo';

    const result = await Swal.fire({
      title: '¿Eliminar vehículo?',
      text: `Se eliminará ${title}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#111111',
      color: '#ffffff',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#2a2a2a',
    });

    if (!result.isConfirmed) return;

    try {
      await deleteMyVehicle(vehicle.idvehiculo);

      const updatedVehicles = await fetchMyVehicles().catch(() => []);
      setVehicles(updatedVehicles);

      if (selectedVehicleId === vehicle.idvehiculo) {
        setSelectedVehicleId(null);
        setSelectedType(catalogs.tipos[0]?.id ?? null);
        setForm({ idMarca: '', idmodelo: '', color: '', alias: '' });
        localStorage.removeItem('mapscar_vehicle');
      }

      await Swal.fire({
        icon: 'success',
        title: 'Vehículo eliminado',
        text: 'El vehículo se eliminó correctamente.',
        timer: 1600,
        showConfirmButton: false,
        background: '#111111',
        color: '#ffffff',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo eliminar el vehículo';

      await Swal.fire({
        icon: 'error',
        title: 'Error al eliminar',
        text: message,
        confirmButtonText: 'Entendido',
        background: '#111111',
        color: '#ffffff',
        confirmButtonColor: '#ef4444',
      });
    }
  };

  const handleStartAliasEdit = (vehicle: UserVehicle) => {
    setEditingAliasId(vehicle.idvehiculo);
    setEditingAliasValue(vehicle.alias || '');
  };

  const handleCancelAliasEdit = () => {
    setEditingAliasId(null);
    setEditingAliasValue('');
  };

  const handleSaveAliasEdit = async (vehicleId: number) => {
  const newAlias = editingAliasValue.trim();

  try {
    const response = await updateMyVehicle(vehicleId, { alias: newAlias });

    const updatedVehicle = response?.vehicle;

    if (updatedVehicle) {
      setVehicles((prev) =>
        prev.map((vehicle) =>
          vehicle.idvehiculo === vehicleId ? updatedVehicle : vehicle
        )
      );

      if (selectedVehicleId === vehicleId) {
        localStorage.setItem('mapscar_vehicle', JSON.stringify(updatedVehicle));
      }
    } else {
      const refreshed = await fetchMyVehicles().catch(() => []);
      setVehicles(refreshed);

      if (selectedVehicleId === vehicleId) {
        const selected = refreshed.find((v) => v.idvehiculo === vehicleId);
        if (selected) {
          localStorage.setItem('mapscar_vehicle', JSON.stringify(selected));
        }
      }
    }

    setEditingAliasId(null);
    setEditingAliasValue('');
  } catch (err) {
    setError(err instanceof Error ? err.message : 'No se pudo actualizar el alias');
  }
};

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedType) {
      setError('Selecciona un tipo de vehículo');
      return;
    }

    const duplicateVehicle = vehicles.find((vehicle) => {
      const sameBrand = String(vehicle.marca?.id || '') === form.idMarca;
      const sameModel = String(vehicle.modelo?.id || '') === form.idmodelo;
      const sameAlias =
        (vehicle.alias || '').trim().toLowerCase() ===
        form.alias.trim().toLowerCase();

      return sameBrand && sameModel && sameAlias;
    });

    if (duplicateVehicle) {
      setError('Ya tienes registrado un vehículo con la misma marca, modelo y alias.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await createMyVehicle({
        idtipo: selectedType,
        idMarca: Number(form.idMarca),
        idmodelo: Number(form.idmodelo),
        color: form.color,
        alias: form.alias,
      });

      localStorage.setItem('mapscar_vehicle', JSON.stringify(response.vehicle));

      if (typeof window !== 'undefined') {
  window.dispatchEvent(new Event('vehicleChanged'));
}

      const vehicleData = await fetchMyVehicles().catch(() => []);
      setVehicles(vehicleData);

      if (response.vehicle?.idvehiculo) {
        setSelectedVehicleId(response.vehicle.idvehiculo);
      }

      await Swal.fire({
        icon: 'success',
        title: 'Vehículo guardado',
        text: 'La información se guardó correctamente.',
        timer: 1800,
        showConfirmButton: false,
        background: '#111111',
        color: '#ffffff',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo guardar el vehículo';
      setError(message);

      await Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: message,
        confirmButtonText: 'Entendido',
        background: '#111111',
        color: '#ffffff',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vehicle-web-page">
      <header className="site-header vehicle-page-header">
        <Link to="/dashboard" className="site-brand">
          <span className="brand-badge"><Fuel size={28} /></span>
          <span>
            <strong>MapsCar</strong>
            <small>Colima</small>
          </span>
        </Link>

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

          <button
            className="dashboard-nav-pill"
            type="button"
            onClick={() => navigate('/dashboard')}
          >
            <LayoutDashboard size={16} /> Mapa
          </button>

          <button className="dashboard-nav-pill active" type="button">
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

      <main className="vehicle-web-main">
        <section className="vehicle-workspace vehicle-workspace-full">
          <div className="vehicle-page-heading">
            <h1>Crear vehículo</h1>
          </div>

          <div className="vehicle-workspace-grid">
            <form className="vehicle-form-panel" onSubmit={handleSubmit}>
              <section className="vehicle-section-block">
                <div className="vehicle-section-heading minimal">
                  <span>Tipo</span>
                </div>

                <div className="vehicle-selector-grid">
                  {catalogs.tipos.map((item) => {
                    const Icon = iconMap[(item.imagen as keyof typeof iconMap) || 'car'] || Car;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`vehicle-choice-card ${selectedType === item.id ? 'selected' : ''}`}
                        onClick={() => setSelectedType(item.id)}
                      >
                        <span className="vehicle-choice-icon"><Icon size={24} /></span>
                        <strong>{item.nombre}</strong>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="vehicle-section-block">
                <div className="vehicle-section-heading minimal">
                  <span>Datos</span>
                </div>

                <div className="form-grid two-columns compact-gap no-top-margin">
                  <label>
                    <span>Marca</span>
                    <select
                      className="input"
                      value={form.idMarca}
                      onChange={(e) => {
                        setSelectedVehicleId(null);
                        setForm({ ...form, idMarca: e.target.value, idmodelo: '' });
                      }}
                      required
                    >
                      <option value="">Selecciona marca</option>
                      {catalogs.marcas.map((brand) => (
                        <option key={brand.id} value={brand.id}>{brand.nombre}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Modelo</span>
                    <select
                      className="input"
                      value={form.idmodelo}
                      onChange={(e) => {
                        setSelectedVehicleId(null);
                        setForm({ ...form, idmodelo: e.target.value });
                      }}
                      required
                      disabled={!form.idMarca || catalogs.modelos.length === 0}
                    >
                      <option value="">
                        {form.idMarca ? 'Selecciona modelo' : 'Primero selecciona marca'}
                      </option>
                      {catalogs.modelos.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.nombre} {model.anio}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Color</span>
                    <input
                      className="input"
                      value={form.color}
                      onChange={(e) => {
                        setSelectedVehicleId(null);
                        setForm({ ...form, color: e.target.value });
                      }}
                      placeholder="Color"
                      required
                    />
                  </label>

                  <label>
                    <span>Alias</span>
                    <input
                      className="input"
                      value={form.alias}
                      onChange={(e) => {
                        setSelectedVehicleId(null);
                        setForm({ ...form, alias: e.target.value });
                      }}
                      placeholder="Alias"
                    />
                  </label>
                </div>
              </section>

              {error && <div className="error-box">{error}</div>}

              <div className="vehicle-form-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => navigate('/dashboard')}
                >
                  Regresar
                </button>
                <button className="primary-button" type="submit" disabled={loading}>
                  <Save size={18} />
                  {loading ? 'Guardando...' : 'Guardar vehículo'}
                </button>
              </div>
            </form>

            <aside className="vehicle-summary-panel">
              <div className="vehicle-summary-card main">
                <div className="vehicle-summary-top">
                  <div>
                    <span className="summary-kicker">Resumen</span>
                    <h3>{form.alias || 'Vehículo principal'}</h3>
                  </div>
                  <span className="vehicle-summary-icon"><Palette size={20} /></span>
                </div>

                <div className="vehicle-summary-grid">
                  {vehicleSummary.map((item) => (
                    <div key={item.label} className="vehicle-summary-item">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="vehicle-summary-card secondary saved-card">
                <div className="saved-card-head">
                  <span className="summary-kicker">Historial</span>
                  <h4>Guardados</h4>
                </div>

                {vehicles.length === 0 ? (
                  <p>No hay vehículos registrados.</p>
                ) : (
                  <div className="vehicle-saved-grid">
                    {vehicles.map((item) => {
                      const title =
                        item.alias ||
                        `${item.marca?.nombre || ''} ${item.modelo?.nombre || ''}`.trim() ||
                        `Vehículo ${item.idvehiculo}`;

                      const subtitle = [item.color, item.modelo?.anio].filter(Boolean).join(' · ');

                      return (
                        <div
                          key={item.idvehiculo}
                          className={`vehicle-saved-card ${selectedVehicleId === item.idvehiculo ? 'active' : ''}`}
                        >
                          <div
                            className="vehicle-saved-card-main"
                            onClick={() => {
                              if (editingAliasId !== item.idvehiculo) {
                                handleSelectSavedVehicle(item);
                              }
                            }}
                          >
                            {editingAliasId === item.idvehiculo ? (
                              <div className="vehicle-alias-edit-wrap">
                                <input
                                  className="vehicle-alias-edit-input"
                                  value={editingAliasValue}
                                  onChange={(e) => setEditingAliasValue(e.target.value)}
                                  placeholder="Alias"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            ) : (
                              <>
                                <strong>{title}</strong>
                                <span>{subtitle || 'Sin detalles'}</span>
                              </>
                            )}
                          </div>

                          <div className="vehicle-saved-side-actions">
                            {editingAliasId === item.idvehiculo ? (
                              <>
                                <button
                                  type="button"
                                  className="vehicle-alias-save"
                                  onClick={() => handleSaveAliasEdit(item.idvehiculo)}
                                  title="Guardar alias"
                                >
                                  <Check size={14} />
                                </button>

                                <button
                                  type="button"
                                  className="vehicle-alias-cancel"
                                  onClick={handleCancelAliasEdit}
                                  title="Cancelar"
                                >
                                  <X size={14} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="vehicle-saved-edit"
                                  onClick={() => handleStartAliasEdit(item)}
                                  title="Editar alias"
                                >
                                  <Pencil size={16} />
                                </button>

                                <button
                                  type="button"
                                  className="vehicle-saved-delete"
                                  onClick={() => handleDeleteVehicle(item)}
                                  title="Eliminar vehículo"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}