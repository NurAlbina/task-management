import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem('token');

  // 1. Hiç token yoksa direkt login'e at
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    // 2. Token içindeki veriyi (payload) çözüyoruz
    // Token üç parçadır: header.payload.signature. Biz orta kısmı (1. index) alıyoruz.
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));

    // 3. Eğer bu sayfa "Sadece Admin" istiyorsa ve kullanıcı admin değilse:
    if (adminOnly && payload.role !== 'admin') {
      console.warn("Yetkisiz erişim denemesi: Admin alanı!");
      return <Navigate to="/dashboard" replace />; // Normal dashboard'a geri yolla
    }

    // 4. Her şey yolundaysa sayfayı göster
    return children;
    
  } catch (error) {
    // Token bozuksa veya çözülemiyorsa login'e yolla
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }
}

export default ProtectedRoute;