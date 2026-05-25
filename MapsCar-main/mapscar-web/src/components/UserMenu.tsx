import { useState, useRef, useEffect } from 'react';
import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-700 transition-colors duration-200"
      >
        <User size={18} />
        <span className="text-sm font-medium truncate max-w-[150px]">
          {user?.username || user?.Correo || 'Usuario'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm text-gray-600">Sesión de:</p>
            <p className="font-semibold text-gray-800 truncate">{user?.username || 'Usuario'}</p>
            <p className="text-xs text-gray-500">{user?.Correo || user?.correo}</p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 flex items-center gap-2 text-red-600 hover:bg-red-50 transition-colors duration-200"
          >
            <LogOut size={18} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      )}
    </div>
  );
}
