const Task = require('../models/Task');
const User = require('../models/User');
const fs = require('fs'); // Dosya silmek için gerekli
const path = require('path');
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

// Görevi güncelle (Dosya yönetimi dahil - Requirement 8.1)
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Görev bulunamadı' });
    }

    // Yetki kontrolü
    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Bu göreve erişim yetkiniz yok' });
    }

    // 1. SİLİNECEK DOSYALARI YÖNET (Arayüzden "Sil"e basılan dosyalar)
    if (req.body.deletedFiles) {
      const filesToDelete = JSON.parse(req.body.deletedFiles); // Frontend'den gelen liste
      
      filesToDelete.forEach(fileUrl => {
        // Fiziksel dosyayı sunucudan (uploads klasöründen) sil
        const filePath = path.join(__dirname, '..', fileUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        // Veritabanındaki diziden çıkar
        task.attachments = task.attachments.filter(att => att.fileUrl !== fileUrl);
      });
    }

    // 2. YENİ DOSYALARI EKLE
    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map(file => ({
        fileName: file.originalname,
        fileUrl: `/uploads/${file.filename}`,
        fileSize: file.size,
        uploadDate: new Date()
      }));
      task.attachments = [...task.attachments, ...newAttachments];
    }

    // 3. DİĞER ALANLARI GÜNCELLE
    // Başlık, açıklama, kategori vb. verileri body'den alıp task objesine yazıyoruz
    const { title, description, category, dueDate, status } = req.body;
    task.title = title || task.title;
    task.description = description || task.description;
    task.category = category || task.category;
    task.dueDate = dueDate || task.dueDate;
    task.status = status || task.status;

    const updatedTask = await task.save(); // Değişiklikleri kaydet
    res.json(updatedTask);

  } catch (error) {
    console.error('Görev güncellenirken hata:', error);
    res.status(400).json({ message: 'Güncelleme başarısız', error: error.message });
  }
};

// Görevi sil (Dosyaları fiziksel olarak siler - Requirement 8.1)
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Görev bulunamadı' });
    }

    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Bu görevi silme yetkiniz yok' });
    }

    // GÖREVE AİT TÜM DOSYALARI SUNUCUDAN SİL (Temizlik)
    if (task.attachments && task.attachments.length > 0) {
      task.attachments.forEach(file => {
        const filePath = path.join(__dirname, '..', file.fileUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath); // Dosyayı bilgisayardan siler
        }
      });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Görev ve bağlı tüm dosyalar başarıyla silindi' });

  } catch (error) {
    console.error('Görev silinirken hata:', error);
    res.status(500).json({ message: 'Silme işlemi başarısız', error: error.message });
  }
};

// --- ADMIN FONKSİYONLARI ---

// Admin: Tüm görevleri getir
exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Admin: Tüm kullanıcıları getir
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Admin: Görev ata
exports.assignTask = async (req, res) => {
  try {
    const { taskId, userId } = req.body;
    
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Görev bulunamadı' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    task.userId = userId;
    await task.save();
    
    const updatedTask = await Task.findById(taskId).populate('userId', 'name email');
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Atama başarısız', error: error.message });
  }
};

// Admin: Herhangi bir görevi sil
exports.deleteAnyTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Görev bulunamadı' });
    }
    
    // Dosyaları sil
    if (task.attachments && task.attachments.length > 0) {
      task.attachments.forEach(file => {
        const filePath = path.join(__dirname, '..', file.fileUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Görev başarıyla silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Silme başarısız', error: error.message });
  }
};

// Admin: İstatistikler
exports.getAdminStats = async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'completed' });
    const pendingTasks = await Task.countDocuments({ status: 'pending' });
    const inProgressTasks = await Task.countDocuments({ status: 'in-progress' });
    const totalUsers = await User.countDocuments({ role: 'user' });
    
    res.json({
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      totalUsers
    });
  } catch (error) {
    res.status(500).json({ message: 'İstatistik hatası', error: error.message });
  }
};

// Admin: Başka kullanıcı için görev oluştur
exports.createTaskForUser = async (req, res) => {
  try {
    console.log('=== CREATE TASK FOR USER ===');
    console.log('req.body:', req.body);
    
    const { title, description, category, status, dueDate, dueTime, assignToUserId } = req.body;
    
    if (!assignToUserId) {
      return res.status(400).json({ message: 'Kullanıcı seçimi zorunludur' });
    }
    
    // Kullanıcı var mı kontrol et
    const targetUser = await User.findById(assignToUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    const task = await Task.create({
      userId: assignToUserId,
      title,
      description,
      category,
      status: status || 'pending',
      dueDate: dueDate || null,
      dueTime: dueTime || null
    });
    
    const populatedTask = await Task.findById(task._id).populate('userId', 'name email');
    console.log('Task created:', populatedTask);
    res.status(201).json(populatedTask);
  } catch (error) {
    console.error('Create task for user error:', error);
    res.status(500).json({ message: 'Görev oluşturulamadı', error: error.message });
  }
};

// Admin: Herhangi bir görevi güncelle
exports.updateAnyTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Görev bulunamadı' });
    }
    
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('userId', 'name email');
    
    res.json(updatedTask);
  } catch (error) {
    console.error('Update any task error:', error);
    res.status(500).json({ message: 'Güncelleme başarısız', error: error.message });
  }
};