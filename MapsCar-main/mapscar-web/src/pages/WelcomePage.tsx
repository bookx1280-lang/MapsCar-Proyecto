import { Fuel } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="welcome-custom-page">
      <main className="welcome-custom-content">
        <section className="welcome-brand-block">
          <div className="welcome-brand-icon">
            <Fuel size={54} strokeWidth={2.2} />
          </div>

          <div className="welcome-brand-text">
            <h1>MapsCar</h1>
            <p>colima</p>
          </div>
        </section>

        <section className="welcome-buttons-row">
          <button
            className="welcome-main-button welcome-secondary"
            onClick={() => navigate('/login')}
          >
            Iniciar sesión
          </button>

          <button
            className="welcome-main-button welcome-primary"
            onClick={() => navigate('/register')}
          >
            Crear cuenta
          </button>
        </section>
      </main>
    </div>
  );
}