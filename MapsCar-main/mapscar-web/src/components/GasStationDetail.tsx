import { CSSProperties } from 'react';
import { MapPin, MessageSquare, Star, Trash2 } from 'lucide-react';

type Comment = {
  id: number;
  text: string;
  userId: string;
  userName?: string | null;
  date?: string | Date | null;
};

type Station = {
  id: number;
  name: string;
  address: string;
  location: string;
  rating: number;
  comments: Comment[];
  estimatedPerformance: string;
  image: string;
};

type Props = {
  station: Station;
  currentUserId: string;
  onRate: () => void;
  onDeleteComment: (commentId: number) => void;
  onClose?: () => void;
  detailPosition?: { x: number; y: number } | null;
};

export function GasStationDetail({
  station,
  currentUserId,
  onRate,
  onDeleteComment,
  onClose,
  detailPosition,
}: Props) {
  const dynamicStyle: CSSProperties | undefined = detailPosition
    ? {
        position: 'absolute',
        left: `${detailPosition.x}px`,
        top: `${detailPosition.y}px`,
        right: 'auto',
        bottom: 'auto',
        zIndex: 700,
        width: '420px',
        maxWidth: 'calc(100% - 32px)',
      }
    : undefined;

  return (
    <aside className="detail-panel detail-panel-dynamic" style={dynamicStyle}>
      {station.image ? (
        <img src={station.image} alt={station.name} className="detail-image" />
      ) : null}

      <div className="detail-content">
        <div className="detail-head">
          <div>
            <h3>{station.name}</h3>
            <p>{station.address}</p>
          </div>

          {onClose && (
            <button
              type="button"
              className="detail-close-button"
              onClick={onClose}
              title="Cerrar"
            >
              ×
            </button>
          )}
        </div>

        <div className="metric-row">
          <span>
            <MapPin size={16} /> {station.location}
          </span>
          <span>
            <Star size={16} /> {station.rating.toFixed(1)}
          </span>
        </div>

        <div className="info-card">
          <h4>Rendimiento</h4>
          <p>{station.estimatedPerformance}</p>
        </div>

        <div className="info-card">
          <h4>Comentarios</h4>

          <ul className="comment-list">
            {station.comments.map((comment) => {
              const isOwnComment = String(comment.userId) === String(currentUserId);

              const formattedDate = comment.date
                ? new Date(comment.date).toLocaleDateString('es-MX', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })
                : '';

              return (
                <li key={comment.id} className="comment-item">
                  <span className="comment-text">
                    <MessageSquare size={14} />
                    <span>
                      {comment.text}
                      {formattedDate && (
                        <small className="comment-date">{formattedDate}</small>
                      )}
                    </span>
                  </span>

                  {isOwnComment && (
                    <button
                      type="button"
                      className="comment-delete-button"
                      onClick={() => onDeleteComment(comment.id)}
                      title="Borrar comentario"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="detail-actions">
          <button className="primary-button" onClick={onRate}>
            Puntuar
          </button>
        </div>
      </div>
    </aside>
  );
}