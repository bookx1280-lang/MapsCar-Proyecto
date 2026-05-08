import { FormEvent, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Edit3, Plus, Save, Trash2, X } from 'lucide-react';
import type { GasStation } from '../data/mock';
import {
  createStation,
  deleteStation,
  fetchLocationCatalog,
  type LocationCatalog,
  type StationPayload,
  updateStation
} from '../services/api';

type Props = {
  stations: GasStation[];
  onRefresh: () => Promise<void>;
};

type FormState = {
  id: number | null;
  nombre: string;
  domicilio: string;
  imagen: string;
  latitud: string;
  longitud: string;
  idEstado: string;
  idMunicipio: string;
};

const emptyForm: FormState = {
  id: null,
  nombre: '',
  domicilio: '',
  imagen: '',
  latitud: '',
  longitud: '',
  idEstado: '1',
  idMunicipio: '1',
};

export function AdminGasStationsPanel({ stations, onRefresh }: Props) {
  const [open, setOpen] = useState(false);
  const [showStations, setShowStations] = useState(false);
  const [locations, setLocations] = useState<LocationCatalog[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLocationCatalog().then(setLocations).catch(() => undefined);
  }, []);

  const municipios = useMemo(
    () => locations.find((item) => String(item.id) === form.idEstado)?.municipios || [],
    [locations, form.idEstado]
  );

  const openCreate = () => {
    setError('');
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (station: GasStation) => {
    setError('');
    setForm({
      id: station.id,
      nombre: station.name,
      domicilio: station.address,
      imagen: station.image || '',
      latitud: String(station.latitud ?? ''),
      longitud: String(station.longitud ?? ''),
      idEstado: '1',
      idMunicipio: '1',
    });
    setOpen(true);
  };

  const closeModal = () => {
    if (loading) return;
    setOpen(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload: StationPayload = {
        nombre: form.nombre,
        domicilio: form.domicilio,
        imagen: form.imagen || undefined,
        latitud: Number(form.latitud),
        longitud: Number(form.longitud),
        idEstado: form.idEstado ? Number(form.idEstado) : null,
        idMunicipio: form.idMunicipio ? Number(form.idMunicipio) : null,
      };

      if (form.id) {
        await updateStation(form.id, payload);
      } else {
        await createStation(payload);
      }

      await onRefresh();
      setOpen(false);
      setForm(emptyForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la gasolinera');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta gasolinera?')) return;

    try {
      await deleteStation(id);
      await onRefresh();

      if (form.id === id) {
        setOpen(false);
        setForm(emptyForm);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar');
    }
  };

  const modal = open
    ? createPortal(
        <div className="admin-modal-backdrop" onClick={closeModal}>
          <div
            className="admin-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div>
                <h3>{form.id ? 'Editar gasolinera' : 'Registrar gasolinera'}</h3>
              </div>

              <button
                className="modal-close"
                type="button"
                onClick={closeModal}
              >
                <X size={18} />
              </button>
            </div>

            <form className="form-grid two-columns" onSubmit={handleSubmit}>
              <label className="full-width">
                <span>Nombre</span>
                <input
                  className="input"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                />
              </label>

              <label className="full-width">
                <span>Domicilio</span>
                <input
                  className="input"
                  value={form.domicilio}
                  onChange={(e) => setForm({ ...form, domicilio: e.target.value })}
                  required
                />
              </label>

              <label>
                <span>Latitud</span>
                <input
                  className="input"
                  value={form.latitud}
                  onChange={(e) => setForm({ ...form, latitud: e.target.value })}
                  required
                />
              </label>

              <label>
                <span>Longitud</span>
                <input
                  className="input"
                  value={form.longitud}
                  onChange={(e) => setForm({ ...form, longitud: e.target.value })}
                  required
                />
              </label>

              <label>
                <span>Estado</span>
                <select
                  className="input"
                  value={form.idEstado}
                  onChange={(e) => setForm({ ...form, idEstado: e.target.value, idMunicipio: '' })}
                >
                  {locations.map((estado) => (
                    <option key={estado.id} value={estado.id}>
                      {estado.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Municipio</span>
                <select
                  className="input"
                  value={form.idMunicipio}
                  onChange={(e) => setForm({ ...form, idMunicipio: e.target.value })}
                >
                  {municipios.map((municipio) => (
                    <option key={municipio.id} value={municipio.id}>
                      {municipio.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label className="full-width">
                <span>Imagen (URL)</span>
                <input
                  className="input"
                  value={form.imagen}
                  onChange={(e) => setForm({ ...form, imagen: e.target.value })}
                />
              </label>

              {error && <div className="error-box full-width">{error}</div>}

              <div className="detail-actions full-width">
                {form.id && (
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => handleDelete(form.id!)}
                  >
                    <Trash2 size={18} /> Eliminar
                  </button>
                )}

                <button className="primary-button" type="submit" disabled={loading}>
                  <Save size={18} /> {loading ? 'Guardando...' : 'Guardar gasolinera'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <div className="admin-stations-panel">
        <div
          className="admin-panel-header-row compact admin-collapsible-header"
          onClick={() => setShowStations((prev) => !prev)}
        >
          <div>
            <h3>Gasolineras</h3>
          </div>

          <div className="admin-collapsible-actions">
            <span className="feature-chip">{stations.length} gasolineras</span>

            <button
              className="primary-button compact-button"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openCreate();
              }}
            >
              <Plus size={16} /> Nueva gasolinera
            </button>

            <span className={`admin-collapse-icon ${showStations ? 'open' : ''}`}>
              <ChevronDown size={18} />
            </span>
          </div>
        </div>

        {showStations && (
          <div className="admin-station-mini-list">
            {stations.length === 0 ? (
              <div className="admin-empty-state">No hay gasolineras registradas.</div>
            ) : (
              stations.map((station) => (
                <div key={station.id} className="admin-station-mini-item">
                  <div>
                    <strong>{station.name}</strong>
                    <span>{station.address}</span>
                  </div>

                  <div className="admin-mini-actions">
                    <button
                      className="ghost-icon"
                      type="button"
                      onClick={() => openEdit(station)}
                      title="Editar"
                    >
                      <Edit3 size={16} />
                    </button>

                    <button
                      className="ghost-icon danger"
                      type="button"
                      onClick={() => handleDelete(station.id)}
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {modal}
    </>
  );
}