const multer = require('multer');
const s3 = require('../config/s3Config'); // S3 konfigürasyonunu içeri aktar
const multerS3 = require('multer-s3');
const path = require('path');

// Desteklenen dosya türleri
const allowedMimeTypes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // xlsx
];

// S3 Depolama Ayarı 
const s3Storage = multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
    metadata: function (req, file, cb) {
        cb(null, { 
            fieldName: file.fieldname,
            userId: req.user.id // Kullanıcı kimliğini meta veriye ekle
        });
    },
    key: function (req, file, cb) {
        // S3 içinde benzersiz bir dosya adı (anahtar) oluştur
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileName = `attachments/${req.user.id}/${uniqueSuffix}${path.extname(file.originalname)}`;
        cb(null, fileName);
    }
});

// Dosya filtresi 
const fileFilter = (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new Error('Desteklenmeyen dosya türü.'), false);
    }
    cb(null, true);
};

// Multer konfigürasyonu
const upload = multer({
    storage: s3Storage, // s3Storage kullanılıyor
    fileFilter: fileFilter,
    limits: { 
        fileSize: 10 * 1024 * 1024 // Maksimum dosya boyutu: 10 MB 
    }
});

module.exports = upload;