const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Giriş yapmış her kullanıcı için koruma
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Veritabanından kullanıcıyı çekiyoruz (Rolü de otomatik gelir) 
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error('Token doğrulama hatası:', error);
      res.status(401).json({ message: 'Yetkisiz erişim, token geçersiz' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Yetkisiz erişim, token bulunamadı' });
  }
};

// Sadece Adminler için koruma 
const admin = (req, res, next) => {
  // Kullanıcı varsa VE rolü 'admin' ise geçişe izin ver
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    // Admin değilse 403 (Forbidden) hatası döndür
    res.status(403).json({ message: 'Erişim reddedildi: Bu alan sadece Admin yetkisine sahip kullanıcılara özeldir.' });
  }
};

module.exports = { protect, admin };