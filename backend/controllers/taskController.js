const Task = require('../models/Task');
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