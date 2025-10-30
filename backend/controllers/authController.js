const User = require('../models/User');
const jwt = require('jsonwebtoken');

// --- Özel bir fonksiyon: JWT (Token) oluşturur ---
// Kullanıcı ID'sini alır ve .env'deki gizli anahtarla imzalar
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Token 30 gün geçerli olsun
  });
};


// --- ARA SINAV MADDE #3: KULLANICI KAYDI ---
exports.registerUser = async (req, res) => {
  // 1. Kullanıcıdan bilgileri al
  const { name, email, password } = req.body;

  try {
    // 2. Kullanıcı veritabanında var mı diye kontrol et
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanılıyor' });
    }

    // 3. Yeni kullanıcıyı oluştur
    // Not: Şifre, User.js'teki .pre('save') kancası sayesinde OTOMATİK olarak hash'lenecek!
    const user = await User.create({
      name,
      email,
      password,
    });

    // 4. Kullanıcı başarıyla oluşturulduysa, ona bir token ver ve cevap döndür
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


// --- ARA SINAV MADDE #4: GÜVENLİ KULLANICI GİRİŞİ ---
exports.loginUser = async (req, res) => {
  // 1. E-posta ve şifreyi al
  const { email, password } = req.body;

  try {
    // 2. Kullanıcıyı e-postaya göre bul
    const user = await User.findOne({ email });

    // 3. (GÜVENLİ TEST 1): Kullanıcı yoksa VEYA
    // 4. (GÜVENLİ TEST 2): Şifreler uyuşmuyorsa (User.js'te eklediğimiz fonksiyonu kullanıyoruz)
    if (user && (await user.matchPassword(password))) {
      // 5. Giriş başarılı: Token oluştur ve döndür
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      // (GÜVENLİ TEST 1 ve 2'nin hata durumu)
      res.status(401).json({ message: 'Geçersiz e-posta veya şifre' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};