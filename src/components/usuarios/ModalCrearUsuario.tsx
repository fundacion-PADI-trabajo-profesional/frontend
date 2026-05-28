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
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { adminCreateUser, type CreateUserPayload } from "../../api/auth";
import { ROLES } from "./types";

const emptyForm: CreateUserPayload = { nombre: "", apellido: "", email: "", rol: "" };

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function ModalCrearUsuario({ open, onClose, onCreated }: Props) {
  const [formData, setFormData] = useState<CreateUserPayload>(emptyForm);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState("");

  const handleClose = () => {
    setFormData(emptyForm);
    setFormError("");
    setFormSuccess("");
    onClose();
  };

  const handleSubmit = async () => {
    setFormError("");
    setFormSuccess("");

    if (!formData.nombre.trim() || !formData.apellido.trim() || !formData.email.trim() || !formData.rol) {
      setFormError("Todos los campos son obligatorios.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError("El formato del email no es válido.");
      return;
    }

    setFormLoading(true);
    try {
      await adminCreateUser(formData);
      setFormSuccess(`Usuario ${formData.nombre} ${formData.apellido} creado. Se envió un correo con la invitación.`);
      setFormData(emptyForm);
      onCreated();
    } catch (err: any) {
      setFormError(err.message || "No se pudo crear el usuario.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700 }}>
        <PersonAddIcon sx={{ color: "#65944F" }} />
        Crear nuevo usuario
        <IconButton onClick={handleClose} sx={{ ml: "auto" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{formError}</Alert>}
        {formSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{formSuccess}</Alert>}

        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            label="Nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            fullWidth
            size="small"
            sx={{ mb: 2 }}
          />
          <TextField
            label="Apellido"
            value={formData.apellido}
            onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
            fullWidth
            size="small"
            sx={{ mb: 2 }}
          />
        </Box>

        <TextField
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          fullWidth
          size="small"
          sx={{ mb: 2 }}
        />

        <TextField
          label="Rol"
          select
          value={formData.rol}
          onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
          fullWidth
          size="small"
          sx={{ mb: 1 }}
        >
          <MenuItem value="" disabled>Seleccioná un rol</MenuItem>
          {ROLES.map((r) => (
            <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
          ))}
        </TextField>

        <Typography variant="caption" color="#888" sx={{ display: "block", mt: 1 }}>
          El usuario recibirá un email con un enlace para establecer su contraseña.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={handleClose} sx={{ textTransform: "none", color: "#666" }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={formLoading}
          startIcon={formLoading ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
          sx={{ bgcolor: "#65944F", textTransform: "none", borderRadius: 2, "&:hover": { bgcolor: "#558040" } }}
        >
          {formLoading ? "Creando..." : "Crear usuario"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
