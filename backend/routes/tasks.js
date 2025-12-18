const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware'); // Dosya yükleme middleware'i
const { protect } = require('../middleware/authMiddleware'); // Yetkilendirme middleware'i
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask
} = require('../controllers/taskController');

// --- TÜM ROTLARI KORUMAYA AL (Requirement 8.2) ---
router.use(protect);

// 1. Tüm görevleri getir
router.get('/', getTasks);

// 2. Yeni görev ekle (Requirement 8.1: Çoklu dosya desteği - max 5)
// 'files' ismi frontend'deki FormData ile aynı olmalıdır.
router.post('/', upload.array('files', 5), createTask);

// 3. Görevi güncelle (Dosya ekleme desteği ile)
router.put('/:id', upload.array('files', 5), updateTask);

// 4. Görevi sil
router.delete('/:id', deleteTask);

module.exports = router;