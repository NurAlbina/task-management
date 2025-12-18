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
    fileName: { type: String, required: true }, // [cite: 62]
    fileUrl: { type: String, required: true },  // [cite: 63]
    fileSize: { type: Number, required: true }, // [cite: 65]
    uploadDate: { type: Date, default: Date.now }, // [cite: 66]
    uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // [cite: 68]
  }]
}, { 
  timestamps: true // createdAt ve updatedAt otomatik eklenir
});

module.exports = mongoose.model('Task', TaskSchema);