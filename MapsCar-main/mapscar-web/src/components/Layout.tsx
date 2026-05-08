import { ReactNode } from 'react';
import { Fuel, ShieldCheck, MapPinned, Gauge } from 'lucide-react';
import { Link } from 'react-router-dom';

export function CenteredAuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="auth-web-page">
      <header className="site-header">
        <Link to="/" className="site-brand">
          <span className="brand-badge"><Fuel size={28} /></span>
          <span>
            <strong>MapsCar</strong>
            <small>Colima</small>
          </span>
        </Link>

        <nav className="site-nav">
          <Link to="/login" className="site-nav-link">Login</Link>
          <Link to="/register" className="site-nav-link site-nav-link-accent">Crear cuenta</Link>
        </nav>
      </header>

      <main className="auth-web-main">
        <section className="auth-showcase-panel">
          <div className="auth-showcase-copy">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>

          <div className="showcase-grid">
            <article className="showcase-card highlight">
              <ShieldCheck size={20} />
              <div>
                <strong>Acceso</strong>
              </div>
            </article>
            <article className="showcase-card">
              <MapPinned size={20} />
              <div>
                <strong>Mapa</strong>
              </div>
            </article>
            <article className="showcase-card">
              <Gauge size={20} />
              <div>
                <strong>Rendimiento</strong>
              </div>
            </article>
          </div>

          <div className="auth-showcase-mock">
            <div className="mock-topbar">
              <span />
              <span />
              <span />
            </div>
            <div className="mock-layout">
              <aside className="mock-sidebar">
                <div className="mock-chip active" />
                <div className="mock-chip" />
                <div className="mock-chip" />
              </aside>
              <section className="mock-content">
                <div className="mock-search" />
                <div className="mock-map">
                  <div className="mock-pin a" />
                  <div className="mock-pin b" />
                  <div className="mock-pin c" />
                </div>
              </section>
            </div>
          </div>
        </section>

        <section className="auth-form-panel">
          <div className="auth-panel-header">
            <h2>{title}</h2>
          </div>
          <div className="auth-panel-body">{children}</div>
        </section>
      </main>
    </div>
  );
}
