import { vi, describe, it, beforeEach, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminGasStationsPanel } from './AdminGasStationsPanel';

// 1. Mock de los servicios de la API
vi.mock('../services/api', () => ({
  createStation: vi.fn(),
  deleteStation: vi.fn(),
  fetchLocationCatalog: vi.fn(),
  updateStation: vi.fn(),
}));

import {
  createStation,
  deleteStation,
  fetchLocationCatalog,
  updateStation
} from '../services/api';

// 2. Fixtures con tipado forzado laxo (any) para evitar discrepancias con el modelo de mock externo
const mockStations: any[] = [
  {
    id: 101,
    name: 'Gasolinera Norte',
    address: 'Av. Tecnológico 4500',
    image: 'http://example.com/gas.png',
    latitud: 19.4326,
    longitud: -99.1332,
    idEstado: 1,
    idMunicipio: 1
  },
  {
    id: 102,
    name: 'Estación Sur',
    address: 'Calzada del Valle 120',
    image: '',
    latitud: 25.6866,
    longitud: -100.3161,
    idEstado: 1,
    idMunicipio: 1
  }
];

const mockLocationCatalog = [
  {
    id: 1,
    nombre: 'Jalisco',
    municipios: [
      { id: 1, nombre: 'Guadalajara' },
      { id: 2, nombre: 'Zapopan' }
    ]
  },
  {
    id: 2,
    nombre: 'Colima',
    municipios: [
      { id: 3, nombre: 'Colima Centro' }
    ]
  }
];

