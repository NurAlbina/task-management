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

  // Form submit
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
      const taskData = { title, description, category, dueDate, status };

      if (isEditMode) {
        // Güncelle
        await axios.put(`/api/tasks/${id}`, taskData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Yeni ekle
        await axios.post('/api/tasks', taskData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('Görev kaydedilirken hata:', error);
      setError(isEditMode ? 'Görev güncellenemedi' : 'Görev eklenemedi');
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