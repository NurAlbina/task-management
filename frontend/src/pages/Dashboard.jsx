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

  // Görev durumunu değiştir
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
      Work: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      Personal: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      Shopping: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      Health: 'bg-red-500/20 text-red-300 border-red-500/30',
      Other: 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    };
    return colors[category] || colors.Other;
  };

  // Durum renkleri
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'in-progress': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      completed: 'bg-green-500/20 text-green-300 border-green-500/30'
    };
    return colors[status] || colors.pending;
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
    <div className="min-h-screen bg-[#0a192f]">
      <Navbar />
      
      <div className="container mx-auto px-6 py-10">
        {/* Sayfa başlığı - Welcome back kısmı */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-200 to-teal-400">
              My Tasks
            </h1>
            <p className="text-gray-400 mt-2">Welcome back, {userName}</p>
          </div>
          <div className="text-gray-400">
            {completedTasks} / {totalTasks} completed
          </div>
        </div>

        {/* Hata mesajı */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Görev Listesi */}
        {tasks.length === 0 ? (
          <div className="bg-[#112240] border border-white/10 rounded-2xl p-12 text-center">
            <p className="text-gray-400 text-lg mb-4">No tasks yet</p>
            <Link
              to="/add-task"
              className="inline-block px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white rounded-xl transition-all"
            >
              Create Your First Task
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Görevler burada listelenir */}
            {tasks.map(task => (
              <div 
                key={task._id} 
                className={`bg-[#112240] border rounded-2xl p-6 transition-all hover:border-teal-500/30 ${
                  task.status === 'completed' ? 'border-green-500/20' : 'border-white/10'
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  {/* Sol Taraf - Görev Bilgileri */}
                  <div className="flex-1">
                    <h3 className={`text-xl font-semibold mb-2 ${
                      task.status === 'completed' ? 'line-through text-gray-500' : 'text-white'
                    }`}>
                      {task.title}
                    </h3>
                    
                    {task.description && (
                      <p className="text-gray-400 mb-3">{task.description}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-2">
                      {/* Kategori Badge */}
                      <span className={`px-3 py-1 rounded-full text-sm border ${getCategoryColor(task.category)}`}>
                        {task.category}
                      </span>
                      
                      {/* Durum Badge */}
                      <span className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                      
                      {/* Tarih Badge */}
                      {task.dueDate && (
                        <span className="px-3 py-1 rounded-full text-sm bg-white/5 text-gray-400 border border-white/10">
                          {new Date(task.dueDate).toLocaleDateString('tr-TR')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sağ Taraf - Aksiyon Butonları */}
                  <div className="flex gap-2">
                    {/* Pending ise Start butonu göster */}
                    {task.status === 'pending' && (
                      <button
                        onClick={() => handleChangeStatus(task, 'in-progress')}
                        className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all"
                      >
                        Start
                      </button>
                    )}
                    
                    {/* In-progress ise Done butonu göster */}
                    {task.status === 'in-progress' && (
                      <button
                        onClick={() => handleChangeStatus(task, 'completed')}
                        className="px-4 py-2 rounded-xl text-sm font-medium bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-all"
                      >
                        Done
                      </button>
                    )}
                    
                    {/* Completed ise Undo butonu göster */}
                    {task.status === 'completed' && (
                      <button
                        onClick={() => handleChangeStatus(task, 'pending')}
                        className="px-4 py-2 rounded-xl text-sm font-medium bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 transition-all"
                      >
                        Undo
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleEditClick(task)}
                      className="px-4 py-2 rounded-xl text-sm font-medium bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 transition-all"
                    >
                      Edit
                    </button>
                    
                    <button
                      onClick={() => handleDeleteTask(task._id)}
                      className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;