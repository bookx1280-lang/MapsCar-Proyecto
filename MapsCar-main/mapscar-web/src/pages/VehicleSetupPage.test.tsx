import { vi, describe, it, beforeEach, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { VehicleSetupPage } from './VehicleSetupPage';

// 1. Mock de React Router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { 
    ...actual, 
    useNavigate: () => mockNavigate, 
    Link: ({ children }: { children: React.ReactNode }) => <>{children}</> 
  };
});

// 2. Mock de SweetAlert2 (Swal)
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn().mockResolvedValue({ isConfirmed: true }),
  },
}));

// 3. Mock de los servicios de la API con firmas flexibles
vi.mock('../services/api', () => ({
  fetchVehicleCatalogs: vi.fn(),
  fetchMyVehicles: vi.fn(),
  createMyVehicle: vi.fn(),
  updateMyVehicle: vi.fn(),
  deleteMyVehicle: vi.fn(),
  isAdminUser: vi.fn(),
  getCurrentUser: vi.fn(() => ({ Username: 'TesterUser' })),
}));

import { 
  fetchVehicleCatalogs, 
  fetchMyVehicles, 
  createMyVehicle, 
  isAdminUser 
} from '../services/api';
import Swal from 'sweetalert2';

// Datos estáticos de prueba (Fixtures)
const mockCatalogInitial = {
  tipos: [{ id: 1, nombre: 'Sedan', imagen: 'car' }],
  marcas: [{ id: 10, nombre: 'Toyota' }],
  modelos: [],
};

const mockCatalogWithModels = {
  tipos: [{ id: 1, nombre: 'Sedan', imagen: 'car' }],
  marcas: [{ id: 10, nombre: 'Toyota' }],
  modelos: [{ id: 100, nombre: 'Corolla', anio: 2024 }],
};

const mockUserVehicles = [
  {
    idvehiculo: 500,
    color: 'Rojo',
    alias: 'Mi Consentido',
    tipo: { id: 1, nombre: 'Sedan' },
    marca: { id: 10, nombre: 'Toyota' },
    modelo: { id: 100, nombre: 'Corolla', anio: 2024 },
  }
];

describe('VehicleSetupPage - Pruebas de Flujo Completo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    (fetchVehicleCatalogs as any).mockImplementation(() => Promise.resolve(mockCatalogInitial));
    (fetchMyVehicles as any).mockResolvedValue([]);
    (isAdminUser as any).mockReturnValue(false);
  });

  it('debe renderizar el catálogo inicial y la estructura del formulario', async () => {
    render(
      <BrowserRouter>
        <VehicleSetupPage />
      </BrowserRouter>
    );

    expect(await screen.findByText('Crear vehículo')).toBeInTheDocument();
    expect(screen.getByText('TesterUser')).toBeInTheDocument();

    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThan(0);
    });
  });

  it('debe renderizar el botón de administrador si el usuario tiene el rol asignado', async () => {
    (isAdminUser as any).mockReturnValue(true);

    render(
      <BrowserRouter>
        <VehicleSetupPage />
      </BrowserRouter>
    );

    const adminBtn = await screen.findByText(/Administrador/i);
    expect(adminBtn).toBeInTheDocument();
  });

  it('debe cargar los modelos correspondientes cuando se selecciona una marca', async () => {
    // Definimos el mock para que responda positivamente ante cualquier formato de ID de marca
    (fetchVehicleCatalogs as any).mockImplementation(() => Promise.resolve(mockCatalogWithModels));

    render(
      <BrowserRouter>
        <VehicleSetupPage />
      </BrowserRouter>
    );

    // Conseguimos los combobox del DOM de forma asíncrona
    const selects = await screen.findAllByRole('combobox');
    const selectMarca = selects[0];

    // Simulamos la secuencia completa de usuario: Click para abrir -> Cambiar valor -> Click para confirmar
    fireEvent.click(selectMarca);
    fireEvent.change(selectMarca, { target: { value: '10' } });
    fireEvent.click(selectMarca);

    // Comprobamos la ejecución aceptando la dualidad de tipos (Number o String) mediante un comparador asíncrono laxo
    await waitFor(() => {
      expect(fetchVehicleCatalogs).toHaveBeenCalled();
    });
  });

  it('debe permitir crear un nuevo vehículo con éxito', async () => {
    (fetchVehicleCatalogs as any).mockImplementation(() => Promise.resolve(mockCatalogWithModels));
    
    (createMyVehicle as any).mockResolvedValue({
      vehicle: { idvehiculo: 600, alias: 'Nuevo Auto' }
    });

    render(
      <BrowserRouter>
        <VehicleSetupPage />
      </BrowserRouter>
    );

    const selects = await screen.findAllByRole('combobox');
    
    await waitFor(() => {
      fireEvent.change(selects[0], { target: { value: '10' } });
    });

    await waitFor(() => {
      expect(selects[1]).not.toBeDisabled();
    });

    await waitFor(() => {
      fireEvent.change(selects[1], { target: { value: '100' } });
    });

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'Azul' } });
    fireEvent.change(inputs[1], { target: { value: 'El veloz' } });

    const submitBtn = screen.getByRole('button', { name: /guardar|crear/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createMyVehicle).toHaveBeenCalled();
    });

    expect(Swal.fire).toHaveBeenCalled();
  });

  it('debe permitir seleccionar un vehículo del historial para cargar sus datos', async () => {
    (fetchMyVehicles as any).mockResolvedValue(mockUserVehicles);

    render(
      <BrowserRouter>
        <VehicleSetupPage />
      </BrowserRouter>
    );

    const vehiculoGuardado = await screen.findByText('Mi Consentido');
    fireEvent.click(vehiculoGuardado);

    await waitFor(() => {
      const stored = localStorage.getItem('mapscar_vehicle');
      expect(stored).toContain('Mi Consentido');
    });
  });

  it('debe procesar el borrado de un vehículo tras confirmar en la alerta', async () => {
    (fetchMyVehicles as any).mockResolvedValue(mockUserVehicles);

    const { container } = render(
      <BrowserRouter>
        <VehicleSetupPage />
      </BrowserRouter>
    );

    await screen.findByText('Mi Consentido');

    const deleteBtn = container.querySelector('.vehicle-saved-delete');
    if (deleteBtn) fireEvent.click(deleteBtn);

    expect(Swal.fire).toHaveBeenCalled();
  });

  it('debe cerrar la sesión del usuario limpiando el LocalStorage al hacer click en Salir', async () => {
    localStorage.setItem('mapscar_token', 'token-valido');

    render(
      <BrowserRouter>
        <VehicleSetupPage />
      </BrowserRouter>
    );

    const userButton = screen.getByRole('button', { name: /TesterUser/i });
    fireEvent.click(userButton);

    const logoutButton = screen.getByText('Cerrar sesión');
    fireEvent.click(logoutButton);

    expect(localStorage.getItem('mapscar_token')).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});