const Task = require('../models/Task');

// Tüm görevleri getir (sadece giriş yapan kullanıcının görevleri)
exports.getTasks = async (req, res) => {
  try {
    // Kullanıcının kendi görevlerini bul, en yeniler üstte
    const tasks = await Task.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    console.error('Görevler getirilirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

/// Yeni görev oluştur (Dosya desteği ile - Requirement 8.1)
exports.createTask = async (req, res) => {
  try {
    const { title, description, category, dueDate, dueTime } = req.body;

    // 1. Multer tarafından yüklenen dosyaları al ve formatla
    // Eğer dosya yüklenmediyse boş bir dizi döner
    const attachments = req.files ? req.files.map(file => ({
      fileName: file.originalname,           // Orijinal dosya adı
      fileUrl: `/uploads/${file.filename}`,  // Dosyaya erişim yolu
      fileSize: file.size,                   // Dosya boyutu (bytes)
      uploadDate: new Date()                 // Yükleme tarihi
    })) : [];

    // 2. Yeni görevi veritabanına kaydet
    const task = await Task.create({
      title,
      description,
      category,
      dueDate,
      dueTime,
      userId: req.user._id,
      attachments: attachments // Dosya bilgilerini buraya ekliyoruz
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Görev oluşturulurken hata:', error);
    res.status(400).json({ message: 'Geçersiz görev verisi', error: error.message });
  }
};

// Görevi güncelle
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    // Görev var mı kontrol et
    if (!task) {
      return res.status(404).json({ message: 'Görev bulunamadı' });
    }

    // Görev bu kullanıcıya mı ait kontrol et
    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Bu göreve erişim yetkiniz yok' });
    }

    // Görevi güncelle ve güncel halini döndür
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } // Güncellenmiş veriyi döndür
    );

    res.json(updatedTask);
  } catch (error) {
    console.error('Görev güncellenirken hata:', error);
    res.status(400).json({ message: 'Güncelleme başarısız', error: error.message });
  }
};

// Görevi sil
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    // Görev var mı kontrol et
    if (!task) {
      return res.status(404).json({ message: 'Görev bulunamadı' });
    }

    // Görev bu kullanıcıya mı ait kontrol et
    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Bu görevi silme yetkiniz yok' });
    }

    // Görevi sil
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Görev başarıyla silindi' });
  } catch (error) {
    console.error('Görev silinirken hata:', error);
    res.status(500).json({ message: 'Silme işlemi başarısız', error: error.message });
  }
};