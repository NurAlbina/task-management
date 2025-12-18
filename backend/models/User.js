const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Kullanıcı Veri Şablonu
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
  },
  role: {
    type: String,
    enum: ['user', 'admin'], // Sadece bu iki rol kabul edilir 
    default: 'user' // Yeni kayıt olan herkes standart kullanıcıdır
  }
}, {
  // Otomatik olarak createdAt ve updatedAt alanları ekler
  timestamps: true 
});

// Bu fonksiyon, bir kullanıcı veritabanına kaydedilmeden hemen önce çalışır
UserSchema.pre('save', async function (next) {
  // Eğer şifre alanı değiştirilmediyse (örn: kullanıcı adını güncelliyorsa)
  // şifreyi tekrar hash'leme ve devam et.
  if (!this.isModified('password')) {
    next();
  }

  // 10 gücünde bir salt (tuz) oluştur
  const salt = await bcrypt.genSalt(10);
  
  // Kullanıcının düz şifresini bu salt ile hash'le
  this.password = await bcrypt.hash(this.password, salt);

  
 
});

// Modele, gelen şifre ile veritabanındaki hash'lenmiş şifreyi karşılaştırma yeteneği eklendi
UserSchema.methods.matchPassword = async function (enteredPassword) {
  // bcrypt, girilen şifre ile hash'lenmiş şifreyi karşılaştırır
  return await bcrypt.compare(enteredPassword, this.password);
};

// Bu modeli bir şablon olarak dışa aktar
module.exports = mongoose.model('User', UserSchema);