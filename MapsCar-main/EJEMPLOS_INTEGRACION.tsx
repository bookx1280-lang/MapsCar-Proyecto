// ARCHIVO DE EJEMPLO - Cómo integrar UserMenu en tus componentes

// ============================================================================
// EJEMPLO 1: En DashboardPage
// ============================================================================

import { UserMenu } from '../components/UserMenu';

export function DashboardPage() {
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Dashboard</h1>
        </div>
        <div className="header-right">
          <UserMenu /> {/* ← Agrega aquí */}
        </div>
      </header>
      {/* Resto del contenido */}
    </div>
  );
}

// ============================================================================
// EJEMPLO 2: En AdminPage
// ============================================================================

import { UserMenu } from '../components/UserMenu';

export function AdminPage() {
  return (
    <div className="admin-container">
      <nav className="admin-nav">
        <h2>Panel de Admin</h2>
        <UserMenu /> {/* ← O aquí */}
      </nav>
      {/* Contenido admin */}
    </div>
  );
}

// ============================================================================
// EJEMPLO 3: En un Header/Layout Reutilizable
// ============================================================================

import { UserMenu } from '../components/UserMenu';
import { Fuel } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="app-header">
      <div className="header-brand">
        <Fuel size={24} />
        <h1>MapsCar</h1>
      </div>

      <div className="header-actions">
        <UserMenu /> {/* ← Aquí es lo ideal */}
      </div>
    </header>
  );
}

// Uso en Dashboard:
// <AppHeader />
// <DashboardContent />

// ============================================================================
// EJEMPLO 4: Usando useAuth() Hook directamente
// ============================================================================

import { useAuth } from '../contexts/AuthContext';
import { LogOut, Shield } from 'lucide-react';

export function MiComponente() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();

  if (!isAuthenticated) {
    return <p>No estás autenticado</p>;
  }

  return (
    <div>
      <p>Bienvenido: {user.username}</p>

      {isAdmin && (
        <div className="admin-badge">
          <Shield size={16} />
          Eres administrador
        </div>
      )}

      <button
        onClick={logout}
        className="logout-btn"
      >
        <LogOut size={18} />
        Cerrar sesión
      </button>
    </div>
  );
}

// ============================================================================
// EJEMPLO 5: Verificar autenticación antes de hacer cambios
// ============================================================================

import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

export function AgregarEstacionPanel() {
  const { isAuthenticated, user } = useAuth();
  const [nombre, setNombre] = useState('');

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      alert('Debes estar logueado para agregar una estación');
      return;
    }

    console.log(`${user.username} está agregando una estación`);
    // Agregar lógica aquí
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Nombre de estación"
      />
      <button type="submit">Agregar</button>
    </form>
  );
}

// ============================================================================
// EJEMPLO 6: Proteger múltiples rutas a la vez
// ============================================================================

// En App.tsx:

import { ProtectedRoute } from './components/ProtectedRoute';

const protectedRoutes = [
  { path: '/dashboard', element: <DashboardPage />, requiredRole: 'user' },
  { path: '/vehicle-setup', element: <VehicleSetupPage />, requiredRole: 'user' },
  { path: '/admin', element: <AdminPage />, requiredRole: 'admin' },
  { path: '/admin/catalogos', element: <AdminCatalogos />, requiredRole: 'admin' },
];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {protectedRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={
            <ProtectedRoute
              element={route.element}
              requiredRole={route.requiredRole as 'admin' | 'user'}
            />
          }
        />
      ))}

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

// ============================================================================
// EJEMPLO 7: Mostrar/Ocultar elementos según rol
// ============================================================================

import { useAuth } from '../contexts/AuthContext';
import { Settings, Users, BarChart3 } from 'lucide-react';

export function Sidebar() {
  const { isAdmin } = useAuth();

  return (
    <aside className="sidebar">
      <nav>
        <a href="/dashboard">
          <BarChart3 size={20} /> Dashboard
        </a>

        {isAdmin && (
          <>
            <a href="/admin">
              <Settings size={20} /> Administración
            </a>
            <a href="/admin/usuarios">
              <Users size={20} /> Gestionar Usuarios
            </a>
          </>
        )}
      </nav>
    </aside>
  );
}

// Solo admins verán los links de administración

// ============================================================================
// EJEMPLO 8: Redirigir si no tienes permisos
// ============================================================================

import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export function ConfiguracionAvanzada() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div>
      <h2>Configuración Avanzada</h2>
      {/* Solo admins llegan aquí */}
    </div>
  );
}

// ============================================================================
// CONSEJO: Estructura recomendada
// ============================================================================

/*
src/
├── contexts/
│   └── AuthContext.tsx              ← Proporciona useAuth()
├── components/
│   ├── ProtectedRoute.tsx           ← Protege rutas
│   ├── UserMenu.tsx                 ← Menú de usuario
│   └── AppHeader.tsx                ← Header con UserMenu
├── pages/
│   ├── LoginPage.tsx
│   ├── UnauthorizedPage.tsx         ← Acceso denegado
│   ├── DashboardPage.tsx            ← Con <AppHeader />
│   ├── AdminPage.tsx                ← Con <AppHeader />
│   └── VehicleSetupPage.tsx         ← Con <AppHeader />
├── App.tsx                           ← Define rutas protegidas
├── main.tsx                          ← Envuelve con <AuthProvider>
└── styles.css
*/

export {};
