// frontend/src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  // 1. Tarayıcı hafızasından 'token'ı kontrol et
  const token = localStorage.getItem('token');

  // 2. Eğer token VARSA:
  if (token) {
    return children; // Dashboard'u (veya children'ı) göster
  }

  // 3. Eğer token YOKSA:
  // Kullanıcıyı zorla /login sayfasına geri yönlendir
  return <Navigate to="/login" replace />;
}

export default ProtectedRoute;