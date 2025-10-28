"use client"

import { useState, useEffect, type FormEvent } from "react"
import {
  Modal,
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  Alert,
  CircularProgress,
  InputAdornment,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import PersonOutlineIcon from "@mui/icons-material/PersonOutline"
import EditIcon from "@mui/icons-material/Edit"
import SaveIcon from "@mui/icons-material/Save"
import { supabase } from "../api/auth" // Asegúrate que la ruta sea correcta

// Estilo para el Modal
const modalStyle = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "90%",
  maxWidth: 500,
  bgcolor: "background.paper",
  borderRadius: 3,
  boxShadow: 24,
  p: { xs: 3, md: 4 },
  outline: "none",
}

// <-- CAMBIO: Nombre de la interfaz de Props
interface PerfilProps {
  open: boolean
  onClose: () => void
  user: any // Auth user (email, id, user_metadata)
  profile: any // Datos de la tabla 'usuarios' (nombre, apellido)
  onUpdateSuccess: () => void
}

// <-- CAMBIO: Nombre del componente
export default function Perfil({
  open,
  onClose,
  user,
  profile,
  onUpdateSuccess,
}: PerfilProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [rol, setRol] = useState("")

  // Cargar datos en el formulario
  useEffect(() => {
    if (profile) {
      setNombre(profile.nombre || "")
      setApellido(profile.apellido || "")
      setRol(profile.rol || "")

    } else {
      setNombre("")
      setApellido("")
      setRol("")
    }
    setError("")
    setSuccess("")
    setIsEditing(false)
  }, [user, profile, open])

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const { data, error } = await supabase
        .from("usuarios") // <-- CAMBIO: Nombre de tu tabla
        .update({ nombre: nombre, apellido: apellido })
        .eq("email", user.email) // Usa la columna que linkea las tablas

      setLoading(false)
      if (error) {
        throw error
      }

      setSuccess("¡Perfil actualizado con éxito!")
      setIsEditing(false)
      onUpdateSuccess() // Refresca los datos en Home
      onClose() // Cierra el modal
    } catch (err: any) {
      setLoading(false)
      setError("Error al actualizar el perfil: " + err.message)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setError("")
    setSuccess("")
    if (profile) {
      setNombre(profile.nombre || "")
      setApellido(profile.apellido || "")
    }
  }

  const handleClose = () => {
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={modalStyle}>
        <IconButton
          onClick={handleClose}
          sx={{ position: "absolute", top: 8, right: 8 }}
        >
          <CloseIcon />
        </IconButton>

        <Typography variant="h4" component="h2" sx={{ mb: 3 }}>
          Mi Perfil
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {!isEditing ? (
          // --- MODO VISTA ---
          <Box>
            <Typography variant="body1" sx={{ fontSize: "1.1rem", mb: 1.5 }}>
              <strong>Email:</strong> {user?.email}
            </Typography>
            <Typography variant="body1" sx={{ fontSize: "1.1rem", mb: 1.5 }}>
              <strong>Nombre:</strong> {profile?.nombre || "No especificado"}
            </Typography>
            <Typography variant="body1" sx={{ fontSize: "1.1rem", mb: 1.5 }}>
              <strong>Apellido:</strong> {profile?.apellido || "No especificado"}
            </Typography>
            <Typography
              variant="body1"
              sx={{ fontSize: "1.1rem", mb: 3, textTransform: "capitalize" }}
            >
              <strong>Rol:</strong>{" "}
              {profile?.rol || "No especificado"}
            </Typography>

            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => setIsEditing(true)}
              sx={{
                bgcolor: "#A3BE54",
                color: "#000",
                "&:hover": { bgcolor: "#8bc34a" },
              }}
            >
              Editar Perfil
            </Button>
          </Box>
        ) : (
          // --- MODO EDICIÓN ---
          <form onSubmit={handleUpdate}>
            <TextField
              fullWidth
              label="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineIcon />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Apellido"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineIcon />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Email"
              value={user?.email || ""}
              disabled
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Rol"
              value={rol}
              disabled
              sx={{ mb: 3, textTransform: "capitalize" }}
            />

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
              <Button onClick={handleCancel} color="secondary" variant="outlined">
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={
                  loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <SaveIcon />
                  )
                }
                disabled={loading}
                sx={{
                  bgcolor: "#A3BE54",
                  color: "#000",
                  "&:hover": { bgcolor: "#8bc34a" },
                }}
              >
                Guardar Cambios
              </Button>
            </Box>
          </form>
        )}
      </Box>
    </Modal>
  )
}