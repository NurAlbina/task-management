import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Ana görev yönetimi dashboard bileşeni
const Dashboard = () => {
  // State tanımlamaları
  const [tasks, setTasks] = useState([]); // Görev listesi
  const [loading, setLoading] = useState(true); // Yükleme durumu
  const [error, setError] = useState(''); // Hata mesajı
  const [showForm, setShowForm] = useState(false); // Görev formu görünürlüğü
  const [showEditModal, setShowEditModal] = useState(false); // Edit modal görünürlüğü
  const [editingTask, setEditingTask] = useState(null); // Düzenlenen görev
  
  // Yeni görev formu için state'ler
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Personal');
  const [dueDate, setDueDate] = useState('');
  const [dateError, setDateError] = useState(''); // Tarih hatası için
  
  // Edit formu için state'ler
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editStatus, setEditStatus] = useState('');
  
  const navigate = useNavigate();

  // Sayfa yüklendiğinde görevleri getir
  useEffect(() => {
    fetchTasks();
  }, []);

  // Backend'den görevleri çek
  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Token yoksa login'e yönlendir
      if (!token) {
        navigate('/login');
        return;
      }

      // API isteği gönder (token ile)
      const response = await axios.get('/api/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setTasks(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Görevler yüklenirken hata:', error);
      setError('Görevler yüklenemedi');
      setLoading(false);
    }
  };

  // Tarih validasyonu
  const validateDate = (date) => {
    if (!date) return true; // Tarih zorunlu değilse boş olabilir
    
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Bugünün başlangıcı
    
    const minYear = today.getFullYear(); // Bu yıl
    const maxYear = today.getFullYear() + 5; // 5 yıl sonrası max
    
    const selectedYear = selectedDate.getFullYear();
    
    // Geçmiş tarih kontrolü
    if (selectedDate < today) {
      return { valid: false, message: '❌ Geçmiş bir tarih seçemezsiniz' };
    }
    
    // Çok eski yıl kontrolü (1992 gibi)
    if (selectedYear < minYear) {
      return { valid: false, message: '❌ Geçersiz yıl seçtiniz' };
    }
    
    // Çok ileri yıl kontrolü (2050 gibi)
    if (selectedYear > maxYear) {
      return { valid: false, message: `❌ Tarih ${maxYear} yılından ileri olamaz` };
    }
    
    return { valid: true, message: '' };
  };

  // Tarih değiştiğinde kontrol et
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setDueDate(newDate);
    
    const validation = validateDate(newDate);
    setDateError(validation.message);
  };

  // Yeni görev ekle
  const handleAddTask = async (e) => {
    e.preventDefault();
    
    // Tarih kontrolü
    const dateValidation = validateDate(dueDate);
    if (!dateValidation.valid) {
      setDateError(dateValidation.message);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post('/api/tasks', 
        { title, description, category, dueDate },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Yeni görevi listeye ekle
      setTasks([response.data, ...tasks]);
      
      // Formu temizle ve kapat
      setTitle('');
      setDescription('');
      setCategory('Personal');
      setDueDate('');
      setDateError(''); // Hata mesajını temizle
      setShowForm(false);
    } catch (error) {
      console.error('Görev eklenirken hata:', error);
      setError('Görev eklenemedi');
    }
  };

  // Edit modal'ı aç ve formu doldur
  const handleEditClick = (task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditCategory(task.category);
    setEditDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
    setEditStatus(task.status);
    setShowEditModal(true);
  };

  // Görevi güncelle
  const handleUpdateTask = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.put(`/api/tasks/${editingTask._id}`,
        { 
          title: editTitle, 
          description: editDescription, 
          category: editCategory, 
          dueDate: editDueDate,
          status: editStatus
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Güncellenen görevi listede değiştir
      setTasks(tasks.map(t => t._id === editingTask._id ? response.data : t));
      
      // Modal'ı kapat
      setShowEditModal(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Görev güncellenirken hata:', error);
      setError('Görev güncellenemedi');
    }
  };

  // Görev sil
  const handleDeleteTask = async (taskId) => {
    // Kullanıcıdan onay al
    const confirmDelete = window.confirm('Bu görevi silmek istediğinizden emin misiniz?');
    
    if (!confirmDelete) return; // İptal ettiyse çık
    
    try {
      const token = localStorage.getItem('token');
      
      await axios.delete(`/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Silinen görevi listeden çıkar
      setTasks(tasks.filter(task => task._id !== taskId));
    } catch (error) {
      console.error('Görev silinirken hata:', error);
      setError('Görev silinemedi');
    }
  };

  // Görev durumunu değiştir
  const handleToggleStatus = async (task) => {
    try {
      const token = localStorage.getItem('token');
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      
      const response = await axios.put(`/api/tasks/${task._id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Güncellenen görevi listede değiştir
      setTasks(tasks.map(t => t._id === task._id ? response.data : t));
    } catch (error) {
      console.error('Durum güncellenirken hata:', error);
    }
  };

  // Çıkış yap
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // İstatistikleri hesapla
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;

  // Yükleniyor durumu
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white text-xl">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Task Dashboard</h1>
          <button 
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
          >
            Çıkış Yap
          </button>
        </div>

        {/* Hata mesajı */}
        {error && (
          <div className="bg-red-600 text-white p-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        {/* Dashboard grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Yeni görev ekleme kartı */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Add New Task</h3>
            <button 
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded w-full"
            >
              {showForm ? '✕ Kapat' : '+ Add Task'}
            </button>
          </div>
          
          {/* İstatistikler kartı */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Statistics</h3>
            <p className="text-gray-400">{completedTasks} completed / {totalTasks} total</p>
          </div>

          {/* Kategori özeti kartı */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Categories</h3>
            <p className="text-gray-400">
              {[...new Set(tasks.map(t => t.category))].join(', ') || 'No categories'}
            </p>
          </div>
        </div>

        {/* Yeni görev formu */}
        {showForm && (
          <div className="bg-gray-800 p-6 rounded-lg mb-8">
            <h3 className="text-xl font-semibold mb-4">New Task</h3>
            <form onSubmit={handleAddTask} className="space-y-4">
              {/* Başlık */}
              <div>
                <label className="block text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
                  required
                />
              </div>
              
              {/* Açıklama */}
              <div>
                <label className="block text-gray-300 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg resize-none"
                  rows="3"
                />
              </div>
              
              {/* Kategori */}
              <div>
                <label className="block text-gray-300 mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
                >
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Health">Health</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              {/* Tarih */}
              <div>
                <label className="block text-gray-300 mb-2">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={handleDateChange}
                  min={new Date().toISOString().split('T')[0]} // Bugünden öncesi seçilemez
                  max={`${new Date().getFullYear() + 5}-12-31`} // 5 yıl sonrasına kadar
                  className={`w-full px-4 py-2 bg-gray-700 text-white rounded-lg ${
                    dateError ? 'ring-2 ring-red-500' : ''
                  }`}
                />
                {/* Tarih uyarısı */}
                {dateError && (
                  <p className="text-red-400 text-sm mt-1">{dateError}</p>
                )}
              </div>
              
              {/* Submit butonu */}
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 py-2 rounded-lg"
              >
                Create Task
              </button>
            </form>
          </div>
        )}

        {/* Görev listesi */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">My Tasks ({totalTasks})</h3>
          
          {tasks.length === 0 ? (
            <p className="text-gray-400">No tasks yet. Add your first task!</p>
          ) : (
            <div className="space-y-4">
              {tasks.map(task => (
                <div 
                  key={task._id} 
                  className={`p-4 rounded-lg flex justify-between items-center ${
                    task.status === 'completed' ? 'bg-green-900/30' : 'bg-gray-700'
                  }`}
                >
                  {/* Görev bilgileri */}
                  <div className="flex-1">
                    <h4 className={`font-semibold ${
                      task.status === 'completed' ? 'line-through text-gray-400' : ''
                    }`}>
                      {task.title}
                    </h4>
                    <p className="text-gray-400 text-sm">{task.description}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="bg-blue-600 px-2 py-1 rounded text-xs">
                        {task.category}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        task.status === 'completed' ? 'bg-green-600' : 'bg-yellow-600'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                  
                  {/* Aksiyon butonları */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditClick(task)}
                      className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-sm"
                    >
                      ✎ Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(task)}
                      className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                    >
                      {task.status === 'completed' ? '↩ Undo' : '✓ Done'}
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task._id)}
                      className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Edit Task</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleUpdateTask} className="space-y-4">
              {/* Başlık */}
              <div>
                <label className="block text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
                  required
                />
              </div>
              
              {/* Açıklama */}
              <div>
                <label className="block text-gray-300 mb-2">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg resize-none"
                  rows="3"
                />
              </div>
              
              {/* Kategori */}
              <div>
                <label className="block text-gray-300 mb-2">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
                >
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Health">Health</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              {/* Durum */}
              <div>
                <label className="block text-gray-300 mb-2">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              
              {/* Tarih */}
              <div>
                <label className="block text-gray-300 mb-2">Due Date</label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
                />
              </div>
              
              {/* Butonlar */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;