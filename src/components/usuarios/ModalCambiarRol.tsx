import { useState, useEffect } from "react";
import {
  Alert,
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
import CloseIcon from "@mui/icons-material/Close";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import { adminUpdateUserRol } from "../../api/auth";
import { ROLES } from "./types";
import type { Usuario } from "./types";

interface Props {
  usuario: Usuario | null;
  onClose: () => void;
  onRolChanged: (userId: string, newRol: string) => void;
}

export default function ModalCambiarRol({ usuario, onClose, onRolChanged }: Props) {
  const [rolValue, setRolValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (usuario) {
      setRolValue(usuario.rol);
      setError("");
    }
  }, [usuario]);

  const handleConfirm = async () => {
    if (!usuario) return;
    setLoading(true);
    setError("");
    try {
      await adminUpdateUserRol(usuario.id, rolValue);
      onRolChanged(usuario.id, rolValue);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "No se pudo cambiar el rol.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!usuario} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700 }}>
        <ManageAccountsIcon sx={{ color: "#1565c0" }} />
        Cambiar rol
        <IconButton onClick={onClose} sx={{ ml: "auto" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        <Typography variant="body2" color="#555" sx={{ mb: 2 }}>
          Usuario: <strong>{usuario?.nombre} {usuario?.apellido}</strong>
        </Typography>
        <TextField
          label="Nuevo rol"
          select
          value={rolValue}
          onChange={(e) => setRolValue(e.target.value)}
          fullWidth
          size="small"
        >
          {ROLES.map((r) => (
            <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose} sx={{ textTransform: "none", color: "#666" }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={loading || rolValue === usuario?.rol}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ManageAccountsIcon />}
          sx={{ bgcolor: "#1565c0", textTransform: "none", borderRadius: 2, "&:hover": { bgcolor: "#0d47a1" } }}
        >
          {loading ? "Guardando..." : "Confirmar cambio"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
