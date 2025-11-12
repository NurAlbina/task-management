import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Lottie from "lottie-react";
import loginAnimation from "../assets/pandaSleeping.json";


const RegisterPage = () => {
  // Kayıt formu için state değişkenleri
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Kayıt formu submit edildiğinde çalışan fonksiyon
  const handleRegister = async (e) => {
    e.preventDefault(); // Sayfanın yenilenmesini engeller
    setError(''); // Önceki hataları temizle
    setLoading(true); // Yükleme durumunu aktif et
    
    try {
      console.log('Attempting register with:', { name, email, password });
      // Backend'e kayıt isteği gönder
      const response = await axios.post('/api/auth/register', { name, email, password });
      console.log('Register successful:', response.data);
      
      // Başarılı kayıtta JWT token'ı localStorage'a kaydet
      localStorage.setItem('token', response.data.token);
      
      // Dashboard'a yönlendir
      navigate('/dashboard');
    } catch (error) {
      console.error('Register failed:', error);
      // Hata durumunda kullanıcıya mesaj göster
      setError(error.response?.data?.message || 'Registration failed');
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
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Register</h2>
        
        {/* Hata mesajı gösterme alanı */}
        {error && (
          <div className="bg-red-600 text-white p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        {/* Kayıt formu */}
        <form onSubmit={handleRegister} className="space-y-4">
          {/* İsim input alanı */}
          <div>
            <label className="block text-gray-300 mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading} // Yükleme sırasında input'u deaktif et
            />
          </div>
          
          {/* Email input alanı */}
          <div>
            <label className="block text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading} // Yükleme sırasında input'u deaktif et
            />
          </div>
          
          {/* Şifre input alanı */}
          <div>
            <label className="block text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading} // Yükleme sırasında input'u deaktif et
            />
          </div>
          
          {/* Submit butonu */}
          <button
            type="submit"
            disabled={loading} // Yükleme sırasında butonu deaktif et
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white font-semibold py-2 rounded-lg transition duration-200"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>
        
        {/* Login sayfasına yönlendirme linki */}
        <p className="text-gray-800 text-center mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300">
            Login
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

export default RegisterPage;