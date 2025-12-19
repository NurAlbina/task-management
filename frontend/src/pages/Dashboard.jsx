import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

// Ana görev yönetimi dashboard bileşeni
const Dashboard = () => {
  // State tanımlamaları
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false); 
  const [selectedTaskDetail, setSelectedTaskDetail] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
    fetchUserName();
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

  const fetchUserName = () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserName(payload.name || 'User');
      } catch (error) {
        setUserName('User');
      }
    }
  };

  const handleEditClick = (task) => {
    navigate(`/edit-task/${task._id}`);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
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

  const handleChangeStatus = async (task, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`/api/tasks/${task._id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(tasks.map(t => t._id === task._id ? response.data : t));
    } catch (error) {
      console.error('Durum güncellenirken hata:', error);
    }
  };

  // Kategori renkleri
  const getCategoryColor = (category) => {
    const colors = {
      Work: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
      Personal: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
      Shopping: 'bg-pink-500/10 text-pink-300 border-pink-500/20',
      Health: 'bg-red-500/10 text-red-300 border-red-500/20',
      Other: 'bg-gray-500/10 text-gray-300 border-gray-500/20'
    };
    return colors[category] || colors.Other;
  };

  // Durum renkleri
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
      'in-progress': 'bg-blue-500/10 text-blue-300 border-blue-500/20',
      completed: 'bg-green-500/10 text-green-300 border-green-500/20'
    };
    return colors[status] || colors.pending;
  };

  const filteredTasks = tasks.filter(task => {
    const categoryMatch = filterCategory === 'all' || task.category === filterCategory;
    const statusMatch = filterStatus === 'all' || task.status === filterStatus;
    return categoryMatch && statusMatch;
  });
  const completedTasks = filteredTasks.filter(t => t.status === 'completed').length;
  const totalTasks = filteredTasks.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a192f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a192f]">
      <Navbar />
      
      <div className="container mx-auto px-6 py-10">
        {/* Başlık */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-200 to-teal-400">
              My Tasks
            </h1>
            <p className="text-gray-400 mt-2">Welcome back, {userName}</p>
          </div>
          <div className="text-gray-400 font-mono text-sm bg-white/5 px-4 py-2 rounded-lg border border-white/10">
            {completedTasks} / {totalTasks} completed
          </div>
        </div>

        {/* Hata Mesajı */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Filtreleme kontrolleri */}
        <div className="bg-[#112240] border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-lg font-semibold">Filter</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Kategori filtresi */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 rounded-lg bg-[#0a192f] text-white border border-white/10 focus:border-teal-500 focus:outline-none transition-all"
              >
                <option value="all">All Categories</option>
                <option value="Work">Work</option>
                <option value="Personal">Personal</option>
                <option value="Shopping">Shopping</option>
                <option value="Health">Health</option>
                <option value="Other">Other</option>
              </select>

              {/* Durum filtresi */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 rounded-lg bg-[#0a192f] text-white border border-white/10 focus:border-teal-500 focus:outline-none transition-all"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>

              {/* Filtreleri temizle */}
              {(filterCategory !== 'all' || filterStatus !== 'all') && (
                <button
                  onClick={() => { setFilterCategory('all'); setFilterStatus('all'); }}
                  className="px-4 py-2 rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/30 transition-all text-sm font-medium"
                >
                  ✕ Clear Filters
                </button>
              )}
            </div>

            {/* Aktif filtre göstergesi */}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-gray-400 text-sm">
                Showing {filteredTasks.length} of {tasks.length} tasks
              </span>
            </div>
          </div>
        </div>

        {/* Görev Listesi */}
        {filteredTasks.length === 0 ? (
          <div className="bg-[#112240] border border-white/10 rounded-2xl p-12 text-center">
            <p className="text-gray-400 text-lg mb-4">
              {tasks.length === 0 ? 'No tasks yet' : 'No tasks match the selected filters'}
            </p>
            {tasks.length === 0 && (
              <Link
                to="/add-task"
                className="inline-block px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white rounded-xl transition-all shadow-lg shadow-teal-900/20"
              >
                Create Your First Task
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map(task => (
              <div 
                key={task._id} 
                className={`bg-[#112240] border rounded-2xl p-6 transition-all hover:border-teal-500/30 flex flex-col gap-4 cursor-pointer ${
                  task.status === 'completed' ? 'border-green-500/20 opacity-75 hover:opacity-100' : 'border-white/10'
                }`}
                onClick={() => { setSelectedTaskDetail(task); setShowDetailModal(true); }}
              >
                {/* ÜST KISIM: Bilgiler ve Butonlar */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  
                  {/* SOL: Görev Detayları */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-xl font-semibold mb-2 truncate pr-4 ${
                      task.status === 'completed' ? 'line-through text-gray-500' : 'text-white'
                    }`}>
                      {task.title}
                    </h3>
                    
                    {task.description && (
                      <p className="text-gray-400 mb-3 text-sm line-clamp-2">{task.description}</p>
                    )}
                    
                    {/* Etiketler (Grid yapısı bozulmasın diye flex-wrap) */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getCategoryColor(task.category)}`}>
                        {task.category}
                      </span>
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                      {task.dueDate && (
                        <span className="px-3 py-1 rounded-lg text-xs font-medium bg-white/5 text-gray-400 border border-white/10 flex items-center gap-1">
                          📅 {new Date(task.dueDate).toLocaleDateString('tr-TR')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* SAĞ: Aksiyon Butonları (İkon Halinde) */}
                  <div className="flex items-center gap-2 self-start md:self-center" onClick={(e) => e.stopPropagation()}>
                    {task.status === 'pending' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleChangeStatus(task, 'in-progress'); }} 
                        className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-all"
                        title="Start Task"
                      >
                        ▶
                      </button>
                    )}
                    {task.status === 'in-progress' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleChangeStatus(task, 'completed'); }} 
                        className="p-2.5 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 transition-all"
                        title="Complete Task"
                      >
                        ✓
                      </button>
                    )}
                    {task.status === 'completed' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleChangeStatus(task, 'pending'); }} 
                        className="p-2.5 rounded-xl bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/20 transition-all"
                        title="Undo"
                      >
                        ↺
                      </button>
                    )}
                    
                    <div className="w-px h-8 bg-white/10 mx-1"></div> {/* Ayırıcı Çizgi */}

                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEditClick(task); }} 
                      className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 border border-teal-500/20 transition-all"
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteTask(task._id); }} 
                      className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all"
                      title="Delete"
                    >
                      🗑
                    </button>
                  </div>
                </div>

                {/* --- ALT KISIM: Dosya Ekleri (Tam Genişlik) --- */}
                {task.attachments && task.attachments.length > 0 && (
                  <div className="mt-2 pt-4 border-t border-white/5 w-full" onClick={(e) => e.stopPropagation()}>
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-3 flex items-center gap-2 tracking-wider">
                      <span className="bg-teal-500/20 text-teal-400 p-1 rounded">📎</span>
                      Attachments ({task.attachments.length})
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {task.attachments.map((file, index) => {
                         // İsim düzeltme (Adsız vs.)
                         let cleanName = file.fileName;
                         try { cleanName = decodeURIComponent(escape(file.fileName)); } catch (e) {}
                         
                         return (
                          <a
                            key={index}
                            href={`http://localhost:5000${file.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-3 p-3 rounded-xl bg-[#0a192f] border border-white/10 hover:border-teal-500/40 hover:bg-teal-500/5 transition-all relative overflow-hidden"
                          >
                            {/* Dosya İkonu */}
                            <div className="w-10 h-10 rounded-lg bg-teal-900/30 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform shadow-inner">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            
                            {/* Dosya Bilgisi */}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-200 truncate group-hover:text-teal-200 transition-colors">
                                {cleanName}
                              </p>
                              <p className="text-[10px] text-gray-500 mt-0.5 font-mono">
                                {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>

                            {/* İndirme Ok'u (Hover'da görünür) */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-3 text-teal-400 bg-teal-500/10 p-1 rounded">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {showDetailModal && selectedTaskDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowDetailModal(false)}>
          <div 
            className="bg-[#112240] border border-white/10 rounded-2xl p-8 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-semibold text-white">{selectedTaskDetail.title}</h3>

              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Description */}
              <div>
                <p className="text-gray-400 text-sm mb-2">Description</p>
                <p className="text-white bg-black/20 p-4 rounded-xl min-h-[100px]">
                  {selectedTaskDetail.description || 'No description'}
                </p>
              </div>

              {/* Grid Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Category</p>
                  <p className="text-teal-300 font-medium">{selectedTaskDetail.category}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">Status</p>
                  <span className={`px-3 py-1 rounded-lg text-xs font-medium border inline-block ${getStatusColor(selectedTaskDetail.status)}`}>
                    {selectedTaskDetail.status}
                  </span>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">Created</p>
                  <p className="text-white">{new Date(selectedTaskDetail.createdAt).toLocaleDateString('tr-TR')}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">Due Date</p>
                  <p className="text-white">
                    {selectedTaskDetail.dueDate 
                      ? new Date(selectedTaskDetail.dueDate).toLocaleDateString('tr-TR')
                      : 'No due date'}
                  </p>
                </div>
              </div>

              {/* Attachments */}
              {selectedTaskDetail.attachments && selectedTaskDetail.attachments.length > 0 && (
                <div className="border-t border-white/10 pt-4">
                  <p className="text-gray-400 text-sm mb-3">Attachments ({selectedTaskDetail.attachments.length})</p>
                  <div className="space-y-2">
                    {selectedTaskDetail.attachments.map((file, index) => {
                      let cleanName = file.fileName;
                      try { cleanName = decodeURIComponent(escape(file.fileName)); } catch (e) {}
                      
                      return (
                        <a
                          key={index}
                          href={`http://localhost:5000${file.fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-black/20 rounded-xl hover:bg-black/40 transition-all"
                        >
                          <span className="text-xl">📎</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white truncate text-sm">{cleanName}</p>
                            <p className="text-gray-500 text-xs">{(file.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                          <span className="text-teal-400 text-sm">↓</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;