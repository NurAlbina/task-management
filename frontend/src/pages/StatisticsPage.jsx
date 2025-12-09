
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Chart.js kayıt
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// Kategori bilgileri (emoji ve renkler)
const categoryConfig = {
  Work: { emoji: '💼', color: 'rgba(59, 130, 246, 0.8)', border: 'rgba(59, 130, 246, 1)', gradient: 'from-blue-500 to-blue-600' },
  Personal: { emoji: '👤', color: 'rgba(168, 85, 247, 0.8)', border: 'rgba(168, 85, 247, 1)', gradient: 'from-purple-500 to-purple-600' },
  Shopping: { emoji: '🛒', color: 'rgba(236, 72, 153, 0.8)', border: 'rgba(236, 72, 153, 1)', gradient: 'from-pink-500 to-pink-600' },
  Health: { emoji: '❤️', color: 'rgba(239, 68, 68, 0.8)', border: 'rgba(239, 68, 68, 1)', gradient: 'from-red-500 to-red-600' },
  Other: { emoji: '📌', color: 'rgba(107, 114, 128, 0.8)', border: 'rgba(107, 114, 128, 1)', gradient: 'from-gray-500 to-gray-600' }
};

const StatisticsPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Grafik referansları (indirme için)
  const pieChartRef = useRef(null);
  const barChartRef = useRef(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Görevler yüklenirken hata:', error);
      setLoading(false);
    }
  };

  // İstatistikleri hesapla
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;

  // Kategorilere göre görev sayısı
  const categoryStats = tasks.reduce((acc, task) => {
    acc[task.category] = (acc[task.category] || 0) + 1;
    return acc;
  }, {});

  // Tamamlanma yüzdesi
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Pie Chart verisi (Kategorilere göre - categoryConfig'den renkler alınıyor)
  const categories = Object.keys(categoryStats);
  const pieChartData = {
    labels: categories,
    datasets: [
      {
        data: Object.values(categoryStats),
        backgroundColor: categories.map(cat => categoryConfig[cat]?.color || 'rgba(107, 114, 128, 0.8)'),
        borderColor: categories.map(cat => categoryConfig[cat]?.border || 'rgba(107, 114, 128, 1)'),
        borderWidth: 2,
      },
    ],
  };

  // Bar Chart verisi (Durumlara göre)
  const barChartData = {
    labels: ['Pending', 'In Progress', 'Completed'],
    datasets: [
      {
        label: 'Tasks',
        data: [pendingTasks, inProgressTasks, completedTasks],
        backgroundColor: [
          'rgba(234, 179, 8, 0.8)',    // yellow - Pending
          'rgba(59, 130, 246, 0.8)',   // blue - In Progress
          'rgba(34, 197, 94, 0.8)',    // green - Completed
        ],
        borderColor: [
          'rgba(234, 179, 8, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(34, 197, 94, 1)',
        ],
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  // Chart options
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#9ca3af',
          padding: 20,
          font: { size: 12 }
        }
      },
      title: {
        display: true,
        text: 'Tasks by Category',
        color: '#5eead4',
        font: { size: 16, weight: 'bold' }
      }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Tasks by Status',
        color: '#5eead4',
        font: { size: 16, weight: 'bold' }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { 
          color: '#9ca3af',
          stepSize: 1
        },
        grid: { color: 'rgba(255,255,255,0.1)' }
      },
      x: {
        ticks: { color: '#9ca3af' },
        grid: { display: false }
      }
    }
  };

  // Grafikleri PNG olarak indir
  const downloadChart = (chartRef, filename) => {
    const chart = chartRef.current;
    if (chart) {
      const url = chart.toBase64Image();
      const link = document.createElement('a');
      link.download = filename;
      link.href = url;
      link.click();
    }
  };

  // Tüm grafikleri tek resimde indir
  const downloadAllCharts = () => {
    const pieChart = pieChartRef.current;
    const barChart = barChartRef.current;
    
    if (!pieChart || !barChart) return;
    
    // Orijinal chart boyutlarını al
    const pieCanvas = pieChart.canvas;
    const barCanvas = barChart.canvas;
    
    // Hedef boyutlar - orijinal oranları koru
    const pieWidth = 500;
    const pieHeight = Math.round(pieWidth * (pieCanvas.height / pieCanvas.width));
    const barWidth = 550;
    const barHeight = Math.round(barWidth * (barCanvas.height / barCanvas.width));
    
    // Canvas boyutu hesapla
    const padding = 60;
    const headerHeight = 100;
    const statsHeight = 180;
    const maxChartHeight = Math.max(pieHeight, barHeight);
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = padding + pieWidth + 80 + barWidth + padding;
    canvas.height = headerHeight + maxChartHeight + statsHeight + padding;
    
    // Arkaplan
    ctx.fillStyle = '#0a192f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Başlık
    ctx.fillStyle = '#5eead4';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Task Statistics Report', canvas.width / 2, 45);
    
    // Alt başlık (tarih)
    ctx.fillStyle = '#9ca3af';
    ctx.font = '14px Arial';
    ctx.fillText(`Generated: ${new Date().toLocaleDateString('tr-TR')}`, canvas.width / 2, 75);
    
    // Pie Chart - orijinal oranıyla
    const pieImage = new Image();
    pieImage.src = pieChart.toBase64Image();
    pieImage.onload = () => {
      ctx.drawImage(pieImage, padding, headerHeight, pieWidth, pieHeight);
      
      // Bar Chart - orijinal oranıyla
      const barImage = new Image();
      barImage.src = barChart.toBase64Image();
      barImage.onload = () => {
        ctx.drawImage(barImage, padding + pieWidth + 80, headerHeight, barWidth, barHeight);
        
        // İstatistik kutuları
        const boxY = headerHeight + maxChartHeight + 30;
        const boxHeight = 70;
        const boxWidth = 150;
        const totalBoxWidth = 4 * boxWidth + 3 * 20;
        const startX = (canvas.width - totalBoxWidth) / 2;
        
        const stats = [
          { label: 'Total', value: totalTasks, color: '#ffffff' },
          { label: 'Completed', value: completedTasks, color: '#22c55e' },
          { label: 'In Progress', value: inProgressTasks, color: '#3b82f6' },
          { label: 'Pending', value: pendingTasks, color: '#eab308' }
        ];
        
        stats.forEach((stat, i) => {
          const x = startX + i * (boxWidth + 20);
          
          ctx.fillStyle = '#112240';
          ctx.beginPath();
          ctx.roundRect(x, boxY, boxWidth, boxHeight, 8);
          ctx.fill();
          
          ctx.strokeStyle = 'rgba(255,255,255,0.1)';
          ctx.stroke();
          
          ctx.fillStyle = '#9ca3af';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(stat.label, x + boxWidth/2, boxY + 24);
          
          ctx.fillStyle = stat.color;
          ctx.font = 'bold 24px Arial';
          ctx.fillText(stat.value.toString(), x + boxWidth/2, boxY + 52);
        });
        
        // Tamamlanma oranı
        const rateY = boxY + boxHeight + 25;
        ctx.fillStyle = '#5eead4';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Completion Rate: ${completionRate}%`, canvas.width / 2, rateY);
        
        // Progress bar
        const barPosX = startX;
        const barPosY = rateY + 15;
        const progressBarWidth = totalBoxWidth;
        const progressBarHeight = 10;
        
        ctx.fillStyle = '#374151';
        ctx.beginPath();
        ctx.roundRect(barPosX, barPosY, progressBarWidth, progressBarHeight, 5);
        ctx.fill();
        
        if (completionRate > 0) {
          const gradient = ctx.createLinearGradient(barPosX, 0, barPosX + progressBarWidth, 0);
          gradient.addColorStop(0, '#14b8a6');
          gradient.addColorStop(1, '#22c55e');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(barPosX, barPosY, progressBarWidth * (completionRate / 100), progressBarHeight, 5);
          ctx.fill();
        }
        
        // İndir
        const link = document.createElement('a');
        link.download = 'task-statistics-report.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      };
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a192f]">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a192f]">
      <Navbar />
      
      <div className="container mx-auto px-6 py-10">
        {/* Sayfa başlığı */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-200 to-teal-400">
              Statistics
            </h1>
            <p className="text-gray-400 mt-2">Overview of your task performance</p>
          </div>
          
          {/* İndirme butonu */}
          <button
            onClick={downloadAllCharts}
            className="px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white rounded-xl transition-all font-medium flex items-center gap-2"
          >
            Download Report
          </button>
        </div>

        {/* Üst istatistik kartları */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {/* Toplam görev */}
          <div className="bg-gradient-to-br from-[#112240] to-[#0a192f] border border-white/10 rounded-2xl p-6">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-gray-400 text-sm">Total Tasks</p>
            <p className="text-3xl font-bold text-white">{totalTasks}</p>
          </div>

          {/* Tamamlanan */}
          <div className="bg-gradient-to-br from-[#112240] to-[#0a192f] border border-green-500/20 rounded-2xl p-6">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-gray-400 text-sm">Completed</p>
            <p className="text-3xl font-bold text-green-400">{completedTasks}</p>
          </div>

          {/* Devam eden */}
          <div className="bg-gradient-to-br from-[#112240] to-[#0a192f] border border-blue-500/20 rounded-2xl p-6">
            <div className="text-4xl mb-2">🔄️</div>
            <p className="text-gray-400 text-sm">In Progress</p>
            <p className="text-3xl font-bold text-blue-400">{inProgressTasks}</p>
          </div>

          {/* Bekleyen */}
          <div className="bg-gradient-to-br from-[#112240] to-[#0a192f] border border-yellow-500/20 rounded-2xl p-6">
            <div className="text-4xl mb-2">⏳</div>
            <p className="text-gray-400 text-sm">Pending</p>
            <p className="text-3xl font-bold text-yellow-400">{pendingTasks}</p>
          </div>
        </div>

        {/* Grafikler */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Pie Chart - Kategorilere göre */}
          <div className="bg-gradient-to-br from-[#112240] to-[#0a192f] border border-white/10 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-teal-200">Category Distribution</h3>
              <button
                onClick={() => downloadChart(pieChartRef, 'category-chart.png')}
                className="text-gray-400 hover:text-teal-300 transition-all text-sm"
              >
                Download
              </button>
            </div>
            <div className="h-80">
              {totalTasks > 0 ? (
                <Pie ref={pieChartRef} data={pieChartData} options={pieOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No tasks to display
                </div>
              )}
            </div>
          </div>

          {/* Bar Chart - Durumlara göre */}
          <div className="bg-gradient-to-br from-[#112240] to-[#0a192f] border border-white/10 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-teal-200">Status Overview</h3>
              <button
                onClick={() => downloadChart(barChartRef, 'status-chart.png')}
                className="text-gray-400 hover:text-teal-300 transition-all text-sm"
              >
                Download
              </button>
            </div>
            <div className="h-80">
              {totalTasks > 0 ? (
                <Bar ref={barChartRef} data={barChartData} options={barOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No tasks to display
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Alt bölüm -> detaylı istatistikler */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Tamamlanma oranı */}
          <div className="bg-gradient-to-br from-[#112240] to-[#0a192f] border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-teal-200 mb-4">Completion Rate</h3>
            
            {/* İlerleme çubuğu */}
            <div className="relative pt-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Progress</span>
                <span className="text-2xl font-bold text-white">{completionRate}%</span>
              </div>
              <div className="overflow-hidden h-4 rounded-full bg-gray-700">
                <div
                  style={{ width: `${completionRate}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-green-500 transition-all duration-500"
                ></div>
              </div>
            </div>

            <p className="text-gray-500 text-sm mt-4">
              {completedTasks} of {totalTasks} tasks completed
            </p>
          </div>

          {/* Kategorilere göre dağılım listesi */}
          <div className="bg-gradient-to-br from-[#112240] to-[#0a192f] border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-teal-200 mb-4">Tasks by Category</h3>
            
            <div className="space-y-3">
              {Object.entries(categoryStats).map(([category, count]) => {
                const percentage = Math.round((count / totalTasks) * 100);
                const config = categoryConfig[category] || categoryConfig.Other;

                return (
                  <div key={category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">
                        <span className="mr-2">{config.emoji}</span>
                        {category}
                      </span>
                      <span className="text-gray-400">{count} ({percentage}%)</span>
                    </div>
                    <div className="overflow-hidden h-2 rounded-full bg-gray-700">
                      <div
                        style={{ width: `${percentage}%` }}
                        className={`h-full rounded-full bg-gradient-to-r ${config.gradient} transition-all duration-500`}
                      ></div>
                    </div>
                  </div>
                );
              })}

              {Object.keys(categoryStats).length === 0 && (
                <p className="text-gray-500 text-center py-4">No tasks yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;
