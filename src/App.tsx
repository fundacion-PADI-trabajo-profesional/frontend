"use client"

import { useState, useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login"
import Home from "./pages/Home"
import Evaluaciones from "./pages/Evaluaciones"
import Estudiantes from "./pages/Estudiantes"
import HistorialEstudiante from "./pages/HistorialEstudiante"
import EvaluacionesDocente from "./pages/EvaluacionesDocente"
import DocentesPage from "./pages/Docentes"
import EncargadosZona from "./pages/EncargadosZona";
import "./App.css" //
import Escuelas from "./pages/Escuelas"
import AulasPage from "./pages/Aulas"
import Zonas from "./pages/Zonas"
import ZonaDetalle from "./pages/ZonaDetalle"
import PanelControl from "./pages/PanelControl"
import ActualizarContrasena from "./pages/ActualizarContrasena"
import CambiarContrasenaTemporal from "./pages/CambiarContrasenaTemporal"
import GestionUsuariosPage from "./pages/GestionUsuariosPage"

// Define a type for your user object
interface User {
  id: string
  email: string
  nombre: string
  apellido: string
  rol: "docente" | "director" | "encargado_zona" | "equipo_padi"
}

function App() {
  // State holds the full user object or null if not logged in
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("padiUser")
    try {
      return storedUser ? JSON.parse(storedUser) : null
    } catch {
      return null
    }
  })

  // This effect syncs the state with localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("padiUser", JSON.stringify(currentUser))
    } else {
      localStorage.removeItem("padiUser")
    }
  }, [currentUser])

  // This function will be passed to Login.tsx
  const handleLogin = (user: User) => {
    setCurrentUser(user)
  }

  // This function will be passed to Home.tsx
  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("padiProfile")
    localStorage.removeItem("userRole")
    setCurrentUser(null)
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={currentUser ? <Navigate to="/home" replace /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/home"
          element={currentUser ? <Home onLogout={handleLogout} /> : <Navigate to="/login" replace />}
        />
        {/* Rutas Protegidas */}
        <Route path="/evaluaciones" element={currentUser ? <Evaluaciones /> : <Navigate to="/login" replace />} />
        <Route path="/estudiantes" element={currentUser ? <Estudiantes /> : <Navigate to="/login" replace />} />
        <Route path="/historial-estudiante" element={currentUser ? <HistorialEstudiante /> : <Navigate to="/login" replace />} />
        <Route path="/evaluaciones-docente" element={currentUser ? <EvaluacionesDocente /> : <Navigate to="/login" replace />} />
        <Route path="/docentes" element={currentUser ? <DocentesPage /> : <Navigate to="/login" replace />} />
        <Route path="/aulas" element={currentUser ? <AulasPage /> : <Navigate to="/login" replace />} />
        <Route path="/panel-control" element={currentUser ? <PanelControl /> : <Navigate to="/login" replace />} />

        {/* Rutas de Gestión (Ahora protegidas) */}
        <Route path="/zonas" element={currentUser ? <Zonas /> : <Navigate to="/login" replace />} />
        <Route path="/zonas/:id" element={currentUser ? <ZonaDetalle /> : <Navigate to="/login" replace />} />
        <Route path="/escuelas" element={currentUser ? <Escuelas /> : <Navigate to="/login" replace />} />
        <Route path="/encargados-zonas" element={currentUser ? <EncargadosZona /> : <Navigate to="/login" replace />} />

        {/* Ruta exclusiva equipo_padi */}
        <Route
          path="/usuarios"
          element={
            !currentUser
              ? <Navigate to="/login" replace />
              : currentUser.rol !== "equipo_padi"
                ? <Navigate to="/home" replace />
                : <GestionUsuariosPage />
          }
        />

        {/* Cambio de contraseña temporal (primer login) — accesible solo con token activo */}
        <Route path="/cambiar-contrasena-temporal" element={<CambiarContrasenaTemporal />} />

        {/* Registro: solo redirige a home si ya está logueado; de lo contrario bloquea */}
        <Route path="*" element={<Navigate to={currentUser ? "/home" : "/login"} replace />} />
        <Route path="/actualizar-password" element={<ActualizarContrasena />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
