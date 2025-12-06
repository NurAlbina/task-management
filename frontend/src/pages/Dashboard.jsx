import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Ana görev yönetimi dashboard bileşeni
const Dashboard = () => {
  // State tanımlamaları
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  
  // Bugünün tarihini al (YYYY-MM-DD formatında)
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Görev formu için state'ler
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Personal');
  const [dueDate, setDueDate] = useState(getTodayDate()); // Bugün default
  const [dateError, setDateError] = useState('');
  
  // Edit formu state'leri
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editStatus, setEditStatus] = useState('');
  
  const [userName, setUserName] = useState(''); // Kullanıcı adı için state

  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
    fetchUserName(); // Kullanıcı adını al
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
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

  // Kullanıcı adını localStorage veya token'dan al
  const fetchUserName = () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // JWT token'ı decode et 
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserName(payload.name || 'User');
      } catch (error) {
        setUserName('User');
      }
    }
  };

  const validateDate = (date) => {
    if (!date) return { valid: true, message: '' };
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const minYear = today.getFullYear();
    const maxYear = today.getFullYear() + 5;
    const selectedYear = selectedDate.getFullYear();
    
    if (selectedDate < today) return { valid: false, message: '❌ Geçmiş tarih seçilemez' };
    if (selectedYear < minYear) return { valid: false, message: '❌ Geçersiz yıl' };
    if (selectedYear > maxYear) return { valid: false, message: `❌ Tarih ${maxYear} yılından ileri olamaz` };
    
    return { valid: true, message: '' };
  };

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
      
      setTasks([response.data, ...tasks]);
      setTitle('');
      setDescription('');
      setCategory('Personal');
      setDueDate(getTodayDate()); // Formu temizlerken bugüne resetle
      setDateError('');
      setShowForm(false);
    } catch (error) {
      console.error('Görev eklenirken hata:', error);
      setError('Görev eklenemedi');
    }
  };

  const handleEditClick = (task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditCategory(task.category);
    setEditDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
    setEditStatus(task.status);
    setShowEditModal(true);
  };

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
      setTasks(tasks.map(t => t._id === editingTask._id ? response.data : t));
      setShowEditModal(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Görev güncellenirken hata:', error);
      setError('Görev güncellenemedi');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Bu görevi silmek istediğinizden emin misiniz?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(tasks.filter(task => task._id !== taskId));
    } catch (error) {
      console.error('Görev silinirken hata:', error);
      setError('Görev silinemedi');
    }
  };

  const handleToggleStatus = async (task) => {
    try {
      const token = localStorage.getItem('token');
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      const response = await axios.put(`/api/tasks/${task._id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(tasks.map(t => t._id === task._id ? response.data : t));
    } catch (error) {
      console.error('Durum güncellenirken hata:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a192f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-400"></div>
      </div>
    );
  }

  return (
    // Ana kapsayıcı -> Resimdeki koyu renkleri taklit eden gradient
    <div className="min-h-screen bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#0a192f] text-gray-100 font-sans selection:bg-teal-500 selection:text-white">
      
      {/* Arkaplan efekti */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-teal-500/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-pink-500/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-200 to-teal-400">
              Task Dashboard
            </h1>
            <p className="text-gray-400 mt-1">Welcome back, {userName}.</p>
          </div>
          <button 
            onClick={handleLogout}
            className="bg-white/5 hover:bg-red-500/20 text-red-300 border border-red-500/30 px-6 py-2.5 rounded-xl transition-all duration-300 backdrop-blur-sm"
          >
            Log Out
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-xl mb-6 backdrop-blur-md">
            {error}
          </div>
        )}
        
        {/* Stats & Actions gridi */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          
          {/* Action card */}
          <div className="group bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-2xl hover:border-teal-500/30 transition-all duration-300 shadow-xl">
            <h3 className="text-xl font-semibold mb-2 text-teal-50">Quick Actions</h3>
            <p className="text-gray-400 text-sm mb-4">Create and manage your daily missions.</p>
            <button 
              onClick={() => setShowForm(!showForm)}
              className={`w-full py-3 rounded-xl font-medium transition-all duration-300 shadow-lg ${
                showForm 
                ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                : 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white'
              }`}
            >
              {showForm ? '✕ Close Form' : '+ Add New Task'}
            </button>
          </div>
          
          {/* İstatistikler */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-2xl shadow-xl flex flex-col justify-center">
            <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Progress</h3>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-white">{completedTasks}</span>
              <span className="text-gray-500 mb-1">/ {totalTasks} Completed</span>
            </div>
            {/* İlerleme çubuğu */}
            <div className="w-full h-2 bg-gray-700/50 rounded-full mt-4 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-teal-400 to-blue-500 transition-all duration-500"
                style={{ width: `${totalTasks ? (completedTasks / totalTasks) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          {/* Kategoriler */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-2xl shadow-xl">
            <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-4">Active Categories</h3>
            <div className="flex flex-wrap gap-2">
              {[...new Set(tasks.map(t => t.category))].map((cat, i) => (
                <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-sm text-teal-200">
                  {cat}
                </span>
              ))}
              {tasks.length === 0 && <span className="text-gray-500 text-sm">No data yet</span>}
            </div>
          </div>
        </div>

        {/* Görev ekleme formu */}
        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${showForm ? 'max-h-[800px] opacity-100 mb-8' : 'max-h-0 opacity-0'}`}>
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

            <h3 className="text-2xl font-bold mb-6 text-white relative z-10">New Mission</h3>
            <form onSubmit={handleAddTask} className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-teal-200/80 text-sm mb-2">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all text-white placeholder-gray-500"
                    placeholder="Enter task title..."
                    required
                  />
                </div>
                <div>
                   <label className="block text-teal-200/80 text-sm mb-2">Category</label>
                   <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-teal-500/50 text-white appearance-none cursor-pointer"
                    >
                      <option className="bg-slate-800" value="Work">Work</option>
                      <option className="bg-slate-800" value="Personal">Personal</option>
                      <option className="bg-slate-800" value="Shopping">Shopping</option>
                      <option className="bg-slate-800" value="Health">Health</option>
                      <option className="bg-slate-800" value="Other">Other</option>
                    </select>
                    <div className="absolute right-4 top-4 pointer-events-none text-gray-400">▼</div>
                   </div>
                </div>
              </div>
              
              <div>
                <label className="block text-teal-200/80 text-sm mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-teal-500/50 text-white resize-none"
                  rows="3"
                  placeholder="Details about the task..."
                />
              </div>
              
              <div>
                <label className="block text-teal-200/80 text-sm mb-2">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={handleDateChange}
                  min={new Date().toISOString().split('T')[0]}
                  max={`${new Date().getFullYear() + 5}-12-31`}
                  className={`w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:border-teal-500/50 [color-scheme:dark] ${
                    dateError ? 'border-red-500/50 bg-red-500/5' : ''
                  }`}
                />
                {dateError && <p className="text-red-400 text-sm mt-2 flex items-center gap-1">{dateError}</p>}
              </div>
              
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-teal-900/20 transition-all duration-300 transform hover:scale-[1.01]"
              >
                Create Task
              </button>
            </form>
          </div>
        </div>

        {/* Task Listesi */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
          <h3 className="text-2xl font-bold mb-6 text-white flex items-center gap-3">
            Your Missions <span className="text-sm font-normal bg-white/10 px-3 py-1 rounded-full text-gray-300">{totalTasks}</span>
          </h3>
          
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 opacity-20">📝</div>
              <p className="text-gray-400 text-lg">No tasks found.</p>
              <p className="text-gray-600 text-sm">Add a new task to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map(task => (
                <div 
                  key={task._id} 
                  className={`group relative overflow-hidden p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:translate-y-[-2px] ${
                    task.status === 'completed' 
                    ? 'bg-emerald-900/10 border-emerald-500/20' 
                    : 'bg-white/5 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-xs px-2.5 py-1 rounded-md font-medium border ${
                          task.status === 'completed'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-blue-500/10 border-blue-500/20 text-blue-300'
                        }`}>
                          {task.category}
                        </span>
                        {task.dueDate && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            📅 {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      
                      <h4 className={`text-lg font-semibold transition-all ${
                        task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-100'
                      }`}>
                        {task.title}
                      </h4>
                      <p className={`text-sm mt-1 max-w-2xl ${
                         task.status === 'completed' ? 'text-gray-600' : 'text-gray-400'
                      }`}>{task.description}</p>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                      <button
                        onClick={() => handleToggleStatus(task)}
                        className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          task.status === 'completed'
                          ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border border-yellow-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                        }`}
                      >
                        {task.status === 'completed' ? '↩ Undo' : '✓ Complete'}
                      </button>
                      
                      <button
                        onClick={() => handleEditClick(task)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all border border-transparent hover:border-white/10"
                        title="Edit"
                      >
                        ✎
                      </button>
                      
                      <button
                        onClick={() => handleDeleteTask(task._id)}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all border border-transparent hover:border-red-500/20"
                        title="Delete"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modali */}
      {showEditModal && (
        <div className="fixed inset-0 bg-[#0a192f]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#112240] to-[#0a192f] border border-white/10 p-8 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden">
            {/* Arkaplan efekti */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-200 to-teal-400">Edit Task</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-300 transition-all border border-white/10 hover:border-red-500/30"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleUpdateTask} className="space-y-5 relative z-10">
              <div>
                <label className="block text-teal-200/80 text-sm mb-2">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 text-white transition-all"
                  required
                />
              </div>
              
              <div>
                <label className="block text-teal-200/80 text-sm mb-2">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 text-white resize-none transition-all"
                  rows="3"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-teal-200/80 text-sm mb-2">Category</label>
                  <div className="relative">
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-teal-500/50 text-white appearance-none cursor-pointer"
                    >
                      <option className="bg-slate-800" value="Work">Work</option>
                      <option className="bg-slate-800" value="Personal">Personal</option>
                      <option className="bg-slate-800" value="Shopping">Shopping</option>
                      <option className="bg-slate-800" value="Health">Health</option>
                      <option className="bg-slate-800" value="Other">Other</option>
                    </select>
                    <div className="absolute right-4 top-4 pointer-events-none text-gray-400">▼</div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-teal-200/80 text-sm mb-2">Status</label>
                  <div className="relative">
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:border-teal-500/50 text-white appearance-none cursor-pointer"
                    >
                      <option className="bg-slate-800" value="pending">Pending</option>
                      <option className="bg-slate-800" value="in-progress">In Progress</option>
                      <option className="bg-slate-800" value="completed">Completed</option>
                    </select>
                    <div className="absolute right-4 top-4 pointer-events-none text-gray-400">▼</div>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-teal-200/80 text-sm mb-2">Due Date</label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white [color-scheme:dark] focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all"
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-red-500/10 text-gray-300 hover:text-red-300 transition-all font-medium border border-white/10 hover:border-red-500/30"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white shadow-lg shadow-teal-900/20 transition-all font-medium transform hover:scale-[1.02]"
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