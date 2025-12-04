const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask
} = require('../controllers/taskController');

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

module.exports = router;