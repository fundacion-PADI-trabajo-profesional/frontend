import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { adminCreateUser } from "../api/auth";

interface DocenteFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const emptyForm = {
  nombre: "",
  apellido: "",
  email: "",
};

export default function DocenteForm({ open, onClose, onSuccess }: DocenteFormProps) {
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleClose = () => {
    setFormData(emptyForm);
    setError("");
    setSuccess("");
    onClose();
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!formData.nombre.trim() || !formData.apellido.trim() || !formData.email.trim()) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("El formato del email no es válido.");
      return;
    }

    setLoading(true);
    try {
      await adminCreateUser({
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        rol: "docente", 
      });

      setSuccess(`Docente ${formData.nombre} ${formData.apellido} creado. Se envió un correo con la invitación.`);
      setFormData(emptyForm);
      onSuccess(); 
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (err: any) {
      setError(err.message || "No se pudo crear el docente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700 }}>
        <PersonAddIcon sx={{ color: "#65944F" }} />
        Crear nuevo docente
        <IconButton onClick={handleClose} sx={{ ml: "auto" }} disabled={loading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            label="Nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            disabled={loading}
          />
          <TextField
            label="Apellido"
            value={formData.apellido}
            onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            disabled={loading}
          />
        </Box>

        <TextField
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          fullWidth
          size="small"
          sx={{ mb: 1 }}
          disabled={loading}
        />

        <Typography variant="caption" color="#888" sx={{ display: "block", mt: 1 }}>
          El docente recibirá un email con un enlace para establecer su contraseña e ingresar al sistema.
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={handleClose} sx={{ textTransform: "none", color: "#666" }} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
          sx={{
            bgcolor: "#65944F",
            textTransform: "none",
            borderRadius: 2,
            "&:hover": { bgcolor: "#558040" },
          }}
        >
          {loading ? "Creando..." : "Crear docente"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}