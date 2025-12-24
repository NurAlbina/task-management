// Gerekli kütüphaneleri içeri aktar 
const dotenv = require('dotenv');
// .env dosyasındaki gizli bilgilere erişmek için
dotenv.config();


const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks'); 
const adminRoutes = require('./routes/admin');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');



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

// Frontend'den gelen isteklere izin ver
app.use(cors());
// Gelen JSON formatındaki verileri parse et
app.use(express.json());

// Test için bir ana rota 
// Tarayıcıda http://localhost:5000/ adresine girince görünecek
app.get('/', (req, res) => {
  res.send('API çalışıyor...');
});

// /api/auth ile başlayan TÜM istekleri 'authRoutes' dosyasına yönlendir
app.use('/api/auth', authRoutes);

// /api/tasks ile başlayan tüm istekleri 'taskRoutes' dosyasına yönlendir
app.use('/api/tasks', taskRoutes);

// /api/admin ile başlayan istekleri adminRoutes'a yönlendir
app.use('/api/admin', adminRoutes);

app.use('/uploads', express.static(path.join(__dirname, '/uploads')));


// Sunucuyu dinlemeye başla
const PORT = process.env.PORT || 5000;

// Sadece bu dosya doğrudan çalıştırılıyorsa sunucuyu başlat
// Testler import ettiğinde sunucuyu başlatmayacak
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda başarıyla başlatıldı.`);
  });
}

// app'i dışarı aktar ki test dosyası kullanabilsin
module.exports = app;