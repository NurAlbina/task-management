import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminPanel = () => {
  const [stats, setStats] = useState({ totalTasks: 0, completedTasks: 0, pendingTasks: 0, inProgressTasks: 0, totalUsers: 0 });
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Seçim State'leri
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedUser, setSelectedUser] = useState('');
  
  // Modal Görünürlük State'leri
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState(null);

  // --- DOSYA YÖNETİMİ İÇİN YENİ STATE'LER (Requirement 8.1) ---
  const [selectedFiles, setSelectedFiles] = useState([]); // Yeni seçilen dosyalar
  const [existingAttachments, setExistingAttachments] = useState([]); // Düzenlemede mevcut dosyalar
  const [filesToDelete, setFilesToDelete] = useState([]); // Silinecek dosyalar listesi

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'Personal',
    status: 'pending',
    dueDate: '',
    assignToUserId: ''
  });

  const [editTask, setEditTask] = useState({
    _id: '',
    title: '',
    description: '',
    category: 'Personal',
    status: 'pending',
    dueDate: ''
  });

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };
  // Dosya gönderimi için özel config
  const fileConfig = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, tasksRes, usersRes] = await Promise.all([
        axios.get('/api/admin/stats', config),
        axios.get('/api/admin/tasks', config),
        axios.get('/api/admin/users', config)
      ]);
      setStats(statsRes.data);
      setTasks(tasksRes.data);
      setUsers(usersRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Bu görevi silmek istediğinize emin misiniz?')) return;
    try {
      await axios.delete(`/api/admin/tasks/${taskId}`, config);
      setTasks(tasks.filter(t => t._id !== taskId));
      setStats(prev => ({ ...prev, totalTasks: prev.totalTasks - 1 }));
    } catch (error) {
      console.error('Silme hatası:', error);
    }
  };

  const handleAssignTask = async () => {
    if (!selectedUser) return;
    try {
      const res = await axios.put('/api/admin/assign', 
        { taskId: selectedTask._id, userId: selectedUser }, 
        config
      );
      setTasks(tasks.map(t => t._id === selectedTask._id ? res.data : t));
      setShowAssignModal(false);
      setSelectedTask(null);
      setSelectedUser('');
    } catch (error) {
      console.error('Atama hatası:', error);
    }
  };

  // --- YENİ GÖREV OLUŞTURMA (DOSYA DESTEKLİ) ---
  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.assignToUserId) {
      alert('Başlık ve kullanıcı seçimi zorunludur');
      return;
    }
    try {
      // JSON yerine FormData kullanıyoruz
      const formData = new FormData();
      formData.append('title', newTask.title);
      formData.append('description', newTask.description);
      formData.append('category', newTask.category);
      formData.append('status', newTask.status);
      formData.append('dueDate', newTask.dueDate);
      formData.append('assignToUserId', newTask.assignToUserId); // Admin için özel alan

      // Dosyaları ekle
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      const res = await axios.post('/api/admin/tasks', formData, fileConfig);
      
      setTasks([res.data, ...tasks]);
      setStats(prev => ({ ...prev, totalTasks: prev.totalTasks + 1 }));
      setShowCreateModal(false);
      
      // Formu sıfırla
      setNewTask({ title: '', description: '', category: 'Personal', status: 'pending', dueDate: '', assignToUserId: '' });
      setSelectedFiles([]); 
    } catch (error) {
      console.error('Görev oluşturma hatası:', error);
      alert('Görev oluşturulamadı');
    }
  };

  // --- DÜZENLEME MODUNU AÇMA ---
  const openEditModal = (task) => {
    setEditTask({
      _id: task._id,
      title: task.title,
      description: task.description || '',
      category: task.category,
      status: task.status,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
    });
    // Mevcut dosyaları yükle
    setExistingAttachments(task.attachments || []);
    setFilesToDelete([]); // Silinecekler listesini sıfırla
    setSelectedFiles([]); // Yeni eklenecekleri sıfırla
    setShowEditModal(true);
  };

  // --- DOSYA SİLME İŞLEMİ (Edit Modunda) ---
  const handleRemoveExistingFile = (fileUrl) => {
    setFilesToDelete(prev => [...prev, fileUrl]);
    setExistingAttachments(prev => prev.filter(att => att.fileUrl !== fileUrl));
  };

  // --- GÖREV GÜNCELLEME (DOSYA DESTEKLİ) ---
  const handleEditTask = async () => {
    if (!editTask.title) {
      alert('Başlık zorunludur');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('title', editTask.title);
      formData.append('description', editTask.description);
      formData.append('category', editTask.category);
      formData.append('status', editTask.status);
      formData.append('dueDate', editTask.dueDate || '');

      // Silinecek dosyaları bildir
      formData.append('deletedFiles', JSON.stringify(filesToDelete));

      // Yeni eklenen dosyaları gönder
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      const res = await axios.put(`/api/admin/tasks/${editTask._id}`, formData, fileConfig);
      
      setTasks(tasks.map(t => t._id === editTask._id ? res.data : t));
      setShowEditModal(false);
      setEditTask({ _id: '', title: '', description: '', category: 'Personal', status: 'pending', dueDate: '' });
      setSelectedFiles([]);
      setFilesToDelete([]);
      // Listeyi tazele (gerekirse)
      // fetchData(); 
    } catch (error) {
      console.error('Güncelleme hatası:', error);
      alert('Görev güncellenemedi');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'in-progress': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      completed: 'bg-green-500/20 text-green-300 border-green-500/30'
    };
    return colors[status] || colors.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a192f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a192f]">
      {/* Header */}
      <nav className="bg-[#0a192f]/80 backdrop-blur-md border-b border-red-500/20 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">
              🛡️ Admin Panel
            </h1>
            <p className="text-gray-500 text-sm">System Management</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 transition-all"
          >
            Log Out
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-10">
        {/* İstatistik Kartları (Aynı) */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-10">
          <div className="bg-[#112240] border border-white/10 rounded-2xl p-6">
            <p className="text-gray-400 text-sm">Total Tasks</p>
            <p className="text-3xl font-bold text-white">{stats.totalTasks}</p>
          </div>
          <div className="bg-[#112240] border border-green-500/20 rounded-2xl p-6">
            <p className="text-gray-400 text-sm">Completed</p>
            <p className="text-3xl font-bold text-green-400">{stats.completedTasks}</p>
          </div>
          <div className="bg-[#112240] border border-blue-500/20 rounded-2xl p-6">
            <p className="text-gray-400 text-sm">In Progress</p>
            <p className="text-3xl font-bold text-blue-400">{stats.inProgressTasks}</p>
          </div>
          <div className="bg-[#112240] border border-yellow-500/20 rounded-2xl p-6">
            <p className="text-gray-400 text-sm">Pending</p>
            <p className="text-3xl font-bold text-yellow-400">{stats.pendingTasks}</p>
          </div>
          <div className="bg-[#112240] border border-purple-500/20 rounded-2xl p-6">
            <p className="text-gray-400 text-sm">Total Users</p>
            <p className="text-3xl font-bold text-purple-400">{stats.totalUsers}</p>
          </div>
        </div>

        {/* Görev Listesi (Tablo) */}
        <div className="bg-[#112240] border border-white/10 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-red-300">📋 All Tasks</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-medium transition-all shadow-lg shadow-teal-500/20"
            >
              + Create New Task
            </button>
          </div>
          
          {tasks.length === 0 ? (
            <p className="text-gray-500 text-center py-10">No tasks in system</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-sm border-b border-white/10">
                    <th className="pb-4 pr-4">Title</th>
                    <th className="pb-4 pr-4">Owner</th>
                    <th className="pb-4 pr-4">Category</th>
                    <th className="pb-4 pr-4">Status</th>
                    <th className="pb-4 pr-4">Due Date</th>
                    <th className="pb-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(task => (
                    <tr 
                      key={task._id} 
                      className="border-b border-white/5 hover:bg-white/10 cursor-pointer"
                      onClick={() => { setSelectedTaskDetail(task); setShowDetailModal(true); }}
                    >
                      <td className="py-4 pr-4">
                        <p className="text-white font-medium truncate max-w-[200px]">{task.title}</p>
                      </td>
                      <td className="py-4 pr-4">
                        <p className="text-teal-300 text-sm">{task.userId?.name || 'Unknown'}</p>
                        <p className="text-gray-500 text-xs">{task.userId?.email}</p>
                      </td>
                      <td className="py-4 pr-4">
                        <span className="text-gray-300 text-sm">{task.category}</span>
                      </td>
                      <td className="py-4 pr-4">
                        <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-gray-400 text-sm">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString('tr-TR') : '-'}
                      </td>
                      <td className="py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); openEditModal(task); }} 
                            className="px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-300 hover:bg-teal-500/20 border border-teal-500/30 text-xs font-medium transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedTask(task); setShowAssignModal(true); }}
                            className="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/30 text-xs font-medium transition-all"
                          >
                            Assign
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteTask(task._id); }}
                            className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/30 text-xs font-medium transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Assign Modal (Aynı) */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#112240] border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Assign Task</h3>
            <p className="text-gray-400 text-sm mb-4">
              Task: <span className="text-teal-300">{selectedTask?.title}</span>
            </p>
            
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white mb-4"
            >
              <option value="">Select User</option>
              {users.filter(u => u.role === 'user').map(user => (
                <option key={user._id} value={user._id} className="bg-slate-800">
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
            
            <div className="flex gap-3">
              <button
                onClick={() => { setShowAssignModal(false); setSelectedTask(null); }}
                className="flex-1 px-4 py-2 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignTask}
                disabled={!selectedUser}
                className="flex-1 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CREATE TASK MODAL (GÜNCELLENMİŞ) --- */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#112240] border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-white mb-4">Create Task for User</h3>
            
            <div className="space-y-4">
              {/* Başlık */}
              <div>
                <label className="block text-gray-400 text-sm mb-1">Title *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white"
                  placeholder="Task title"
                />
              </div>
              
              {/* Açıklama */}
              <div>
                <label className="block text-gray-400 text-sm mb-1">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white resize-none"
                  rows="3"
                  placeholder="Task description"
                />
              </div>
              
              {/* Kategori ve Durum */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Category</label>
                  <select
                    value={newTask.category}
                    onChange={(e) => setNewTask({...newTask, category: e.target.value})}
                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white"
                  >
                    <option value="Work" className="bg-slate-800">Work</option>
                    <option value="Personal" className="bg-slate-800">Personal</option>
                    <option value="Shopping" className="bg-slate-800">Shopping</option>
                    <option value="Health" className="bg-slate-800">Health</option>
                    <option value="Other" className="bg-slate-800">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Status</label>
                  <select
                    value={newTask.status}
                    onChange={(e) => setNewTask({...newTask, status: e.target.value})}
                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white"
                  >
                    <option value="pending" className="bg-slate-800">Pending</option>
                    <option value="in-progress" className="bg-slate-800">In Progress</option>
                    <option value="completed" className="bg-slate-800">Completed</option>
                  </select>
                </div>
              </div>
              
              {/* Tarih */}
              <div>
                <label className="block text-gray-400 text-sm mb-1">Due Date</label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white"
                />
              </div>

              {/* Kullanıcı Seçimi */}
              <div>
                <label className="block text-gray-400 text-sm mb-1">Assign to User *</label>
                <select
                  value={newTask.assignToUserId}
                  onChange={(e) => setNewTask({...newTask, assignToUserId: e.target.value})}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white"
                >
                  <option value="">Select User</option>
                  {users.filter(u => u.role === 'user').map(user => (
                    <option key={user._id} value={user._id} className="bg-slate-800">
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* DOSYA YÜKLEME ALANI (YENİ) */}
              <div>
                <label className="block text-gray-400 text-sm mb-1">Attachments</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-500/20 file:text-teal-300 hover:file:bg-teal-500/30"
                />
                {selectedFiles.length > 0 && (
                  <div className="mt-2 text-xs text-teal-300">
                    {selectedFiles.length} file(s) selected
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTask}
                className="flex-1 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT TASK MODAL (GÜNCELLENMİŞ) --- */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#112240] border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-white mb-4">Edit Task</h3>
            
            <div className="space-y-4">
              {/* Başlık */}
              <div>
                <label className="block text-gray-400 text-sm mb-1">Title *</label>
                <input
                  type="text"
                  value={editTask.title}
                  onChange={(e) => setEditTask({...editTask, title: e.target.value})}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white"
                />
              </div>
              
              {/* Açıklama */}
              <div>
                <label className="block text-gray-400 text-sm mb-1">Description</label>
                <textarea
                  value={editTask.description}
                  onChange={(e) => setEditTask({...editTask, description: e.target.value})}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white resize-none"
                  rows="3"
                />
              </div>
              
              {/* Kategori ve Durum */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Category</label>
                  <select
                    value={editTask.category}
                    onChange={(e) => setEditTask({...editTask, category: e.target.value})}
                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white"
                  >
                    <option value="Work" className="bg-slate-800">Work</option>
                    <option value="Personal" className="bg-slate-800">Personal</option>
                    <option value="Shopping" className="bg-slate-800">Shopping</option>
                    <option value="Health" className="bg-slate-800">Health</option>
                    <option value="Other" className="bg-slate-800">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Status</label>
                  <select
                    value={editTask.status}
                    onChange={(e) => setEditTask({...editTask, status: e.target.value})}
                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white"
                  >
                    <option value="pending" className="bg-slate-800">Pending</option>
                    <option value="in-progress" className="bg-slate-800">In Progress</option>
                    <option value="completed" className="bg-slate-800">Completed</option>
                  </select>
                </div>
              </div>
              
              {/* Tarih */}
              <div>
                <label className="block text-gray-400 text-sm mb-1">Due Date</label>
                <input
                  type="date"
                  value={editTask.dueDate}
                  onChange={(e) => setEditTask({...editTask, dueDate: e.target.value})}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white"
                />
              </div>

              {/* DOSYA YÖNETİMİ (MEVCUT DOSYALAR) */}
              {existingAttachments.length > 0 && (
                <div className="p-3 border border-white/10 rounded-xl bg-black/10">
                  <label className="block text-gray-400 text-xs uppercase mb-2">Existing Files</label>
                  <div className="space-y-2">
                    {existingAttachments.map((file, index) => (
                      <div key={index} className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                        <a 
                          href={file.fileUrl.startsWith('http') ? file.fileUrl : `http://localhost:5000${file.fileUrl}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs text-teal-300 truncate max-w-[150px] hover:underline"
                        >
                          {(() => {
                            try { return decodeURIComponent(escape(file.fileName)); } 
                            catch (e) { return file.fileName; }
                          })()}
                        </a>
                        <button 
                          onClick={() => handleRemoveExistingFile(file.fileUrl)}
                          className="text-red-400 text-xs hover:text-red-300"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DOSYA YÜKLEME (YENİ DOSYALAR) */}
              <div>
                <label className="block text-gray-400 text-sm mb-1">Add New Attachments</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-500/20 file:text-teal-300 hover:file:bg-teal-500/30"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleEditTask}
                className="flex-1 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Modal (Aynı) */}
      {showDetailModal && selectedTaskDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#112240] border border-white/10 rounded-2xl p-8 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            {/* Detay modal içeriği (Aynı kalacak) */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-semibold text-white">{selectedTaskDetail.title}</h3>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-gray-400 text-sm mb-2">Description</p>
                <p className="text-white bg-black/20 p-4 rounded-xl min-h-[100px]">
                  {selectedTaskDetail.description || 'No description'}
                </p>
              </div>

              {/* Diğer detaylar... */}
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
                  <p className="text-gray-400 text-sm mb-2">Owner</p>
                  <div>
                    <p className="text-white">{selectedTaskDetail.userId?.name || 'Unknown'}</p>
                    <p className="text-gray-500 text-xs">{selectedTaskDetail.userId?.email}</p>
                  </div>
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

              {/* Dosya eklentileri (Düzeltilmiş Link Yapısı) */}
              {selectedTaskDetail.attachments && selectedTaskDetail.attachments.length > 0 && (
                <div className="border-t border-white/10 pt-4">
                  <p className="text-gray-400 text-sm mb-3">Attachments ({selectedTaskDetail.attachments.length})</p>
                  <div className="space-y-2">
                    {selectedTaskDetail.attachments.map((file, index) => (
                      <a
                        key={index}
                        href={file.fileUrl.startsWith('http') ? file.fileUrl : `http://localhost:5000${file.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-black/20 rounded-xl hover:bg-black/40 transition-all"
                      >
                        <span className="text-xl">📎</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white truncate text-sm">
                            {(() => {
                              try { return decodeURIComponent(escape(file.fileName)); } 
                              catch (e) { return file.fileName; }
                            })()}
                          </p>
                          <p className="text-gray-500 text-xs">{(file.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <span className="text-teal-400 text-sm">↓</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-8 pt-6 border-t border-white/10">
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;