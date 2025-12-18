import React from 'react';

const AdminPanel = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-md">
          <div>
            <h1 className="text-3xl font-bold text-red-600">Admin Yönetim Paneli</h1>
            <p className="text-gray-600 mt-1">Sistemdeki tüm görevleri ve kullanıcıları buradan yönetebilirsiniz.</p>
          </div>
          <button 
            onClick={() => { localStorage.removeItem("token"); window.location.href = "/"; }}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition"
          >
            Güvenli Çıkış
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* İstatistik Özetleri (Madde 7 İçin Hazırlık) */}
          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
            <h3 className="text-gray-500 text-sm font-medium uppercase">Toplam Görev</h3>
            <p className="text-2xl font-bold">--</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
            <h3 className="text-gray-500 text-sm font-medium uppercase">Tamamlanan</h3>
            <p className="text-2xl font-bold">--</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500">
            <h3 className="text-gray-500 text-sm font-medium uppercase">Bekleyen</h3>
            <p className="text-2xl font-bold">--</p>
          </div>
        </div>

        <div className="mt-8 bg-white p-6 rounded-xl shadow-md text-center py-20">
          <p className="text-gray-400 italic">
            Tüm görevlerin listesi ve "Kullanıcıya Görev Atama" modülü buraya eklenecek. [cite: 73, 81]
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;