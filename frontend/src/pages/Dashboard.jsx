const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Task Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Add New Task</h3>
            <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
              + Add Task
            </button>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">My Tasks</h3>
            <p className="text-gray-400">No tasks yet</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Statistics</h3>
            <p className="text-gray-400">0 completed / 0 total</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;