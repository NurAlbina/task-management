const express = require('express');
const router = express.Router();

// 1. Yeni oluşturduğumuz adminController'ı çağırıyoruz
const adminController = require('../controllers/adminController'); 
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // Dosya yükleme aracı

// --- İstatistikler ---
router.get('/stats', protect, admin, adminController.getStats);

// --- Tüm Görevleri Getir ---
router.get('/tasks', protect, admin, adminController.getAllTasks);

// --- Tüm Kullanıcıları Getir ---
router.get('/users', protect, admin, adminController.getAllUsers);

// upload.array('files') middleware'i, frontend'den gelen dosyaları yakalar
router.post('/tasks', protect, admin, upload.array('files', 5), adminController.createTask);

// --- GÖREV GÜNCELLEME (Dosya Destekli) ---
router.put('/tasks/:id', protect, admin, upload.array('files', 5), adminController.updateTask);

// --- Görev Silme ---
router.delete('/tasks/:id', protect, admin, adminController.deleteTask);

// --- Görev Atama ---
router.put('/assign', protect, admin, adminController.assignTask);

module.exports = router;