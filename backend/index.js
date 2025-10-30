// 1. Gerekli kütüphaneleri içeri aktar (import)
const authRoutes = require('./routes/auth');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');



// 2. .env dosyasındaki gizli bilgilere erişmek için
dotenv.config();

// 3. Veritabanına bağlanacak fonksiyon
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB veritabanına başarıyla bağlanıldı.');
  } catch (err) {
    console.error('Veritabanı bağlantı hatası:', err.message);
    // Hata olursa programı sonlandır
    process.exit(1);
  }
};

// 4. Veritabanına bağlanmayı dene
connectDB();

// 5. Express sunucusunu başlat
const app = express();

// 6. Gerekli ara yazılımları (middleware) kullan
// Frontend'den (React) gelen isteklere izin ver
app.use(cors());
// Gelen JSON formatındaki verileri (body) parse et
app.use(express.json());

// 7. Test için bir ana rota (endpoint)
// Tarayıcıda http://localhost:5000/ adresine girince görünecek
app.get('/', (req, res) => {
  res.send('API çalışıyor...');
});
// --- API Rotaları ---
// /api/auth ile başlayan TÜM istekleri 'authRoutes' dosyasına yönlendir
app.use('/api/auth', authRoutes);


// 8. Sunucuyu dinlemeye başla
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda başarıyla başlatıldı.`);
});