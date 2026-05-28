import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { adminDeleteUser } from "../../api/auth";
import type { Usuario } from "./types";

interface Props {
  usuario: Usuario | null;
  onClose: () => void;
  onDeleted: () => void;
}

export default function ModalConfirmarEliminar({ usuario, onClose, onDeleted }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!usuario) return;
    setLoading(true);
    try {
      await adminDeleteUser(usuario.id);
      onDeleted();
      onClose();
    } catch (err: any) {
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!usuario} onClose={onClose} maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle fontWeight={700}>¿Eliminar usuario?</DialogTitle>
      <DialogContent>
        <Typography>
          ¿Estás seguro que querés eliminar a{" "}
          <strong>{usuario?.nombre} {usuario?.apellido}</strong>? Esta acción no se puede deshacer.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: "none", color: "#666" }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleDelete}
          disabled={loading}
          sx={{ textTransform: "none", borderRadius: 2 }}
        >
          {loading ? "Eliminando..." : "Eliminar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
