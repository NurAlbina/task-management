const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getAllTasks,
  getAllUsers,
  assignTask,
  deleteAnyTask,
  getAdminStats,
  createTaskForUser,
  updateAnyTask  
} = require('../controllers/taskController');

// Tüm admin route'ları koruma altında
router.use(protect);
router.use(admin);

// İstatistikler
router.get('/stats', getAdminStats);

// Tüm görevler
router.get('/tasks', getAllTasks);

// Tüm kullanıcılar
router.get('/users', getAllUsers);

// Görev ata
router.put('/assign', assignTask);

// Herhangi bir görevi güncelle 
router.put('/tasks/:id', updateAnyTask);

// Görev sil
router.delete('/tasks/:id', deleteAnyTask);

// Admin için görev oluştur 
router.post('/tasks', createTaskForUser);

module.exports = router;