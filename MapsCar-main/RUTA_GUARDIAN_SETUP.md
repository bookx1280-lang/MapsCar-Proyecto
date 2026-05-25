# Componente Guardián de Rutas - MapsCar

## ¿Qué es?

Un sistema completo de protección de rutas que previene el acceso a páginas protegidas sin autenticación. Ahora tu aplicación valida que el usuario esté logueado antes de permitir acceso a:

- `/vehicle-setup` - Configuración de vehículo
- `/dashboard` - Panel principal del usuario
- `/admin` - Panel de administrador

## Archivos Creados

### 1. `src/contexts/AuthContext.tsx`
Contexto global que maneja:
- Estado de autenticación (`isAuthenticated`)
- Rol del usuario (`isAdmin`)
- Datos del usuario (`user`)
- Funciones de `logout()` y `checkAuth()`

### 2. `src/components/ProtectedRoute.tsx`
Componente que envuelve las rutas y:
- Verifica si existe token en `localStorage`
- Redirige a `/login` si no está autenticado
- Redirige a `/unauthorized` si no tiene permisos (admin)
- Muestra pantalla de carga mientras verifica

### 3. `src/pages/UnauthorizedPage.tsx`
Página que se muestra cuando:
- Usuario intenta acceder a `/admin` sin ser admin
- Usuario intenta acceder a una ruta sin permiso

### 4. `src/components/UserMenu.tsx`
Componente de menú de usuario que muestra:
- Usuario actual
- Email del usuario
- Botón de cerrar sesión

## Modificaciones a Archivos Existentes

### `src/main.tsx`
Se agregó `AuthProvider` para envolver la aplicación:
```tsx
<AuthProvider>
  <App />
</AuthProvider>
```

### `src/App.tsx`
Se actualizaron las rutas para usar `ProtectedRoute`:
```tsx
<Route
  path="/vehicle-setup"
  element={<ProtectedRoute element={<VehicleSetupPage />} requiredRole="user" />}
/>
```

## Cómo Usar

### En Componentes - Hook `useAuth()`

```tsx
import { useAuth } from '../contexts/AuthContext';

export function MiComponente() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();

  if (!isAuthenticated) {
    return <p>No autenticado</p>;
  }

  return (
    <div>
      <p>Hola {user.username}</p>
      {isAdmin && <p>Eres administrador</p>}
      <button onClick={logout}>Cerrar sesión</button>
    </div>
  );
}
```

### Agregar UserMenu al Header/Layout

```tsx
import { UserMenu } from '../components/UserMenu';

export function Header() {
  return (
    <header>
      <h1>MapsCar</h1>
      <UserMenu /> {/* Muestra usuario y botón de logout */}
    </header>
  );
}
```

### Crear Nuevas Rutas Protegidas

```tsx
// Solo para usuarios logueados
<Route
  path="/nueva-ruta"
  element={<ProtectedRoute element={<MiPagina />} requiredRole="user" />}
/>

// Solo para admins
<Route
  path="/admin/configuracion"
  element={<ProtectedRoute element={<AdminConfig />} requiredRole="admin" />}
/>
```

## Flujo de Protección

```
Usuario navega a /vehicle-setup
         ↓
¿Existe token en localStorage?
    ↙         ↘
   NO         SÍ
   ↓          ↓
Redirige   ¿Es admin solo?
a /login       ↙   ↘
             NO    SÍ (admin)
             ↓     ↓
         Muestra  ¿Tiene rol admin?
         página    ↙       ↘
               SÍ         NO
               ↓          ↓
          Muestra    Redirige a
          página    /unauthorized
```

## Mejoras de Seguridad

✅ **Autenticación requerida**: No se puede acceder sin login
✅ **Validación de roles**: Admins no pueden ser suplantados
✅ **Control de acceso**: Rutas protegidas por tipo de usuario
✅ **Logout seguro**: Limpia todo el localStorage
✅ **Mensaje amigable**: Usuario entiende por qué no puede acceder
✅ **Redirección automática**: Redirige a login si pierde sesión

## Próximos Pasos (Opcional)

1. **Agregar refresh de token**: Para mantener sesión activa
2. **Validar token en backend**: Al recargar la página
3. **Agregar timeout de sesión**: Logout automático tras inactividad
4. **Proteger API calls**: Verificar token en cada petición

## Preguntas Frecuentes

**¿Qué pasa si borro el token manualmente del localStorage?**
- Se redirige automáticamente a login

**¿Puedo ver cómo está protegida una ruta?**
- Revisa `App.tsx` líneas donde está `ProtectedRoute`

**¿Cómo agrego permisos más granulares?**
- Extiende `requiredRole` a otros valores (ej: 'moderator')

---

¡Tu aplicación está segura! 🔒
