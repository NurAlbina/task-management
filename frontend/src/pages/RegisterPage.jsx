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

  // Email validasyonu - sadece bilinen email sağlayıcıları kabul et
  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    // Sadece bilinen/güvenilir email sağlayıcıları
    const validDomains = [
      'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 
      'icloud.com', 'protonmail.com', 'yandex.com', 'mail.com',
      // Türk domainleri
      'edu.tr', 'gov.tr', 'com.tr', 'org.tr',
      // Üniversite domainleri (genel)
      '.edu', '.ac.uk'
    ];
    
    if (!emailRegex.test(email)) return false;
    
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;
    
    // Domain bilinen listede mi veya .edu/.gov içeriyor mu kontrol et
    const isValidDomain = validDomains.some(valid => 
      domain === valid || domain.endsWith('.' + valid) || domain.endsWith(valid)
    );
    
    return isValidDomain;
  };

  // Şifre güçlülük kontrolü
  const checkPasswordStrength = (password) => {
    return {
      minLength: password.length >= 6,
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
  };

  // Şifre gereksinimlerini kontrol et
  const passwordChecks = checkPasswordStrength(password);
  const isPasswordValid = Object.values(passwordChecks).every(Boolean);
  const isEmailValid = email === '' || validateEmail(email);

  // Kayıt formu submit edildiğinde çalışan fonksiyon
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Email kontrolü
    if (!validateEmail(email)) {
      setError('Lütfen geçerli bir email adresi girin (örn: ad@gmail.com)');
      return;
    }

    // Şifre kontrolü
    if (!isPasswordValid) {
      setError('Şifre tüm gereksinimleri karşılamıyor');
      return;
    }

    setLoading(true);
    
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
              className={`w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 ${
                email && !isEmailValid ? 'ring-2 ring-red-500' : 'focus:ring-blue-500'
              }`}
              required
              disabled={loading} // Yükleme sırasında input'u deaktif et
            />
            {/* Email uyarısı */}
            {email && !isEmailValid && (
              <p className="text-red-500 text-sm mt-1">
                ⚠️ Geçerli bir email adresi girin (örn: ad@gmail.com)
              </p>
            )}
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
            
            {/* Şifre gereksinimleri göstergesi */}
            {password && (
              <div className="mt-2 p-3 bg-gray-800/50 rounded-lg">
                <p className="text-gray-300 text-sm mb-2">Şifre Gereksinimleri:</p>
                <ul className="space-y-1 text-sm">
                  <li className={passwordChecks.minLength ? 'text-green-400' : 'text-red-400'}>
                    {passwordChecks.minLength ? '✅' : '❌'} En az 6 karakter
                  </li>
                  <li className={passwordChecks.hasUppercase ? 'text-green-400' : 'text-red-400'}>
                    {passwordChecks.hasUppercase ? '✅' : '❌'} En az 1 büyük harf
                  </li>
                  <li className={passwordChecks.hasNumber ? 'text-green-400' : 'text-red-400'}>
                    {passwordChecks.hasNumber ? '✅' : '❌'} En az 1 rakam
                  </li>
                  <li className={passwordChecks.hasSpecial ? 'text-green-400' : 'text-red-400'}>
                    {passwordChecks.hasSpecial ? '✅' : '❌'} En az 1 özel karakter (!@#$%^&*)
                  </li>
                </ul>
              </div>
            )}
          </div>
          
          {/* Submit butonu */}
          <button
            type="submit"
            disabled={loading || !isPasswordValid || !isEmailValid} // Yükleme sırasında ve geçersiz input'larda butonu deaktif et
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition duration-200"
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