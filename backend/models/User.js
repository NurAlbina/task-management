const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 1. Kullanıcı Veri Şablonu (Schema)
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Lütfen bir isim girin'],
  },
  email: {
    type: String,
    required: [true, 'Lütfen bir e-posta girin'],
    unique: true, // Her e-posta adresi benzersiz olmalı
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Lütfen geçerli bir e-posta adresi girin',
    ],
  },
  password: {
    type: String,
    required: [true, 'Lütfen bir şifre girin'],
    minlength: 6, // Şifre en az 6 karakter olmalı
  }
}, {
  // Otomatik olarak createdAt ve updatedAt alanları ekler
  timestamps: true 
});


// --- ARA SINAV MADDE #5: ŞİFRE ŞİFRELEME ---
// Bu fonksiyon, bir kullanıcı veritabanına "save" (kaydet) edilmeden HEMEN ÖNCE çalışır.
UserSchema.pre('save', async function (next) {
  // Eğer şifre alanı değiştirilmediyse (örn: kullanıcı adını güncelliyorsa)
  // şifreyi tekrar hash'leme ve devam et.
  if (!this.isModified('password')) {
    next();
  }

  // 1. Bir "salt" (güvenlik tuzu) oluştur. 10, güvenlik gücüdür.
  const salt = await bcrypt.genSalt(10);
  
  // 2. Kullanıcının düz şifresini bu "salt" ile HASH'le (şifrele)
  this.password = await bcrypt.hash(this.password, salt);

  
 
});
// ----------------------------------------------
 // --- ARA SINAV MADDE #4: GÜVENLİ GİRİŞ (Şifre Karşılaştırma) ---
// Modele, gelen şifre ile veritabanındaki hash'lenmiş şifreyi
// karşılaştıracak bir "method" (fonksiyon) ekliyoruz.
UserSchema.methods.matchPassword = async function (enteredPassword) {
  // bcrypt, girilen şifre ile hash'lenmiş şifreyi güvenle karşılaştırır.
  return await bcrypt.compare(enteredPassword, this.password);
};

// 3. Bu şablonu bir "Model" olarak dışa aktar
// Modelin adı 'User', MongoDB'deki koleksiyon adı 'users' olacaktır.
module.exports = mongoose.model('User', UserSchema);