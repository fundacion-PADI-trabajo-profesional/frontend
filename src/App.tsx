import { useState, useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login"
import Home from "./pages/Home"
import Evaluaciones from "./pages/Evaluaciones"
import Estudiantes from "./pages/Estudiantes"
import HistorialEstudiante from "./pages/HistorialEstudiante"
import EvaluacionesDocente from "./pages/EvaluacionesDocente"
import DocentesPage from "./pages/Docentes"
import "./App.css" //
import Escuelas from "./pages/Escuelas"
import AulasPage from "./pages/Aulas"
import PanelControl from "./pages/PanelControl"
import ActualizarContrasena from "./pages/auth/ActualizarContrasena"
import SolicitarRecuperoPassword from "./pages/auth/SolicitarRecuperoPassword"
import CambiarContrasenaTemporal from "./pages/auth/CambiarContrasenaTemporal"
import GestionUsuariosPage from "./pages/GestionUsuariosPage"
import EstadisticasPadi from "./pages/estadisticas/EstadisticasPadi"
import EstadisticasZona from "./pages/estadisticas/EstadisticasZona"
import EstadisticasEscuela from "./pages/estadisticas/EstadisticasEscuela"
import EstadisticasDocente from "./pages/estadisticas/EstadisticasDocente"

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
        <Route path="/escuelas" element={currentUser ? <Escuelas /> : <Navigate to="/login" replace />} />

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

        {/* Estadísticas por rol */}
        <Route
          path="/estadisticas/padi"
          element={
            !currentUser
              ? <Navigate to="/login" replace />
              : currentUser.rol !== "equipo_padi"
                ? <Navigate to="/home" replace />
                : <EstadisticasPadi />
          }
        />
        <Route
          path="/estadisticas/zona"
          element={
            !currentUser
              ? <Navigate to="/login" replace />
              : currentUser.rol !== "encargado_zona"
                ? <Navigate to="/home" replace />
                : <EstadisticasZona />
          }
        />
        <Route
          path="/estadisticas/escuela"
          element={
            !currentUser
              ? <Navigate to="/login" replace />
              : !["director", "encargado_zona", "equipo_padi"].includes(currentUser.rol)
                ? <Navigate to="/home" replace />
                : <EstadisticasEscuela />
          }
        />
        <Route
          path="/estadisticas/docente"
          element={
            !currentUser
              ? <Navigate to="/login" replace />
              : <EstadisticasDocente />
          }
        />

        {/* Cambio de contraseña temporal (primer login) — accesible solo con token activo */}
        <Route path="/cambiar-contrasena-temporal" element={<CambiarContrasenaTemporal />} />

        {/* Flujo de recuperación de contraseña — rutas públicas */}
        <Route path="/recuperar-password" element={<SolicitarRecuperoPassword />} />
        <Route path="/actualizar-password" element={<ActualizarContrasena />} />

        {/* Registro: solo redirige a home si ya está logueado; de lo contrario bloquea */}
        <Route path="*" element={<Navigate to={currentUser ? "/home" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
