import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ChevronDown, Edit3, Plus, Save, Trash2, X } from 'lucide-react';
import {
  createAdminBrand,
  createAdminModel,
  deleteAdminBrand,
  deleteAdminModel,
  fetchAdminBrands,
  fetchAdminModels,
  type BrandAdminItem,
  type ModelAdminItem,
  updateAdminBrand,
  updateAdminModel,
} from '../services/api';

type BrandForm = { id: number | null; nombre: string };
type ModelForm = { id: number | null; idMarca: string; nombre: string; anio: string };

const emptyBrand: BrandForm = { id: null, nombre: '' };
const emptyModel: ModelForm = { id: null, idMarca: '', nombre: '', anio: '' };

export function AdminBrandsModelsPanel() {
  const [brands, setBrands] = useState<BrandAdminItem[]>([]);
  const [models, setModels] = useState<ModelAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [brandOpen, setBrandOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [showBrands, setShowBrands] = useState(false);
  const [showModels, setShowModels] = useState(false);
  const [brandForm, setBrandForm] = useState<BrandForm>(emptyBrand);
  const [modelForm, setModelForm] = useState<ModelForm>(emptyModel);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [brandsData, modelsData] = await Promise.all([fetchAdminBrands(), fetchAdminModels()]);
      setBrands(brandsData);
      setModels(modelsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar marcas y modelos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const totalModels = useMemo(
    () => brands.reduce((acc, item) => acc + item.modelos, 0),
    [brands]
  );

  const openBrandCreate = () => {
    setBrandForm(emptyBrand);
    setBrandOpen(true);
    setError('');
  };

  const openBrandEdit = (brand: BrandAdminItem) => {
    setBrandForm({ id: brand.id, nombre: brand.nombre });
    setBrandOpen(true);
    setError('');
  };

  const openModelCreate = () => {
    setModelForm({ ...emptyModel, idMarca: brands[0] ? String(brands[0].id) : '' });
    setModelOpen(true);
    setError('');
  };

  const openModelEdit = (model: ModelAdminItem) => {
    setModelForm({
      id: model.id,
      idMarca: String(model.idMarca),
      nombre: model.nombre,
      anio: String(model.anio),
    });
    setModelOpen(true);
    setError('');
  };

  const submitBrand = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (brandForm.id) {
        await updateAdminBrand(brandForm.id, { nombre: brandForm.nombre });
      } else {
        await createAdminBrand({ nombre: brandForm.nombre });
      }

      await load();
      setBrandOpen(false);
      setBrandForm(emptyBrand);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la marca');
    } finally {
      setSaving(false);
    }
  };

  const submitModel = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        idMarca: Number(modelForm.idMarca),
        nombre: modelForm.nombre,
        anio: Number(modelForm.anio),
      };

      if (modelForm.id) {
        await updateAdminModel(modelForm.id, payload);
      } else {
        await createAdminModel(payload);
      }

      await load();
      setModelOpen(false);
      setModelForm(emptyModel);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el modelo');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBrand = async (id: number) => {
    if (!confirm('¿Eliminar esta marca?')) return;

    try {
      await deleteAdminBrand(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la marca');
    }
  };

  const handleDeleteModel = async (id: number) => {
    if (!confirm('¿Eliminar este modelo?')) return;

    try {
      await deleteAdminModel(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el modelo');
    }
  };

  return (
    <section className="admin-catalogs-grid">
      <article className="admin-reviews-card">
        <div
          className="admin-panel-header-row compact admin-collapsible-header"
          onClick={() => setShowBrands((prev) => !prev)}
        >
          <div>
            <h3>Marcas</h3>
          </div>

          <div className="admin-collapsible-actions">
            <span className="feature-chip">{brands.length} marcas</span>
            <button
              className="primary-button compact-button"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openBrandCreate();
              }}
            >
              <Plus size={16} /> Nueva
            </button>
            <span className={`admin-collapse-icon ${showBrands ? 'open' : ''}`}>
              <ChevronDown size={18} />
            </span>
          </div>
        </div>

        {showBrands && (
          loading ? (
            <div className="admin-empty-state">Cargando marcas...</div>
          ) : error ? (
            <div className="error-box">{error}</div>
          ) : (
            <div className="admin-table-list">
              {brands.map((brand) => (
                <div key={brand.id} className="admin-table-row">
                  <div>
                    <strong>{brand.nombre}</strong>
                    <span>{brand.modelos} modelos · {brand.vehiculos} vehículos</span>
                  </div>

                  <div className="admin-mini-actions">
                    <button
                      className="ghost-icon"
                      type="button"
                      onClick={() => openBrandEdit(brand)}
                    >
                      <Edit3 size={16} />
                    </button>

                    <button
                      className="ghost-icon danger"
                      type="button"
                      onClick={() => handleDeleteBrand(brand.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </article>

      <article className="admin-reviews-card">
        <div
          className="admin-panel-header-row compact admin-collapsible-header"
          onClick={() => setShowModels((prev) => !prev)}
        >
          <div>
            <h3>Modelos</h3>
          </div>

          <div className="admin-collapsible-actions">
            <span className="feature-chip">{totalModels} modelos</span>
            <button
              className="primary-button compact-button"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openModelCreate();
              }}
            >
              <Plus size={16} /> Nuevo
            </button>
            <span className={`admin-collapse-icon ${showModels ? 'open' : ''}`}>
              <ChevronDown size={18} />
            </span>
          </div>
        </div>

        {showModels && (
          loading ? (
            <div className="admin-empty-state">Cargando modelos...</div>
          ) : error ? (
            <div className="error-box">{error}</div>
          ) : (
            <div className="admin-table-list reviews">
              {models.map((model) => (
                <div key={model.id} className="admin-review-item">
                  <div>
                    <strong>{model.nombre} {model.anio}</strong>
                    <span>{model.marca?.nombre || 'Sin marca'} · {model.vehiculos} vehículos</span>
                  </div>

                  <div className="admin-mini-actions">
                    <button
                      className="ghost-icon"
                      type="button"
                      onClick={() => openModelEdit(model)}
                    >
                      <Edit3 size={16} />
                    </button>

                    <button
                      className="ghost-icon danger"
                      type="button"
                      onClick={() => handleDeleteModel(model.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </article>

      {brandOpen && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-card narrow">
            <div className="admin-modal-header">
              <div>
                <h3>{brandForm.id ? 'Editar marca' : 'Nueva marca'}</h3>
              </div>

              <button
                className="modal-close"
                type="button"
                onClick={() => setBrandOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form className="form-grid" onSubmit={submitBrand}>
              <label>
                <span>Nombre</span>
                <input
                  className="input"
                  value={brandForm.nombre}
                  onChange={(e) => setBrandForm({ ...brandForm, nombre: e.target.value })}
                  required
                />
              </label>

              {error && <div className="error-box">{error}</div>}

              <button className="primary-button" type="submit" disabled={saving}>
                <Save size={18} /> {saving ? 'Guardando...' : 'Guardar marca'}
              </button>
            </form>
          </div>
        </div>
      )}

      {modelOpen && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-card narrow">
            <div className="admin-modal-header">
              <div>
                <h3>{modelForm.id ? 'Editar modelo' : 'Nuevo modelo'}</h3>
              </div>

              <button
                className="modal-close"
                type="button"
                onClick={() => setModelOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form className="form-grid" onSubmit={submitModel}>
              <label>
                <span>Marca</span>
                <select
                  className="input"
                  value={modelForm.idMarca}
                  onChange={(e) => setModelForm({ ...modelForm, idMarca: e.target.value })}
                  required
                >
                  <option value="">Selecciona marca</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Modelo</span>
                <input
                  className="input"
                  value={modelForm.nombre}
                  onChange={(e) => setModelForm({ ...modelForm, nombre: e.target.value })}
                  required
                />
              </label>

              <label>
                <span>Año</span>
                <input
                  className="input"
                  type="number"
                  min="1980"
                  max="2100"
                  value={modelForm.anio}
                  onChange={(e) => setModelForm({ ...modelForm, anio: e.target.value })}
                  required
                />
              </label>

              {error && <div className="error-box">{error}</div>}

              <button className="primary-button" type="submit" disabled={saving}>
                <Save size={18} /> {saving ? 'Guardando...' : 'Guardar modelo'}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}