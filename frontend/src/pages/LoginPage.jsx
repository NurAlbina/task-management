import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Lottie from "lottie-react";
import loginAnimation from "../assets/pandaSleeping.json";
import { Mail, Lock } from "lucide-react";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); 
  const [loading, setLoading] = useState(false); 
  const navigate = useNavigate(); 

  const handleLogin = async (e) => {
    e.preventDefault(); 
    setError(""); 
    setLoading(true); 

    try {
      // Backend'e login isteği gönder
      const response = await axios.post("/api/auth/login", { email, password });
      
      // Başarılı girişte JWT token'ı localStorage'a kaydet
      localStorage.setItem("token", response.data.token);

      // --- ROL BAZLI YÖNLENDİRME (Requirement 8.2) ---
      // Backend'den dönen rol bilgisini kontrol ediyoruz [cite: 70, 78]
      const userRole = response.data.role;

      if (userRole === "admin") {
        // Kullanıcı admin ise Admin Paneline yönlendir 
        navigate("/admin-panel");
      } else {
        // Normal kullanıcı ise standart Dashboard'a yönlendir [cite: 72]
        navigate("/dashboard");
      }
      
    } catch (error) {
      setError(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div       
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-fixed"
      style={{ backgroundImage: "url('/minimal-hd-landscape_1920x1080.jpg')" }} 
    >
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Login</h2>

        {error && (
          <div className="bg-red-600 text-white p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <label className="block text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            />
            <Mail className="absolute right-3 top-1/2 transform text-gray-400" size={20} />
          </div>
          
          <div className="relative">
            <label className="block text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            />
            <Lock className="absolute right-3 top-1/2 transform text-gray-400" size={20} />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white font-semibold py-2 rounded-lg transition duration-200"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-gray-200 text-center mt-4">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-300 hover:text-blue-400 font-bold">
            Register
          </Link>
        </p>
      </div>
      
      <Lottie
        animationData={loginAnimation}
        loop={true}
        className="w-48 h-48 absolute bottom-4 right-4 opacity-90"
      />
    </div>
  );
};

export default LoginPage;