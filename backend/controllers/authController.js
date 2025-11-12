const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Kullanıcı ID'sini alır ve .env'deki gizli anahtarla imzalar
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Token 30 gün geçerli olsun
  });
};

// Kullanıcı kayıt işlemi
exports.registerUser = async (req, res) => {
  // Kullanıcıdan bilgileri al
  const { name, email, password } = req.body;

  try {
    // Kullanıcı veritabanında var mı diye kontrol et
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanılıyor' });
    }

    // Yeni kullanıcıyı oluştur
    // Şifre, User.js'teki .pre('save') kancası sayesinde otomatik olarak hash'lenir
    const user = await User.create({
      name,
      email,
      password,
    });

    // Kullanıcı başarıyla oluşturulduysa, ona bir token ver ve cevap döndür
    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id), // Token oluşturuldu
      });
    } else {
      res.status(400).json({ message: 'Geçersiz kullanıcı verisi' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};


// Kullanıcı giriş işlemi
exports.loginUser = async (req, res) => {
  // E-posta ve şifreyi al
  const { email, password } = req.body;

  try {
    // Kullanıcıyı e-postaya göre bul
    const user = await User.findOne({ email });

    // Kullanıcı bulunduysa ve şifre eşleşiyorsa
    if (user && (await user.matchPassword(password))) {
      // Giriş başarılı: Token oluştur ve döndür
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      // Hata durumu: Geçersiz e-posta veya şifre
      res.status(401).json({ message: 'Geçersiz e-posta veya şifre' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};