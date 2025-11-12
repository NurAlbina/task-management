import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DashboardPage from './pages/Dashboard.jsx';

function App() {

  return (
    // Sayfa yönlendirmeleri yapmak için react router kullandık
    <Router>
      <Routes>
        {/* Login sayfası route'u */}
        <Route path="/login" element={<LoginPage/>}/>
        
        {/* Kayıt sayfası route'u */}
        <Route path="/register" element={<RegisterPage/>}/>
        
        {/* Korumalı dashboard route'u, sadece giriş yapan kullanıcılar erişebilir */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Ana sayfa, login sayfasına yönlendirir */}
        <Route path="/" element={<Navigate to="/login" replace/>}/>
      </Routes>
    </Router>
  )
}

export default App
