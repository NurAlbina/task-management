import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Lottie from "lottie-react";
import loginAnimation from "../assets/pandaSleeping.json";
import { Mail, Lock } from "lucide-react";

const LoginPage = () => {
  // Kullanıcı giriş bilgileri için state değişkenleri
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // Hata mesajlarını saklamak için
  const [loading, setLoading] = useState(false); // Yükleme durumunu kontrol etmek için
  const navigate = useNavigate(); // Sayfa yönlendirmesi için

  // Form submit edildiğinde çalışan fonksiyon
  const handleLogin = async (e) => {
    e.preventDefault(); // Sayfanın yenilenmesini engeller
    setError(""); // Önceki hataları temizle
    setLoading(true); // Yükleme durumunu aktif et

    try {
      console.log("Attempting login with:", { email, password });
      // Backend'e login isteği gönder
      const response = await axios.post("/api/auth/login", { email, password });
      console.log("Login successful:", response.data);

      // Başarılı girişte JWT token'ı localStorage'a kaydet
      localStorage.setItem("token", response.data.token);

      // Dashboard'a yönlendir
      navigate("/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
      // Hata durumunda kullanıcıya mesaj göster
      setError(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false); // Yükleme durumunu kapat
    }
  };

  return (
    <div       
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-fixed"
      style={{ backgroundImage: "url('/minimal-hd-landscape_1920x1080.jpg')" }} 
    >
      {/* Ana form container */}
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Login</h2>

        {/* Hata mesajı gösterme alanı */}
        {error && (
          <div className="bg-red-600 text-white p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        {/* Login formu */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email input alanı */}
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
            {/* Email ikonu */}
            <Mail className="absolute right-3 top-1/2 transform text-gray-400" size={20} />
          </div>
          
          {/* Password input alanı */}
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
            {/* Şifre ikonu */}
            <Lock className="absolute right-3 top-1/2 transform text-gray-400" size={20} />
          </div>
          
          {/* Submit butonu */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white font-semibold py-2 rounded-lg transition duration-200"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Kayıt sayfasına yönlendirme linki */}
        <p className="text-gray-800 text-center mt-4">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-200 hover:text-blue-300">
            Register
          </Link>
        </p>
      </div>
      
      {/* Lottie animasyonu */}
      <Lottie
        animationData={loginAnimation}
        loop={true}
        className="w-48 h-48 absolute bottom-4 right-4 opacity-90"
      />
    </div>
  );
};

export default LoginPage;