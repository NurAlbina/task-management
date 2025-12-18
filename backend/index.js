const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks'); 
const adminRoutes = require('./routes/admin');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');


// .env dosyasındaki gizli bilgilere erişmek için
dotenv.config();

// Veritabanına bağlanacak fonksiyon
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

// Veritabanına bağlanmayı dene
connectDB();

// Express sunucusunu başlat
const app = express();

// CORS ayarları, frontend'den gelen istekleri kabul et
app.use(cors());
// Gelen JSON formatındaki istekleri işleyebilmek için
app.use(express.json());

// Test için bir endpoint (/localhost:5000/)
app.get('/', (req, res) => {
  res.send('API çalışıyor...');
});

// /api/auth ile başlayan tüm istekleri 'authRoutes' dosyasına yönlendir
app.use('/api/auth', authRoutes);

// /api/tasks ile başlayan tüm istekleri 'taskRoutes' dosyasına yönlendir
app.use('/api/tasks', taskRoutes);

// /api/admin ile başlayan istekleri adminRoutes'a yönlendir
app.use('/api/admin', adminRoutes);

app.use('/uploads', express.static(path.join(__dirname, '/uploads')));
// Sunucuyu dinlemeye başla
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda başarıyla başlatıldı.`);
});