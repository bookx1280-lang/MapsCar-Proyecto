import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VehicleSetupPage } from './pages/VehicleSetupPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminPage } from './pages/AdminPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      
      {/* Rutas Protegidas para Usuarios Normales */}
      <Route
        path="/vehicle-setup"
        element={<ProtectedRoute element={<VehicleSetupPage />} requiredRole="user" />}
      />
      <Route
        path="/dashboard"
        element={<ProtectedRoute element={<DashboardPage />} requiredRole="user" />}
      />

      {/* Rutas Protegidas para Administradores */}
      <Route
        path="/admin"
        element={<ProtectedRoute element={<AdminPage />} requiredRole="admin" />}
      />

      {/* Ruta por defecto para rutas no encontradas */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}