const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Token oluştur 
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      name: user.name,
      role: user.role 
    }, 
    process.env.JWT_SECRET, 
    { expiresIn: '30d' }
  );
};

// Kullanıcı kayıt işlemi 
exports.registerUser = async (req, res) => {
  const { name, email, password, role } = req.body; // Rolü body'den alabiliriz (Test için kolaylık)

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanılıyor' });
    }

    // Yeni kullanıcıyı oluştur (Şifre User modelinde otomatik hashlenir) 
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user' // Eğer rol belirtilmemişse varsayılan 'user' olur 
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role, // Frontend yönlendirmesi için kritik 
        token: generateToken(user),
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
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    // matchPassword metodu ile şifre kontrolü
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role, // Frontend'deki navigate mantığı için gerekli 
        token: generateToken(user),
      });
    } else {
      res.status(401).json({ message: 'Geçersiz e-posta veya şifre' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};