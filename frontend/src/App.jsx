import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DashboardPage from './pages/Dashboard.jsx';
import TaskFormPage from './pages/TaskFormPage.jsx';
import StatisticsPage from './pages/StatisticsPage.jsx';
import AdminPanel from './pages/AdminPanel';
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
        
        <Route path="/add-task" element={<TaskFormPage />} />
        <Route path="/edit-task/:id" element={<ProtectedRoute><TaskFormPage /></ProtectedRoute>} />
        <Route path="/statistics" element={<ProtectedRoute><StatisticsPage /></ProtectedRoute>} />
        <Route path="/admin-panel" element={<AdminPanel />} />
        {/* Ana sayfa, login sayfasına yönlendirir */}
        <Route path="/" element={<Navigate to="/login" replace/>}/>
      </Routes>
    </Router>
  )
}

export default App
