import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  // Tarayıcı hafızasından 'token'ı kontrol et
  const token = localStorage.getItem('token');

  // Eğer token varsa dashboard sayfasını veya children'ı göster
  if (token) {
    return children;
  }

  // Eğer token yoksa kullanıcıyı login sayfasına yönlendir
  return <Navigate to="/login" replace />;
}

export default ProtectedRoute;