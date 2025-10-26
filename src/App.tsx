"use client"

import { useState } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login"
import Home from "./pages/Home"
import "./App.css"

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleLogin = (username: string, password: string): boolean => {
    // Mock authentication - accept any username with password "password123"
    if (password === "password123") {
      setIsAuthenticated(true)
      return true
    }
    return false
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/home" replace /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/home"
          element={isAuthenticated ? <Home onLogout={handleLogout} /> : <Navigate to="/login" replace />}
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
