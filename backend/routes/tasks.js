const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask
} = require('../controllers/taskController');
const express = require('express');
const upload = require('../middleware/uploadMiddleware'); // Yeni oluşturduğun middleware
const { protect } = require('../middleware/authMiddleware');
const { createTask, updateTask } = require('../controllers/taskController');
// Tüm route'lar token gerektirir (protect middleware)
router.use(protect);

// Kullanıcının görevlerini listele
router.get('/', getTasks);

// Yeni görev ekle
router.post('/', createTask);

// Görevi güncelle
router.put('/:id', updateTask);

// Görevi sil
router.delete('/:id', deleteTask);
// Görev oluştururken dosya yükleme (max 5 dosya)
router.post('/', protect, upload.array('files', 5), createTask);

// Görev güncellerken yeni dosya ekleme
router.put('/:id', protect, upload.array('files', 5), updateTask);

module.exports = router;