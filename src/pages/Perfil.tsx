// src/pages/Perfil.tsx
import { useState, useEffect } from "react";
import {
  Modal,
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  Avatar,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  InputAdornment
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import SchoolIcon from "@mui/icons-material/School";
import EmailIcon from "@mui/icons-material/Email";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import SaveIcon from "@mui/icons-material/Save";
import { updateProfileData } from "../api/auth";

const modalStyle = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "95%",
  maxWidth: 420,
  bgcolor: "#fff",
  borderRadius: 6,
  boxShadow: "0 24px 48px rgba(0,0,0,0.12)",
  p: 0,
  outline: "none",
  overflow: "hidden"
};

// Paleta PADI oficial
const PADI_COLORS = {
  verde: "#b5d663",
  azul: "#01a5de",
  gris: "#868789",
  naranja: "#fd7e14"
};

const ROLE_MAP: Record<string, { label: string; icon: string }> = {
  docente: { label: "Docente", icon: "👩‍🏫" },
  equipo_padi: { label: "Equipo PADI", icon: "🤝" },
  director: { label: "Director/a", icon: "🎓" },
  encargado_zona: { label: "Encargado de Zona", icon: "📍" },
};

interface PerfilProps {
  open: boolean;
  onClose: () => void;
  user: any;
  profile: any;
  onUpdateSuccess?: (newData: any) => Promise<void>;
}

export default function Perfil({ open, onClose, user, profile, onUpdateSuccess }: PerfilProps) {
  // Estados para la edición
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados del formulario
  const [nombre, setNombre] = useState(profile?.nombre || "");
  const [apellido, setApellido] = useState(profile?.apellido || "");

  // Sincronizar estados si el profile cambia
  useEffect(() => {
    setNombre(profile?.nombre || "");
    setApellido(profile?.apellido || "");
  }, [profile]);

  const rolData = ROLE_MAP[profile?.rol] || { label: profile?.rol, icon: "👤" };

  // Datos jerárquicos solicitados: Usuario -> Escuela -> Zona
  const nombreEscuela = profile?.escuela?.nombre || profile?.escuelas?.[0]?.nombre || "Escuela no asignada";
  // const nombreZona = profile?.escuela?.zona?.nombre || profile?.escuelas?.[0]?.zona || "Zona no definida";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {

      const response = await updateProfileData(user.id, nombre, apellido);

      if (onUpdateSuccess && response.profile) {
        await onUpdateSuccess(response.profile);
      }
      
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "Error al actualizar los datos");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setNombre(profile?.nombre || "");
    setApellido(profile?.apellido || "");
    setIsEditing(false);
    setError(null);
  };

  return (
    <Modal open={open} onClose={loading ? undefined : onClose}>
      <Box sx={modalStyle}>
        {/* HEADER: Azul PADI */}
        <Box sx={{
          bgcolor: PADI_COLORS.azul,
          pt: 6, pb: 4, px: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative'
        }}>
          {!loading && (
            <IconButton onClick={onClose} sx={{ position: 'absolute', right: 16, top: 16, color: '#fff' }}>
              <CloseIcon />
            </IconButton>
          )}

          <Avatar sx={{
            width: 110, height: 110,
            bgcolor: '#fff',
            color: PADI_COLORS.azul,
            boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
            fontSize: '2.8rem', mb: 2,
            border: `4px solid ${PADI_COLORS.verde}` // Borde Verde PADI
          }}>
            {nombre?.[0]}{apellido?.[0]}
          </Avatar>

          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, mb: 1, textAlign: 'center' }}>
            {nombre} {apellido}
          </Typography>

          <Chip
            label={`${rolData.icon} ${rolData.label}`}
            sx={{
              bgcolor: 'rgba(255,255,255,0.95)',
              color: PADI_COLORS.gris,
              fontWeight: 700,
              px: 1
            }}
          />
        </Box>

        <Box sx={{ p: 4 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {isEditing ? (
            <Box component="form" onSubmit={handleSave}>
              <Typography variant="subtitle2" sx={{ mb: 2, color: PADI_COLORS.gris, fontWeight: 700 }}>
                EDITAR INFORMACIÓN PERSONAL
              </Typography>

              {/* Campo de Email - Solo lectura */}
              <TextField
                fullWidth
                label="Email institucional"
                variant="outlined"
                size="small"
                value={user?.email} //
                disabled
                sx={{
                  mb: 2,
                  "& .MuiInputBase-input.Mui-disabled": {
                    WebkitTextFillColor: PADI_COLORS.gris,
                  },
                  "& .MuiInputLabel-root.Mui-disabled": {
                    color: PADI_COLORS.gris,
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: PADI_COLORS.gris }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Nombre"
                variant="outlined"
                size="small"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                sx={{ mb: 2 }}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon sx={{ color: PADI_COLORS.azul }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Apellido"
                variant="outlined"
                size="small"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                sx={{ mb: 3 }}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon sx={{ color: PADI_COLORS.azul }} />
                    </InputAdornment>
                  ),
                }}
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleCancel}
                  disabled={loading}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                >
                  Cancelar
                </Button>
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  sx={{
                    bgcolor: PADI_COLORS.azul,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 700,
                    '&:hover': { bgcolor: '#018bc1' }
                  }}
                >
                  {loading ? "Guardando..." : "Guardar"}
                </Button>
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Email */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#f1f3f5' }}>
                  <EmailIcon sx={{ color: PADI_COLORS.gris }} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: PADI_COLORS.gris, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Email institucional
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: '#333' }}>
                    {user?.email}
                  </Typography>
                </Box>
              </Box>

              <Divider />

              {/* Zona Geográfica
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#eefaf0' }}>
                  <PublicIcon sx={{ color: PADI_COLORS.verde }} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: PADI_COLORS.gris, fontWeight: 700, textTransform: 'uppercase' }}>
                    Zona Geográfica
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#444' }}>
                    📍 {nombreZona}
                  </Typography>
                </Box>
              </Box> */}

              {/* Escuela */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#fff4e6' }}>
                  <SchoolIcon sx={{ color: PADI_COLORS.naranja }} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: PADI_COLORS.gris, fontWeight: 700, textTransform: 'uppercase' }}>
                    Institución
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: PADI_COLORS.naranja }}>
                    {nombreEscuela}
                  </Typography>
                </Box>
              </Box>

              <Button
                fullWidth
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => setIsEditing(true)}
                sx={{
                  mt: 2, py: 1.5, borderRadius: 3, fontWeight: 700, textTransform: 'none',
                  bgcolor: PADI_COLORS.verde,
                  "&:hover": { bgcolor: '#a4c452' },
                  boxShadow: `0 4px 14px ${PADI_COLORS.verde}44`
                }}
              >
                Editar Perfil
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </Modal>
  );
}