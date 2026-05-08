import { Star, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createRating, fetchMyVehicles, getStoredVehicle, type UserVehicle } from '../services/api';

type Props = {
  open: boolean;
  onClose: () => void;
  stationId: number;
  stationName: string;
  onSaved: () => Promise<void> | void;
};

export function RatingModal({ open, onClose, stationId, stationName, onSaved }: Props) {
  const [rating, setRating] = useState(4);
  const [comment, setComment] = useState('');
  const [vehicles, setVehicles] = useState<UserVehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;

    setLoadingVehicles(true);
    setError('');

    fetchMyVehicles()
      .then((items) => {
        setVehicles(items);

        const storedVehicle = getStoredVehicle();

        if (storedVehicle?.idvehiculo) {
          const exists = items.some((item) => item.idvehiculo === storedVehicle.idvehiculo);
          setSelectedVehicleId(exists ? storedVehicle.idvehiculo : null);
        } else {
          setSelectedVehicleId(null);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'No se pudieron cargar tus vehículos');
      })
      .finally(() => setLoadingVehicles(false));
  }, [open]);

  const activeVehicle = useMemo(() => {
    return vehicles.find((item) => item.idvehiculo === selectedVehicleId) ?? null;
  }, [vehicles, selectedVehicleId]);

  const activeVehicleLabel = useMemo(() => {
    if (!activeVehicle) return 'Sin vehículo seleccionado';

    return (
      activeVehicle.alias ||
      `${activeVehicle.marca?.nombre || 'Vehículo'} ${activeVehicle.modelo?.nombre || ''} ${activeVehicle.modelo?.anio || ''}`.trim()
    );
  }, [activeVehicle]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVehicleId) {
      setError('Primero selecciona un vehículo en el panel principal.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await createRating({
        idgasolinera: stationId,
        idvehiculo: selectedVehicleId,
        puntuacion: rating,
        comentario: comment,
      });

      await onSaved();
      setComment('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la evaluación');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <button className="modal-close" type="button" onClick={onClose}>
          <X size={18} />
        </button>

        <h3>Agregar puntuación</h3>

        <p className="subtitle">
          <strong>{activeVehicleLabel}</strong>
        </p>

        <form onSubmit={handleSubmit} className="rating-form">
          <div className="stars-row">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                type="button"
                key={value}
                className={`star-button ${value <= rating ? 'active' : ''}`}
                onClick={() => setRating(value)}
              >
                <Star size={22} />
              </button>
            ))}
          </div>

          <label>
            <span>Vehículo asociado</span>
            <input
              className="input"
              value={loadingVehicles ? 'Cargando vehículo...' : activeVehicleLabel}
              readOnly
            />
          </label>

          <textarea
            className="textarea"
            placeholder={`Comparte tu experiencia en ${stationName}`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={5}
          />

          {error && <div className="error-box">{error}</div>}

          <button
            className="primary-button"
            type="submit"
            disabled={saving || loadingVehicles || !selectedVehicleId}
          >
            {saving ? 'Enviando...' : 'Enviar evaluación'}
          </button>
        </form>
      </div>
    </div>
  );
}