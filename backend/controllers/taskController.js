const Task = require('../models/Task');
const User = require('../models/User');
const s3 = require('../config/s3Config'); // S3 Konfigürasyonunu çağırıyoruz
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');

// --- YARDIMCI FONKSİYON: S3'ten Dosya Silme (SDK v3) ---
const deleteFileFromS3 = async (fileKey) => {
  if (!fileKey) return;
  
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileKey
  };

  try {
    // v3'te komut göndererek silme yapılır
    const command = new DeleteObjectCommand(params);
    await s3.send(command);
    console.log(`S3'ten dosya silindi: ${fileKey}`);
  } catch (error) {
    console.error(`S3 dosya silme hatası (${fileKey}):`, error);
  }
};

// Tüm görevleri getir (sadece giriş yapan kullanıcının görevleri)
exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    console.error('Görevler getirilirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Yeni görev oluştur (AWS S3 Desteği ile)
exports.createTask = async (req, res) => {
  try {
    const { title, description, category, dueDate, dueTime } = req.body;

    // 1. Multer-S3 tarafından yüklenen dosyaları al ve formatla
    // Not: Multer-S3 'req.files' içine 'key' ve 'location' ekler
    const attachments = req.files ? req.files.map(file => ({
      fileName: file.originalname,      // Orijinal dosya adı
      fileUrl: file.location,           // S3 URL'si (Frontend'de göstermek için)
      fileKey: file.key,                // S3 Anahtarı (Silmek için gerekli - ÖNEMLİ)
      fileSize: file.size,              // Dosya boyutu
      uploadDate: new Date()
    })) : [];

    // 2. Yeni görevi veritabanına kaydet
    const task = await Task.create({
      title,
      description,
      category,
      dueDate,
      dueTime,
      userId: req.user._id,
      attachments: attachments
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Görev oluşturulurken hata:', error);
    res.status(400).json({ message: 'Geçersiz görev verisi', error: error.message });
  }
};

// Görevi güncelle (AWS S3 Desteği ile)
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Görev bulunamadı' });
    }

    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Bu göreve erişim yetkiniz yok' });
    }

    // SİLİNECEK DOSYALARI YÖNET
    // Frontend'den silinecek dosyaların fileUrl veya fileKey'i gelmeli
    if (req.body.deletedFiles) {
      const filesToDelete = JSON.parse(req.body.deletedFiles); // Örn: ["https://s3...", "https://s3..."]
      
      // Döngüyle silinecek dosyaları işle
      for (const fileUrlToDelete of filesToDelete) {
        // Veritabanındaki attachment objesini bul
        const attachmentObj = task.attachments.find(att => att.fileUrl === fileUrlToDelete);
        
        if (attachmentObj && attachmentObj.fileKey) {
            // S3'ten sil
            await deleteFileFromS3(attachmentObj.fileKey);
        }

        // Veritabanı dizisinden çıkar
        task.attachments = task.attachments.filter(att => att.fileUrl !== fileUrlToDelete);
      }
    }

    // YENİ DOSYALARI EKLE (S3'e zaten yüklendi, veritabanına ekliyoruz)
    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map(file => ({
        fileName: file.originalname,
        fileUrl: file.location,  // S3 URL
        fileKey: file.key,       // S3 Key
        fileSize: file.size,
        uploadDate: new Date()
      }));
      task.attachments = [...task.attachments, ...newAttachments];
    }

    // DİĞER ALANLARI GÜNCELLE
    const { title, description, category, dueDate, status } = req.body;
    task.title = title || task.title;
    task.description = description || task.description;
    task.category = category || task.category;
    task.dueDate = dueDate || task.dueDate;
    task.status = status || task.status;

    const updatedTask = await task.save();
    res.json(updatedTask);

  } catch (error) {
    console.error('Görev güncellenirken hata:', error);
    res.status(400).json({ message: 'Güncelleme başarısız', error: error.message });
  }
};

// Görevi sil (Dosyaları S3'ten siler)
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Görev bulunamadı' });
    }

    if (task.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Bu görevi silme yetkiniz yok' });
    }

    // GÖREVE AİT TÜM DOSYALARI S3'TEN SİL
    if (task.attachments && task.attachments.length > 0) {
      for (const file of task.attachments) {
        if (file.fileKey) {
            await deleteFileFromS3(file.fileKey);
        }
      }
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Görev ve bağlı tüm dosyalar başarıyla silindi' });

  } catch (error) {
    console.error('Görev silinirken hata:', error);
    res.status(500).json({ message: 'Silme işlemi başarısız', error: error.message });
  }
};

// ADMIN FONKSİYONLARI 
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

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

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
    
    // Dosyaları S3'ten sil
    if (task.attachments && task.attachments.length > 0) {
        for (const file of task.attachments) {
            if (file.fileKey) {
                await deleteFileFromS3(file.fileKey);
            }
        }
    }
    
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Görev başarıyla silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Silme başarısız', error: error.message });
  }
};

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

exports.createTaskForUser = async (req, res) => {
  try {
    const { title, description, category, status, dueDate, dueTime, assignToUserId } = req.body;
    
    if (!assignToUserId) {
      return res.status(400).json({ message: 'Kullanıcı seçimi zorunludur' });
    }
    
    const targetUser = await User.findById(assignToUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    // Not: Admin panelinden dosya yükleme desteği şu an bu endpoint'te yok
    // Eğer eklenecekse createTasks ile aynı mantık (req.files kullanımı) eklenmeli
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
    res.status(201).json(populatedTask);
  } catch (error) {
    console.error('Create task for user error:', error);
    res.status(500).json({ message: 'Görev oluşturulamadı', error: error.message });
  }
};

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