const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Token doğrulama middleware'i, korumalı route'lara erişmeden önce çalışır
const protect = async (req, res, next) => {
  let token;

  // Header'dan token'ı kontrol et (Bearer TOKEN formatında)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // "Bearer TOKEN" formatından token'ı ayıkla
      token = req.headers.authorization.split(' ')[1];

      // Token'ı doğrula ve decode et
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Kullanıcıyı bul ve request'e ekle (şifre hariç)
      req.user = await User.findById(decoded.id).select('-password');

      // Sonraki middleware'e veya route handler'a geç
      next();
    } catch (error) {
      console.error('Token doğrulama hatası:', error);
      res.status(401).json({ message: 'Yetkisiz erişim, token geçersiz' });
    }
  }

  // Token yoksa hata döndür
  if (!token) {
    res.status(401).json({ message: 'Yetkisiz erişim, token bulunamadı' });
  }
};

module.exports = { protect };