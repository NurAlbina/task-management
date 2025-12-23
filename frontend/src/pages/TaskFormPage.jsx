import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

const TaskFormPage = () => {
  const { id } = useParams(); // URL'den id al
  const navigate = useNavigate();
  const isEditMode = !!id; // id varsa edit modunda

  // Form state'leri
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Personal');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateError, setDateError] = useState('');

  // Dosya yönetimi state'leri
  const [selectedFiles, setSelectedFiles] = useState([]); // Yeni seçilen dosyalar
  const [existingAttachments, setExistingAttachments] = useState([]); // Sunucudan gelen mevcut dosyalar
  const [filesToDelete, setFilesToDelete] = useState([]); // Silinecek dosyaların listesi

  // Edit modunda mevcut görevi yükle
  useEffect(() => {
    if (isEditMode) {
      fetchTask();
    }
  }, [id]);

  // Görevi getir (edit modu için)
  const fetchTask = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const task = response.data.find(t => t._id === id);
      if (task) {
        setTitle(task.title);
        setDescription(task.description || '');
        setCategory(task.category);
        setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
        setStatus(task.status);
        
        // Veritabanındaki dosyaları state'e alıyoruz
        setExistingAttachments(task.attachments || []);
      }
    } catch (error) {
      console.error('Görev yüklenirken hata:', error);
      setError('Görev yüklenemedi');
    }
  };

  // Bugünün tarihini al
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Max tarih (5 yıl sonrası)
  const getMaxDate = () => {
    const maxYear = new Date().getFullYear() + 5;
    return `${maxYear}-12-31`;
  };

  // Tarih validasyonu
  const validateDate = (date) => {
    if (!date) return { valid: true, message: '' };
    
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      return { valid: false, message: '❌ Geçmiş bir tarih seçemezsiniz' };
    }
    
    const maxYear = today.getFullYear() + 5;
    if (selectedDate.getFullYear() > maxYear) {
      return { valid: false, message: `❌ Tarih ${maxYear} yılından ileri olamaz` };
    }
    
    return { valid: true, message: '' };
  };

  // Tarih değişimi
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setDueDate(newDate);
    const validation = validateDate(newDate);
    setDateError(validation.message);
  };

  // Dosya silme fonksiyonu
  const handleRemoveExistingFile = (fileUrl) => {
    // Silinecek dosyanın yolunu listeye ekle (Backend bunu silecek)
    setFilesToDelete(prev => [...prev, fileUrl]);
    // Ekranda görünen listeden hemen kaldır
    setExistingAttachments(prev => prev.filter(att => att.fileUrl !== fileUrl));
  };

  // form kaydetme
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Tarih kontrolü
    const dateValidation = validateDate(dueDate);
    if (!dateValidation.valid) {
      setDateError(dateValidation.message);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');

      // JSON YERİNE FORMDATA OLUŞTURUYORUZ 
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('dueDate', dueDate);
      formData.append('status', status);

      // Silinecek dosyaları ekle
      formData.append('deletedFiles', JSON.stringify(filesToDelete));

      // Yeni seçilen dosyaları tek tek ekle
      selectedFiles.forEach((file) => {
        formData.append('files', file); 
      });

      // Axios Config 
      const config = {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data' 
        }
      };

      if (isEditMode) {
        // Güncelle (PUT)
        await axios.put(`/api/tasks/${id}`, formData, config);
      } else {
        // Yeni ekle (POST)
        await axios.post('/api/tasks', formData, config);
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('Görev kaydedilirken hata:', error);
      setError(error.response?.data?.message || (isEditMode ? 'Görev güncellenemedi' : 'Görev eklenemedi'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a192f]">
      <Navbar />
      
      <div className="container mx-auto px-6 py-10">
        {/* Sayfa başlığı */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-200 to-teal-400">
            {isEditMode ? 'Edit Task' : 'New Task'}
          </h1>
          <p className="text-gray-400 mt-2">
            {isEditMode ? 'Update your task details' : 'Create a new task to track'}
          </p>
        </div>

        {/* Hata Mesajı */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-4 rounded-xl mb-6 max-w-2xl mx-auto">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="bg-gradient-to-br from-[#112240] to-[#0a192f] border border-white/10 rounded-3xl p-8 max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* İsim */}
            <div>
              <label className="block text-teal-200/80 text-sm mb-2">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 text-white transition-all"
                placeholder="Enter task title..."
                required
              />
            </div>

            {/* Açıklama */}
            <div>
              <label className="block text-teal-200/80 text-sm mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 text-white resize-none transition-all"
                placeholder="Enter task description..."
                rows="4"
              />
            </div>

            {/* Kategori ve durum */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-teal-200/80 text-sm mb-2">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-teal-500/50 text-white appearance-none cursor-pointer"
                >
                  <option className="bg-slate-800" value="Work">💼 Work</option>
                  <option className="bg-slate-800" value="Personal">👤 Personal</option>
                  <option className="bg-slate-800" value="Shopping">🛒 Shopping</option>
                  <option className="bg-slate-800" value="Health">❤️ Health</option>
                  <option className="bg-slate-800" value="Other">📌 Other</option>
                </select>
              </div>

              {isEditMode && (
                <div>
                  <label className="block text-teal-200/80 text-sm mb-2">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-teal-500/50 text-white appearance-none cursor-pointer"
                  >
                    <option className="bg-slate-800" value="pending">⏳ Pending</option>
                    <option className="bg-slate-800" value="in-progress">🔄 In Progress</option>
                    <option className="bg-slate-800" value="completed">✅ Completed</option>
                  </select>
                </div>
              )}
            </div>

            {/* Dosya yönetim alanı*/}
            
            {/* Mevcut Dosyalar Listesi (Requirement 8.1) */}
{existingAttachments.length > 0 && (
  <div className="space-y-2 border border-white/10 p-4 rounded-xl bg-black/10">
    <label className="block text-teal-200/50 text-[10px] font-bold uppercase tracking-widest mb-2">
      Attached Files
    </label>
    {existingAttachments.map((file, index) => (
      <div key={index} className="flex justify-between items-center bg-white/5 border border-white/10 p-2 rounded-lg group hover:border-teal-500/30 transition-all">
        
        {/* Dosya İndirme/Görüntüleme Alanı */}
        <a
          // BULUT KONTROLÜ: Eğer link 'http' ile başlıyorsa direkt kullan, değilse localhost ekle
          href={file.fileUrl.startsWith('http') ? file.fileUrl : `http://localhost:5000${file.fileUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 cursor-pointer hover:opacity-80"
          title="Click to download/preview"
        >
          <span className="text-teal-400 text-lg">📄</span>
          <div className="flex flex-col">
            {/* KARAKTER DÜZELTME: AdsÄ±z -> Adsız */}
            <span className="text-teal-100 text-xs font-medium truncate max-w-[200px] hover:underline hover:text-teal-300">
              {(() => {
                try { return decodeURIComponent(escape(file.fileName)); } 
                catch (e) { return file.fileName; }
              })()}
            </span>
            <span className="text-[10px] text-gray-500">
              {(file.fileSize / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
        </a>

        {/* Silme Butonu (Mevcut mantığın kalsın) */}
        <button
          type="button"
          onClick={() => handleRemoveExistingFile(file.fileUrl)}
          className="text-red-400 hover:text-red-300 text-[10px] font-bold uppercase px-2 py-1 bg-red-500/10 rounded-md transition-colors"
        >
          Remove
        </button>
      </div>
    ))}
  </div>
)}

            {/* Yeni Dosya Yükleme Alanı */}
            <div>
              <label className="block text-teal-200/80 text-sm mb-2">
                New Attachments (PDF, PNG, JPG, DOCX - Max 10MB)
              </label>
              <div className="relative group">
                <input
                  type="file"
                  multiple
                  onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl 
                             focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 
                             text-white transition-all cursor-pointer
                             file:mr-4 file:py-2 file:px-4
                             file:rounded-full file:border-0
                             file:text-sm file:font-semibold
                             file:bg-teal-500/20 file:text-teal-200
                             hover:file:bg-teal-500/30"
                />
              </div>
              
              {/* Yeni Seçilen Dosyaların İsimleri */}
              {selectedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="text-xs text-teal-400 flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/5">
                      <span>➕ {file.name}</span>
                      <span className="text-teal-200/40 text-[10px]">
                        ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>


            {/* Bitiş tarihi */}
            <div>
              <label className="block text-teal-200/80 text-sm mb-2">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={handleDateChange}
                min={getTodayDate()}
                max={getMaxDate()}
                className={`w-full px-4 py-3 bg-black/20 border rounded-xl text-white [color-scheme:dark] focus:outline-none transition-all ${
                  dateError ? 'border-red-500/50' : 'border-white/10 focus:border-teal-500/50'
                }`}
              />
              {dateError && (
                <p className="text-red-400 text-sm mt-2">{dateError}</p>
              )}
            </div>

            {/* Butonlar */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 px-6 py-3 rounded-xl bg-white/5 hover:bg-red-500/10 text-gray-300 hover:text-red-300 transition-all font-medium border border-white/10 hover:border-red-500/30"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 disabled:opacity-50 text-white shadow-lg shadow-teal-900/20 transition-all font-medium"
              >
                {loading ? 'Saving...' : (isEditMode ? 'Update Task' : 'Create Task')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskFormPage;