import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-5xl font-bold text-center mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Task Management System
        </h1>
        <div className="max-w-md mx-auto bg-gray-800 rounded-lg shadow-xl p-6">
          <p className="text-gray-300 text-center">
            Welcome to your task management application
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
