import { AlertCircle, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-red-100 rounded-full p-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">Acceso Denegado</h1>

        <p className="text-gray-600 mb-2">⚠️ Dirección no válida</p>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-gray-700">
            No tienes permisos para acceder a este panel. Solo administradores pueden acceder a esta sección.
          </p>
        </div>

        <p className="text-gray-500 text-sm mb-6">
          Si crees que esto es un error, por favor contacta al administrador.
        </p>

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
        >
          <Home className="w-5 h-5" />
          Volver al Dashboard
        </Link>
      </div>
    </div>
  );
}
