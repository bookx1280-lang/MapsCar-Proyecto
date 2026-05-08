import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { ChevronDown, MessageSquare, Trash2, Users } from 'lucide-react';
import {
  deleteReview,
  deleteUser,
  fetchAdminReviews,
  fetchUsers,
  type ReviewItem,
} from '../services/api';

export function AdminReviewsPanel() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openUsers, setOpenUsers] = useState(false);
  const [openReviews, setOpenReviews] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [reviewsData, usersData] = await Promise.all([fetchAdminReviews(), fetchUsers()]);
      setReviews(reviewsData);
      setUsers(usersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los paneles de administración');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: '¿Eliminar reseña?',
      text: 'Esta acción no se puede deshacer.',
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
      await deleteReview(id);
      await load();

      await Swal.fire({
        icon: 'success',
        title: 'Reseña eliminada',
        text: 'La reseña se eliminó correctamente.',
        timer: 1600,
        showConfirmButton: false,
        background: '#111111',
        color: '#ffffff',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo eliminar la reseña';

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

  const handleDeleteUser = async (user: any) => {
    if (user.RolNombre === 'Administrador') {
      await Swal.fire({
        icon: 'warning',
        title: 'Acción no permitida',
        text: 'No se puede eliminar un usuario administrador.',
        confirmButtonText: 'Entendido',
        background: '#111111',
        color: '#ffffff',
        confirmButtonColor: '#f59e0b',
      });
      return;
    }

    const result = await Swal.fire({
      title: '¿Eliminar usuario?',
      text: `Se eliminará a ${user.Username}. Esta acción no se puede deshacer.`,
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
      await deleteUser(user.IDusuario);
      await load();

      await Swal.fire({
        icon: 'success',
        title: 'Usuario eliminado',
        text: 'El usuario se eliminó correctamente.',
        timer: 1600,
        showConfirmButton: false,
        background: '#111111',
        color: '#ffffff',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo eliminar el usuario';

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

  return (
    <section className="admin-reviews-grid">
      <article className="admin-reviews-card">
        <div
          className="admin-panel-header-row compact admin-collapsible-header"
          onClick={() => setOpenUsers((prev) => !prev)}
        >
          <div>
            <h3>Usuarios registrados</h3>
          </div>

          <div className="admin-collapsible-actions">
            <span className="feature-chip">
              <Users size={14} /> {users.length} usuarios
            </span>
            <span className={`admin-collapse-icon ${openUsers ? 'open' : ''}`}>
              <ChevronDown size={18} />
            </span>
          </div>
        </div>

        {openUsers && (
          loading ? (
            <div className="admin-empty-state">Cargando usuarios...</div>
          ) : error ? (
            <div className="error-box">{error}</div>
          ) : (
            <div className="admin-table-list">
              {users.map((user) => (
                <div key={user.IDusuario} className="admin-table-row">
                  <div>
                    <strong>{user.Username}</strong>
                    <span>{user.Correo}</span>
                  </div>

                  <div className="admin-row-actions">
                    <span className="muted-pill">{user.RolNombre}</span>
                    <button
                      className="ghost-icon danger"
                      type="button"
                      onClick={() => handleDeleteUser(user)}
                      title="Eliminar usuario"
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
          onClick={() => setOpenReviews((prev) => !prev)}
        >
          <div>
            <h3>Reseñas y puntuaciones</h3>
          </div>

          <div className="admin-collapsible-actions">
            <span className="feature-chip">
              <MessageSquare size={14} /> {reviews.length} reseñas
            </span>
            <span className={`admin-collapse-icon ${openReviews ? 'open' : ''}`}>
              <ChevronDown size={18} />
            </span>
          </div>
        </div>

        {openReviews && (
          loading ? (
            <div className="admin-empty-state">Cargando reseñas...</div>
          ) : error ? (
            <div className="error-box">{error}</div>
          ) : (
            <div className="admin-table-list reviews">
              {reviews.map((review) => (
                <div key={review.id} className="admin-review-item">
                  <div>
                    <strong>{review.gasolinera?.nombre || 'Gasolinera eliminada'}</strong>
                    <span>
                      {review.usuario?.username || 'Usuario desconocido'} · {review.puntuacion} estrellas
                    </span>
                    <p>{review.comentario || 'Sin comentario'}</p>
                  </div>

                  <button
                    className="ghost-icon danger"
                    type="button"
                    onClick={() => handleDelete(review.id)}
                    title="Eliminar reseña"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </article>
    </section>
  );
}