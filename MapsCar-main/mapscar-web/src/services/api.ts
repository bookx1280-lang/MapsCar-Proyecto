import type { GasStation as MockGasStation, StationComment } from '../data/mock';
export type GasStation = MockGasStation;
export type { StationComment };

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export type LoginPayload = {
  Correo?: string;
  correo?: string;
  Username?: string;
  username?: string;
  Contrasena: string;
  contrasena?: string;
  turnstileToken?: string;
};

export type RegisterPayload = {
  Username: string;
  Nombre: string;
  Apellido_Paterno: string;
  Apellido_Materno: string;
  Correo: string;
  Contrasena: string;
  IDrol: number;
  turnstileToken?: string;
};

export type StationPayload = {
  nombre: string;
  domicilio: string;
  imagen?: string;
  latitud: number;
  longitud: number;
  idEstado?: number | null;
  idMunicipio?: number | null;
};

export type LocationCatalog = {
  id: number;
  nombre: string;
  municipios: Array<{ id: number; nombre: string }>;
};

export type VehicleCatalogs = {
  tipos: Array<{ id: number; nombre: string; imagen?: string | null }>;
  marcas: Array<{ id: number; nombre: string }>;
  modelos: Array<{ id: number; idMarca: number; nombre: string; anio: number; marca?: { id: number; nombre: string } | null }>;
};

export type UserVehicle = {
  idvehiculo: number;
  alias: string | null;
  color: string | null;
  rendimientoEstimado: number | null;
  tipo: { id: number; nombre: string } | null;
  marca: { id: number; nombre: string } | null;
  modelo: { id: number; idMarca?: number; nombre: string; anio: number } | null;
};

export type BrandAdminItem = {
  id: number;
  nombre: string;
  modelos: number;
  vehiculos: number;
};

export type ModelAdminItem = {
  id: number;
  idMarca: number;
  nombre: string;
  anio: number;
  vehiculos: number;
  marca: { id: number; nombre: string } | null;
};

export type ReviewItem = {
  id: number;
  puntuacion: number;
  comentario: string | null;
  fecha: string;
  estatus: number;
  usuario: { idusuario: string; username: string; nombre: string; correo: string; rol: string | null } | null;
  gasolinera: { id: number; nombre: string } | null;
  vehiculo: { id: number; tipo: string | null; marca: string | null; modelo: string | null; anio: number | null } | null;
};

export type RatingPayload = {
  idgasolinera: number;
  idvehiculo?: number;
  puntuacion: number;
  comentario?: string;
};

async function handleResponse(response: Response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || data?.message || 'OcurriÃ³ un error en la solicitud');
  }
  return data?.data ?? data;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('mapscar_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('mapscar_user') || 'null');
  } catch {
    return null;
  }
}

export function getStoredVehicle() {
  try {
    return JSON.parse(localStorage.getItem('mapscar_vehicle') || 'null');
  } catch {
    return null;
  }
}

export function isAdminUser() {
  const user = getCurrentUser();
  return Number(user?.IDrol) === 1;
}

