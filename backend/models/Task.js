const mongoose = require('mongoose');

// Görev veri şablonu
const TaskSchema = new mongoose.Schema({
  // Görev başlığı
  title: {
    type: String,
    required: [true, 'Görev başlığı gerekli']
  },
  // Görev açıklaması
  description: {
    type: String
  },
  // Görev kategorisi
  category: {
    type: String,
    required: [true, 'Kategori gerekli'],
    enum: ['Work', 'Personal', 'Shopping', 'Health', 'Other']
  },
  // Görev durumu
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  // Bitiş tarihi
  dueDate: {
    type: Date
  },
  // Bitiş saati
  dueTime: {
    type: String
  },
  // Görevi oluşturan kullanıcı (User modeline referans)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
attachments: [{
    fileName: { type: String, required: true }, // Orijinal Dosya Adı
    fileUrl: { type: String, required: true },  //  Erişim URL'si
    fileKey: { type: String, required: true },  //  S3'ten silmek için GEREKLİ (Storage Path)
    fileSize: { type: Number, required: true }, // Dosya Boyutu
    uploadDate: { type: Date, default: Date.now }, // Yükleme Tarihi
    uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Yükleyen Kullanıcı
  }]
}, { 
  timestamps: true // createdAt ve updatedAt otomatik eklenir
});

module.exports = mongoose.model('Task', TaskSchema);