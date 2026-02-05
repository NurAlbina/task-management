const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware'); // Dosya yükleme middleware'i
const { protect } = require('../middleware/authMiddleware'); // Yetkilendirme middleware'i
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats
} = require('../controllers/taskController');

// TÜM ROTLARI KORUMAYA AL 
router.use(protect);

// 1. İstatistikleri getir
router.get('/stats', getTaskStats);

// 2. Tüm görevleri getir
router.get('/', getTasks);

// 3. Yeni görev ekle 
// 'files' ismi frontend'deki FormData ile aynı olmalıdır.
router.post('/', upload.array('files', 5), createTask);

// 4. Görevi güncelle (Dosya ekleme desteği ile)
router.put('/:id', upload.array('files', 5), updateTask);

// 5. Görevi sil
router.delete('/:id', deleteTask);

module.exports = router;