export async function registerUser(payload: RegisterPayload) {
  const response = await fetch(`${API_BASE_URL}/api/usuario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function loginUser(payload: LoginPayload) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function fetchStations(): Promise<GasStation[]> {
  const vehicle = getStoredVehicle();

  let url = `${API_BASE_URL}/api/gasolineras`;

if (vehicle?.tipo?.id && vehicle?.marca?.id && vehicle?.modelo?.id) {
  const params = new URLSearchParams({
    idTipo: String(vehicle.tipo.id),
    idMarca: String(vehicle.marca.id),
    idModelo: String(vehicle.modelo.id),
  });
  
    url += `?${params.toString()}`;
  }

const response = await fetch(url, {
    headers: authHeaders(),
  });

  return handleResponse(response);
}

export async function createStation(payload: StationPayload) {
  const response = await fetch(`${API_BASE_URL}/api/gasolineras`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function updateStation(id: number, payload: Partial<StationPayload>) {
  const response = await fetch(`${API_BASE_URL}/api/gasolineras/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function deleteStation(id: number) {
  const response = await fetch(`${API_BASE_URL}/api/gasolineras/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(response);
}

export async function deleteUser(idusuario: string) {
  const response = await fetch(`${API_BASE_URL}/api/usuario/${idusuario}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(response);
}

export async function fetchLocationCatalog(): Promise<LocationCatalog[]> {
  const response = await fetch(`${API_BASE_URL}/api/catalogos/ubicaciones`);
  return handleResponse(response);
}

export async function fetchVehicleCatalogs(marcaId?: number | string | null): Promise<VehicleCatalogs> {
  const qs = marcaId ? `?marcaId=${encodeURIComponent(String(marcaId))}` : '';
  const response = await fetch(`${API_BASE_URL}/api/catalogos/vehiculos${qs}`);
  return handleResponse(response);
}

export async function fetchMyVehicles(): Promise<UserVehicle[]> {
  const response = await fetch(`${API_BASE_URL}/api/vehiculos/mis-vehiculos`, {
    headers: authHeaders(),
  });
  return handleResponse(response);
}

export async function createMyVehicle(payload: {
  idtipo: number;
  idMarca: number;
  idmodelo: number;
  color?: string;
  alias?: string;
}) {
  const response = await fetch(`${API_BASE_URL}/api/vehiculos/mis-vehiculos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function deleteMyVehicle(idvehiculo: number) {
  const response = await fetch(`${API_BASE_URL}/api/vehiculos/mis-vehiculos/${idvehiculo}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(response);
}

export async function updateMyVehicle(
  idvehiculo: number,
  payload: {
    idtipo?: number;
    idMarca?: number;
    idmodelo?: number;
    color?: string;
    alias?: string;
    rendimientoEstimado?: number | string | null;
  }
) {
  const response = await fetch(`${API_BASE_URL}/api/vehiculos/mis-vehiculos/${idvehiculo}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function createRating(payload: RatingPayload) {
  const response = await fetch(`${API_BASE_URL}/api/puntuaciones`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function fetchAdminReviews(): Promise<ReviewItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/puntuaciones/admin`, {
    headers: authHeaders(),
  });
  return handleResponse(response);
}

export async function deleteReview(id: number) {
  const response = await fetch(`${API_BASE_URL}/api/puntuaciones/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(response);
}

export async function fetchUsers() {
  const response = await fetch(`${API_BASE_URL}/api/usuario`, {
    headers: authHeaders(),
  });
  return handleResponse(response);
}


export async function fetchAdminBrands(): Promise<BrandAdminItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/catalogos/marcas`, { headers: authHeaders() });
  return handleResponse(response);
}

export async function createAdminBrand(payload: { nombre: string }) {
  const response = await fetch(`${API_BASE_URL}/api/admin/catalogos/marcas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function updateAdminBrand(id: number, payload: { nombre: string }) {
  const response = await fetch(`${API_BASE_URL}/api/admin/catalogos/marcas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function deleteAdminBrand(id: number) {
  const response = await fetch(`${API_BASE_URL}/api/admin/catalogos/marcas/${id}`, { method: 'DELETE', headers: authHeaders() });
  return handleResponse(response);
}

export async function fetchAdminModels(marcaId?: number | string | null): Promise<ModelAdminItem[]> {
  const qs = marcaId ? `?marcaId=${encodeURIComponent(String(marcaId))}` : '';
  const response = await fetch(`${API_BASE_URL}/api/admin/catalogos/modelos${qs}`, { headers: authHeaders() });
  return handleResponse(response);
}

export async function createAdminModel(payload: { idMarca: number; nombre: string; anio: number }) {
  const response = await fetch(`${API_BASE_URL}/api/admin/catalogos/modelos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function updateAdminModel(id: number, payload: { idMarca: number; nombre: string; anio: number }) {
  const response = await fetch(`${API_BASE_URL}/api/admin/catalogos/modelos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function deleteAdminModel(id: number) {
  const response = await fetch(`${API_BASE_URL}/api/admin/catalogos/modelos/${id}`, { method: 'DELETE', headers: authHeaders() });
  return handleResponse(response);
}

export async function deleteComment(commentId: number) {
  const response = await fetch(`${API_BASE_URL}/api/puntuaciones/${commentId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  return handleResponse(response);

}

export async function loginWithGoogle(credential: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ credential }),
  });

  return handleResponse(response);
}