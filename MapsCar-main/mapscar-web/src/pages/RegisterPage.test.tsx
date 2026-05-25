import { vi, describe, it, beforeEach, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { RegisterPage } from './RegisterPage';

// Mock de variables de entorno de Vite
vi.stubGlobal('import', {
  meta: { env: { VITE_TURNSTILE_SITE_KEY: 'mock-key' } }
});

// Mock de React Router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock de la API
vi.mock('../services/api', () => ({
  registerUser: vi.fn(),
}));

// Mock de Lucide React
vi.mock('lucide-react', () => ({
  Eye: () => <span>Mostrar</span>,
  EyeOff: () => <span>Ocultar</span>,
}));

// Mock de Turnstile
vi.mock('@marsidev/react-turnstile', () => ({
  Turnstile: ({ onSuccess }: { onSuccess: (token: string) => void }) => (
    <button type="button" data-testid="captcha-btn" onClick={() => onSuccess('token-exito')}>
      Resolver Captcha
    </button>
  ),
}));

// Mock del Layout
vi.mock('../components/Layout', () => ({
  CenteredAuthLayout: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

import { registerUser } from '../services/api';

describe('RegisterPage - Pruebas Unitarias Estables', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(registerUser).mockResolvedValue(undefined);
  });

  it('renders the registration form correctly', () => {
    const { container } = render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Crear Usuario')).toBeInTheDocument();
    expect(container.querySelectorAll('input').length).toBe(7);
    expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    const { container } = render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );

    const inputs = container.querySelectorAll('input');
    // inputs[5] = contraseña, inputs[6] = confirmar contraseña
    fireEvent.change(inputs[5], { target: { value: 'Contrasena_123' } });
    fireEvent.change(inputs[6], { target: { value: 'Diferente_123' } });

    const form = container.querySelector('form');
    if (form) fireEvent.submit(form);

    // Esperamos asíncronamente a que el estado actualice el DOM de pruebas
    await waitFor(() => {
      expect(screen.getByText('Las contraseñas no coinciden.')).toBeInTheDocument();
    });
    expect(registerUser).not.toHaveBeenCalled();
  });

  it('disables submit when Turnstile token is missing', () => {
    render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );

    const submitButton = screen.getByRole('button', { name: 'Crear cuenta' });
    expect(submitButton).toBeDisabled();
  });

  it('submits the form successfully and navigates to login', async () => {
    const { container } = render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );

    const inputs = container.querySelectorAll('input');
    fireEvent.change(inputs[0], { target: { value: 'usuario123' } }); // username
    fireEvent.change(inputs[1], { target: { value: 'Juan' } });       // nombre
    fireEvent.change(inputs[2], { target: { value: 'Perez' } });      // apellidoPaterno
    fireEvent.change(inputs[3], { target: { value: 'Gomez' } });      // apellidoMaterno
    fireEvent.change(inputs[4], { target: { value: 'juan@test.com' } }); // correo
    fireEvent.change(inputs[5], { target: { value: 'Contrasena_123' } }); // contrasena
    fireEvent.change(inputs[6], { target: { value: 'Contrasena_123' } }); // confirmarContrasena

    const captchaBtn = screen.getByTestId('captcha-btn');
    fireEvent.click(captchaBtn);

    const form = container.querySelector('form');
    if (form) fireEvent.submit(form);

    await waitFor(() => {
      expect(registerUser).toHaveBeenCalledWith({
        Username: 'usuario123',
        Nombre: 'Juan',
        Apellido_Paterno: 'Perez',
        Apellido_Materno: 'Gomez',
        Correo: 'juan@test.com',
        Contrasena: 'Contrasena_123',
        IDrol: 2,
        turnstileToken: 'token-exito',
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/login', {
      state: { registered: true },
    });
  });

  it('handles registration error', async () => {
    vi.mocked(registerUser).mockRejectedValue(new Error('Error de conexión'));
    const { container } = render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );

    const inputs = container.querySelectorAll('input');
    fireEvent.change(inputs[5], { target: { value: 'Contrasena_123' } });
    fireEvent.change(inputs[6], { target: { value: 'Contrasena_123' } });

    fireEvent.click(screen.getByTestId('captcha-btn'));

    const form = container.querySelector('form');
    if (form) fireEvent.submit(form);

    // Esperamos asíncronamente a que el mensaje asíncrono de la API sea renderizado
    await waitFor(() => {
      expect(screen.getByText('Error de conexión')).toBeInTheDocument();
    });
  });

  it('toggles password visibility', () => {
    const { container } = render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );

    const inputs = container.querySelectorAll('input');
    const passwordInput = inputs[5];

    expect(passwordInput.type).toBe('password');

    const toggleBtn = container.querySelectorAll('.password-field-toggle')[0];
    if (toggleBtn) {
      fireEvent.click(toggleBtn);
      expect(passwordInput.type).toBe('text');
    }
  });
});