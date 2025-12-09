import { Link, useLocation, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation(); // Hangi sayfadayız kontrol için
  const navigate = useNavigate();

  // Çıkış yap
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Aktif sayfa kontrolü 
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-[#0a192f]/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          
          {/* Logo */}
          <Link to="/dashboard" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-200 to-teal-400">
            Task Management
          </Link>

          {/* Menü Linkleri */}
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                isActive('/dashboard')
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              📋 Tasks
            </Link>

            <Link
              to="/add-task"
              className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                isActive('/add-task')
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              ➕ Add Task
            </Link>

            <Link
              to="/statistics"
              className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                isActive('/statistics')
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              📊 Statistics
            </Link>

            {/* Çıkış Butonu */}
            <button
              onClick={handleLogout}
              className="ml-4 px-4 py-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-red-300 border border-red-500/30 transition-all duration-300"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;