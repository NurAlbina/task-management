import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
//import Dashboard from "./pages/Dashboard"
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DashboardPage from './pages/Dashboard.jsx';
function App() {

  return (
    // Sayfa yönlendirmeleri yapmak için react router kullandık
    <Router>
      <Routes>
        <Route path = "/login" element = {<LoginPage/>}/>
        <Route path = "/register" element = {<RegisterPage/>}/>
       <Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  } 
/>
        <Route path = "/" element = {<Navigate to = "/login" replace/>}/> {/* Ana sayfa olarak login sayfasına yönlendirir */}
      </Routes>
    </Router>
  )
}

export default App
