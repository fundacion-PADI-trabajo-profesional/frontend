/**
 * @file GestionUsuarios.tsx
 * @description Componente principal de administración de usuarios del sistema PADI.
 * Solo accesible para el rol `equipo_padi`.
 *
 * Responsabilidades:
 * - Cargar y mostrar la lista de usuarios con filtros de texto, rol y estado.
 * - Abrir los modales de creación individual, carga masiva, cambio de rol y eliminación.
 * - Reenviar invitaciones a usuarios pendientes de activación.
 * - Actualizar la lista localmente tras cambios de rol (sin recargar desde la API).
 */
// src/components/GestionUsuarios.tsx
import { useState, useCallback, useEffect, useMemo } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import { adminListUsers, adminResendInvite } from "../api/auth";
import { ROLES, rolColor, rolLabel } from "./usuarios/types";
import type { Usuario } from "./usuarios/types";
import ModalCrearUsuario from "./usuarios/ModalCrearUsuario";
import ModalCargaMasiva from "./usuarios/ModalCargaMasiva";
import ModalConfirmarEliminar from "./usuarios/ModalConfirmarEliminar";
import ModalCambiarRol from "./usuarios/ModalCambiarRol";

/**
 * Página de gestión de usuarios del sistema.
 *
 * Orquesta la carga de datos, los filtros y la apertura de los modales especializados.
 * El estado de cada modal se mantiene aquí (qué usuario está seleccionado); la lógica
 * interna de cada operación vive en su propio componente modal.
 */
