import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Fuel, Eye, EyeOff } from 'lucide-react';
import { loginUser, loginWithGoogle } from '../services/api';


declare global {
  interface Window {
    google?: any;
  }
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ access: '', contrasena: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const successMessage = location.state?.registered
    ? 'Cuenta creada correctamente, ahora inicia sesión.'
    : '';

  const saveSessionAndRedirect = (response: any) => {
    localStorage.setItem('mapscar_token', response?.token || '');
    localStorage.setItem('mapscar_user', JSON.stringify(response?.usuario || {}));

    if (Number(response?.usuario?.IDrol) === 1) {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await loginUser({
        Username: form.access,
        Correo: form.access,
        Contrasena: form.contrasena,
      });

      saveSessionAndRedirect(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credential?: string) => {
    if (!credential) {
      setError('No se recibió la credencial de Google');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await loginWithGoogle(credential);
      saveSessionAndRedirect(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión con Google');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!window.google) return;

      clearInterval(interval);

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: (response: any) => {
          handleGoogleLogin(response.credential);
        },
      });

      window.google.accounts.id.renderButton(
        document.getElementById('google-login-button'),
        {
          theme: 'outline',
          size: 'large',
          width: 420,
          text: 'continue_with',
        }
      );
    }, 300);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="login-clean-page">
      <div className="login-clean-card">
        <div className="login-clean-brand">
          <div className="login-clean-logo">
            <Fuel size={40} strokeWidth={2.2} />
          </div>

          <div className="login-clean-brand-text">
            <h1>MapsCar</h1>
            <span>Colima</span>
          </div>
        </div>

        <div className="login-clean-header">
          <h2>Iniciar sesión</h2>
          <p>Accede a tu cuenta</p>
        </div>

        <form className="login-clean-form" onSubmit={handleSubmit}>
          <label>
            <span>Usuario o correo</span>
            <input
              className="login-clean-input"
              value={form.access}
              onChange={(e) => setForm({ ...form, access: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
              required
            />
          </label>

          <label>
            <span>Contraseña</span>

            <div className="login-password-wrap">
              <input
                className="login-clean-input login-password-input"
                type={showPassword ? 'text' : 'password'}
                value={form.contrasena}
                onChange={(e) => setForm({ ...form, contrasena: e.target.value })}
                required
              />

              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </label>

          {successMessage && <div className="success-box">{successMessage}</div>}
          {error && <div className="error-box">{error}</div>}

          <button
            className="login-clean-button"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Iniciar sesión'}
          </button>
        </form>

        <div className="login-or-divider">
          <span></span>
          <p>or</p>
          <span></span>
        </div>

        <div id="google-login-button" className="google-login-wrap"></div>



        <div className="login-clean-footer">
          <Link to="/register" className="login-clean-link">
            Registrar
          </Link>
        </div>
      </div>
    </div>


  );

}