describe('AdminGasStationsPanel - Suite de Pruebas Completa', () => {
  const mockOnRefresh = vi.fn(() => Promise.resolve());

  beforeEach(() => {
    vi.clearAllMocks();
    (fetchLocationCatalog as any).mockResolvedValue(mockLocationCatalog);
  });

  it('debe renderizar el encabezado compacto con el contador correcto de gasolineras', async () => {
    render(<AdminGasStationsPanel stations={mockStations as any} onRefresh={mockOnRefresh} />);

    expect(screen.getByText('Gasolineras')).toBeInTheDocument();
    expect(screen.getByText('2 gasolineras')).toBeInTheDocument();
    expect(fetchLocationCatalog).toHaveBeenCalledTimes(1);
  });

  it('debe desplegar y colapsar la lista de gasolineras al hacer click en el contenedor', async () => {
    render(<AdminGasStationsPanel stations={mockStations as any} onRefresh={mockOnRefresh} />);

    expect(screen.queryByText('Gasolinera Norte')).not.toBeInTheDocument();

    const headerRow = screen.getByText('Gasolineras').closest('.admin-collapsible-header');
    if (!headerRow) throw new Error('No se encontró el contenedor del encabezado');
    fireEvent.click(headerRow);

    expect(await screen.findByText('Gasolinera Norte')).toBeInTheDocument();
    expect(screen.getByText('Estación Sur')).toBeInTheDocument();

    fireEvent.click(headerRow);
    expect(screen.queryByText('Gasolinera Norte')).not.toBeInTheDocument();
  });

  it('debe abrir el modal de registro vacío al presionar "Nueva gasolinera"', async () => {
    render(<AdminGasStationsPanel stations={mockStations as any} onRefresh={mockOnRefresh} />);

    const btnNueva = screen.getByRole('button', { name: /nueva gasolinera/i });
    fireEvent.click(btnNueva);

    expect(await screen.findByText('Registrar gasolinera')).toBeInTheDocument();
  });

  it('debe permitir crear una nueva gasolinera exitosamente', async () => {
    (createStation as any).mockResolvedValue({});

    render(<AdminGasStationsPanel stations={mockStations as any} onRefresh={mockOnRefresh} />);

    fireEvent.click(screen.getByRole('button', { name: /nueva gasolinera/i }));

    // Usamos selectores basados en la estructura del DOM (Input hermano de un Span indicador)
    const inputs = screen.getAllByRole('textbox');
    
    // Asignación manual basada en el orden de renderizado en tu HTML
    fireEvent.change(inputs[0], { target: { value: 'Estación Poniente' } }); // Nombre
    fireEvent.change(inputs[1], { target: { value: 'Av. Constituyentes 89' } }); // Domicilio
    fireEvent.change(inputs[2], { target: { value: '19.4123' } }); // Latitud
    fireEvent.change(inputs[3], { target: { value: '-99.1543' } }); // Longitud

    const btnGuardar = screen.getByRole('button', { name: /guardar gasolinera/i });
    fireEvent.click(btnGuardar);

    await waitFor(() => {
      expect(createStation).toHaveBeenCalledWith({
        nombre: 'Estación Poniente',
        domicilio: 'Av. Constituyentes 89',
        imagen: undefined,
        latitud: 19.4123,
        longitud: -99.1543,
        idEstado: 1,
        idMunicipio: 1,
      });
    });

    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });

  it('debe abrir el modal con datos cargados al editar y procesar la actualización', async () => {
    (updateStation as any).mockResolvedValue({});

    render(<AdminGasStationsPanel stations={mockStations as any} onRefresh={mockOnRefresh} />);

    const headerRow = screen.getByText('Gasolineras').closest('.admin-collapsible-header');
    if (headerRow) fireEvent.click(headerRow);

    const btnEditar = await screen.findAllByTitle('Editar');
    fireEvent.click(btnEditar[0]);

    expect(await screen.findByText('Editar gasolinera')).toBeInTheDocument();

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'Gasolinera Norte Editada' } });

    fireEvent.click(screen.getByRole('button', { name: /guardar gasolinera/i }));

    await waitFor(() => {
      expect(updateStation).toHaveBeenCalledWith(101, expect.objectContaining({
        nombre: 'Gasolinera Norte Editada',
        domicilio: 'Av. Tecnológico 4500'
      }));
    });

    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });

  it('debe eliminar una gasolinera tras confirmar la advertencia del sistema', async () => {
    (deleteStation as any).mockResolvedValue({});
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<AdminGasStationsPanel stations={mockStations as any} onRefresh={mockOnRefresh} />);

    const headerRow = screen.getByText('Gasolineras').closest('.admin-collapsible-header');
    if (headerRow) fireEvent.click(headerRow);

    const btnEliminar = await screen.findAllByTitle('Eliminar');
    fireEvent.click(btnEliminar[1]);

    expect(confirmSpy).toHaveBeenCalledWith('¿Eliminar esta gasolinera?');
    
    await waitFor(() => {
      expect(deleteStation).toHaveBeenCalledWith(102);
    });
    expect(mockOnRefresh).toHaveBeenCalledTimes(1);

    confirmSpy.mockRestore();
  });

  it('no debe eliminar la gasolinera si el usuario cancela el diálogo de confirmación', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<AdminGasStationsPanel stations={mockStations as any} onRefresh={mockOnRefresh} />);

    const headerRow = screen.getByText('Gasolineras').closest('.admin-collapsible-header');
    if (headerRow) fireEvent.click(headerRow);

    const btnEliminar = await screen.findAllByTitle('Eliminar');
    fireEvent.click(btnEliminar[0]);

    expect(confirmSpy).toHaveBeenCalled();
    expect(deleteStation).not.toHaveBeenCalled();
    expect(mockOnRefresh).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('debe mostrar un mensaje en pantalla si la API falla al guardar', async () => {
    (createStation as any).mockRejectedValue(new Error('Error de conexión con el servidor'));

    render(<AdminGasStationsPanel stations={mockStations as any} onRefresh={mockOnRefresh} />);

    fireEvent.click(screen.getByRole('button', { name: /nueva gasolinera/i }));
    
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'Falla' } });
    fireEvent.change(inputs[1], { target: { value: 'Falla' } });
    fireEvent.change(inputs[2], { target: { value: '0' } });
    fireEvent.change(inputs[3], { target: { value: '0' } });

    fireEvent.click(screen.getByRole('button', { name: /guardar gasolinera/i }));

    expect(await screen.findByText('Error de conexión con el servidor')).toBeInTheDocument();
  });
});