export default function GestionUsuarios() {
  /**
   * ID del usuario autenticado actualmente, leído desde `localStorage`.
   * Se usa para ocultar el botón de cambio de rol en la propia fila del usuario.
   */
  const currentUserId: string | null = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("padiProfile") ?? "null")?.id ?? null; }
    catch { return null; }
  }, []);

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filtros
  const [filterText, setFilterText] = useState("");
  const [filterRol, setFilterRol] = useState("");
  const [filterEstado, setFilterEstado] = useState("");

  // Apertura de modales
  const [openIndividual, setOpenIndividual] = useState(false);
  const [openMasivo, setOpenMasivo] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Usuario | null>(null);
  const [rolChangeTarget, setRolChangeTarget] = useState<Usuario | null>(null);

  // Reenvío de invitación
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState("");

  /** Carga (o recarga) la lista completa de usuarios desde la API. */
  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminListUsers();
      setUsuarios(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la lista de usuarios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsuarios(); }, [fetchUsuarios]);

  const filteredUsuarios = useMemo(() => {
    const text = filterText.toLowerCase().trim();
    return usuarios.filter((u) => {
      if (text) {
        const matchNombre = u.nombre.toLowerCase().includes(text);
        const matchApellido = u.apellido.toLowerCase().includes(text);
        const matchEmail = u.email.toLowerCase().includes(text);
        if (!matchNombre && !matchApellido && !matchEmail) return false;
      }
      if (filterRol && u.rol !== filterRol) return false;
      if (filterEstado && u.estado !== filterEstado) return false;
      return true;
    });
  }, [usuarios, filterText, filterRol, filterEstado]);

  const hasFilters = filterText || filterRol || filterEstado;
  const clearFilters = () => { setFilterText(""); setFilterRol(""); setFilterEstado(""); };

  /** Reenvía el email de invitación a un usuario que todavía no aceptó la suya. */
  const handleResendInvite = async (usuario: Usuario) => {
    setResendingId(usuario.id);
    setResendSuccess("");
    setError("");
    try {
      await adminResendInvite(usuario.id);
      setResendSuccess(`Invitación reenviada a ${usuario.email}.`);
      setTimeout(() => setResendSuccess(""), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo reenviar la invitación.");
    } finally {
      setResendingId(null);
    }
  };

  /**
   * Actualiza el rol de un usuario en el estado local sin recargar desde la API.
   * Es invocado por `ModalCambiarRol` tras confirmar el cambio exitosamente.
   */
  const handleRolChanged = (userId: string, newRol: string) => {
    setUsuarios((prev) => prev.map((u) => u.id === userId ? { ...u, rol: newRol } : u));
  };

  /** Recarga la lista completa tras eliminar un usuario. */
  const handleDeleted = () => {
    fetchUsuarios();
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Typography variant="h6" fontWeight={700} color="#333">
          Gestión de Usuarios
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchUsuarios}
            disabled={loading}
            sx={{ borderColor: "#65944F", color: "#65944F", textTransform: "none", borderRadius: 2 }}
          >
            Actualizar
          </Button>
          <Button
            variant="outlined"
            startIcon={<GroupAddIcon />}
            onClick={() => setOpenMasivo(true)}
            sx={{ borderColor: "#65944F", color: "#65944F", textTransform: "none", borderRadius: 2 }}
          >
            Carga masiva
          </Button>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => setOpenIndividual(true)}
            sx={{ bgcolor: "#65944F", textTransform: "none", borderRadius: 2, "&:hover": { bgcolor: "#558040" } }}
          >
            Nuevo usuario
          </Button>
        </Box>
      </Box>

      {/* Alertas globales */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {resendSuccess && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setResendSuccess("")}>
          {resendSuccess}
        </Alert>
      )}

      {/* Barra de búsqueda y filtros */}
      <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Buscar por nombre, apellido o email..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          sx={{ flexGrow: 1, minWidth: 220 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: "#999" }} />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          select size="small" label="Rol"
          value={filterRol} onChange={(e) => setFilterRol(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">Todos los roles</MenuItem>
          {ROLES.map((r) => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
        </TextField>
        <TextField
          select size="small" label="Estado"
          value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">Todos los estados</MenuItem>
          <MenuItem value="activo">Activo</MenuItem>
          <MenuItem value="pendiente">Pendiente</MenuItem>
        </TextField>
        {hasFilters && (
          <Button size="small" onClick={clearFilters} sx={{ textTransform: "none", color: "#888", whiteSpace: "nowrap" }}>
            Limpiar filtros
          </Button>
        )}
      </Box>

      {hasFilters && !loading && (
        <Typography variant="caption" color="#888" sx={{ display: "block", mb: 1.5 }}>
          Mostrando {filteredUsuarios.length} de {usuarios.length} usuario(s)
        </Typography>
      )}

      {/* Tabla */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress sx={{ color: "#65944F" }} />
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: "1px solid #e0e0e0" }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Apellido</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Rol</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 90 }} align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: "#999" }}>
                    {hasFilters ? "No hay usuarios que coincidan con los filtros." : "No hay usuarios registrados."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsuarios.map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell>{u.nombre}</TableCell>
                    <TableCell>{u.apellido}</TableCell>
                    <TableCell sx={{ color: "#555", fontSize: "0.85rem" }}>{u.email}</TableCell>
                    <TableCell>
                      <Chip label={rolLabel(u.rol)} color={rolColor(u.rol)} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={u.estado === "activo" ? "Activo" : "Pendiente"}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          bgcolor: u.estado === "activo" ? "#e8f5e9" : "#fff8e1",
                          color: u.estado === "activo" ? "#2e7d32" : "#f57f17",
                          border: `1px solid ${u.estado === "activo" ? "#a5d6a7" : "#ffe082"}`,
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
                        {u.estado === "pendiente" && (
                          <Tooltip title="Reenviar invitación">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => handleResendInvite(u)}
                                disabled={resendingId === u.id}
                                sx={{ color: "#f57f17", "&:hover": { bgcolor: "#fff8e1" } }}
                              >
                                {resendingId === u.id
                                  ? <CircularProgress size={14} sx={{ color: "#f57f17" }} />
                                  : <MarkEmailReadIcon fontSize="small" />
                                }
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                        {u.id !== currentUserId && (
                          <Tooltip title="Cambiar rol">
                            <IconButton
                              size="small"
                              onClick={() => setRolChangeTarget(u)}
                              sx={{ color: "#1565c0", "&:hover": { bgcolor: "#e3f2fd" } }}
                            >
                              <ManageAccountsIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Eliminar usuario">
                          <IconButton
                            size="small"
                            onClick={() => setConfirmDelete(u)}
                            sx={{ color: "#c62828", "&:hover": { bgcolor: "#ffebee" } }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Modales */}
      <ModalCrearUsuario
        open={openIndividual}
        onClose={() => setOpenIndividual(false)}
        onCreated={fetchUsuarios}
      />
      <ModalCargaMasiva
        open={openMasivo}
        onClose={() => setOpenMasivo(false)}
        onCreated={fetchUsuarios}
      />
      <ModalConfirmarEliminar
        usuario={confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onDeleted={handleDeleted}
      />
      <ModalCambiarRol
        usuario={rolChangeTarget}
        onClose={() => setRolChangeTarget(null)}
        onRolChanged={handleRolChanged}
      />
    </Box>
  );
}
