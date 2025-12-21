// 1. Gerekli kütüphaneleri içeri aktar (import)
const dotenv = require('dotenv');
// 2. .env dosyasındaki gizli bilgilere erişmek için
dotenv.config();


const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks'); 
const adminRoutes = require('./routes/admin');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');



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

// /api/tasks ile başlayan tüm istekleri 'taskRoutes' dosyasına yönlendir
app.use('/api/tasks', taskRoutes);

// /api/admin ile başlayan istekleri adminRoutes'a yönlendir
app.use('/api/admin', adminRoutes);

app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// 8. Sunucuyu dinlemeye başla
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda başarıyla başlatıldı.`);
});