const multer = require('multer');
const path = require('path');

// 1. Dosyaların nereye ve hangi isimle kaydedileceği
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Daha önce oluşturduğumuz klasör
  },
  filename: (req, file, cb) => {
    // Dosya ismini çakışmaması için: tarih + orijinal isim
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// 2. Dosya Türü Kısıtlaması (Requirement 53)
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf', 
    'image/png', 
    'image/jpeg', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // XLSX
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Desteklenmeyen dosya formatı. Sadece PDF, PNG, JPG, DOCX ve XLSX yüklenebilir.'), false);
  }
};

// 3. Multer Başlatma (Requirement 55: Max 10MB)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB sınırı
});

module.exports = upload;