const Task = require('../models/Task');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// --- İstatistikleri Getir ---
exports.getStats = async (req, res) => {
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
    res.status(500).json({ message: error.message });
  }
};

// --- Tüm Görevleri Getir ---
exports.getAllTasks = async (req, res) => {
  try {
    // populate ile görevin sahibinin (userId) adını ve emailini de çekiyoruz
    const tasks = await Task.find().populate('userId', 'name email').sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Tüm Kullanıcıları Getir ---
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- YENİ: Admin Görev Oluşturma (Dosya Destekli) ---
exports.createTask = async (req, res) => {
  try {
    const { title, description, category, dueDate, status, assignToUserId } = req.body;

    // 1. Dosyaları Hazırla
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map(file => ({
        fileName: file.originalname,
        // Bulut için file.location, yerel için /uploads/
        fileUrl: file.location || `/uploads/${file.filename}`, 
        // DÜZELTME BURADA: fileKey eklendi (S3 için 'key', yerel için 'filename')
        fileKey: file.key || file.filename, 
        fileSize: file.size,
        uploadDate: new Date()
      }));
    }

    // 2. Görevi Oluştur
    const task = new Task({
      title,
      description,
      category,
      dueDate: dueDate || null,
      status: status || 'pending',
      userId: assignToUserId,
      attachments // Dosya dizisini ekle
    });

    const savedTask = await task.save();
    const populatedTask = await Task.findById(savedTask._id).populate('userId', 'name email');

    res.status(201).json(populatedTask);
  } catch (error) {
    console.error("Admin Create Task Error:", error);
    res.status(400).json({ message: 'Görev oluşturulamadı', error: error.message });
  }
};
// --- YENİ: Admin Görev Güncelleme (Dosya Destekli) ---
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Görev bulunamadı' });

    // 1. Silinecek Dosyalar
    if (req.body.deletedFiles) {
      const filesToDelete = JSON.parse(req.body.deletedFiles);
      filesToDelete.forEach(fileUrl => {
        // Yerel dosya ise sil
        if (!fileUrl.startsWith('http')) {
             const filePath = path.join(__dirname, '..', fileUrl);
             if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        task.attachments = task.attachments.filter(att => att.fileUrl !== fileUrl);
      });
    }

    // 2. Yeni Dosyaları Ekle
    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map(file => ({
        fileName: file.originalname,
        fileUrl: file.location || `/uploads/${file.filename}`,
        // DÜZELTME BURADA: fileKey eklendi
        fileKey: file.key || file.filename,
        fileSize: file.size,
        uploadDate: new Date()
      }));
      task.attachments = [...task.attachments, ...newAttachments];
    }

    // 3. Diğer Alanlar
    const { title, description, category, status, dueDate } = req.body;
    task.title = title || task.title;
    task.description = description || task.description;
    task.category = category || task.category;
    task.status = status || task.status;
    task.dueDate = dueDate || task.dueDate;

    const updatedTask = await task.save();
    const populatedTask = await Task.findById(updatedTask._id).populate('userId', 'name email');
    res.json(populatedTask);

  } catch (error) {
    console.error("Admin Update Task Error:", error);
    res.status(400).json({ message: 'Güncelleme başarısız', error: error.message });
  }
};

// --- Görev Silme ---
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Görev bulunamadı' });

    // Varsa fiziksel dosyaları temizle
    if (task.attachments) {
        task.attachments.forEach(file => {
            if (!file.fileUrl.startsWith('http')) {
                const filePath = path.join(__dirname, '..', file.fileUrl);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
        });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Görev silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Görev Atama (Basit versiyon) ---
exports.assignTask = async (req, res) => {
    try {
        const { taskId, userId } = req.body;
        const task = await Task.findByIdAndUpdate(taskId, { userId: userId }, { new: true }).populate('userId', 'name email');
        res.json(task);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};