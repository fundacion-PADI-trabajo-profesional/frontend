// src/components/GestionUsuarios.tsx
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import SearchIcon from "@mui/icons-material/Search";
import {
  adminCreateUser,
  adminCreateUsersBulk,
  adminDeleteUser,
  adminListUsers,
  adminResendInvite,
  type CreateUserPayload,
} from "../api/auth";

const ROLES = [
  { value: "equipo_padi", label: "Equipo PADI" },
  { value: "director", label: "Director" },
  { value: "encargado_zona", label: "Encargado de Zona" },
  { value: "docente", label: "Docente" },
];

const rolLabel = (rol: string) =>
  ROLES.find((r) => r.value === rol)?.label ?? rol;

const rolColor = (rol: string): "default" | "primary" | "warning" | "success" | "info" => {
  switch (rol) {
    case "equipo_padi": return "primary";
    case "director": return "warning";
    case "encargado_zona": return "info";
    case "docente": return "success";
    default: return "default";
  }
};

interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
  estado: "activo" | "pendiente";
}

const emptyForm: CreateUserPayload = {
  nombre: "",
  apellido: "",
  email: "",
  rol: "",
};

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Filtros ────────────────────────────────────────────────────────────────
  const [filterText, setFilterText] = useState("");
  const [filterRol, setFilterRol] = useState("");
  const [filterEstado, setFilterEstado] = useState("");

  // Modal individual
  const [openIndividual, setOpenIndividual] = useState(false);
  const [formData, setFormData] = useState<CreateUserPayload>(emptyForm);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState("");

  // Modal masivo
  const [openMasivo, setOpenMasivo] = useState(false);
  const [excelRows, setExcelRows] = useState<CreateUserPayload[]>([]);
  const [excelError, setExcelError] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ creados: any[]; errores: any[] } | null>(null);

  // Confirmación de eliminación
  const [confirmDelete, setConfirmDelete] = useState<Usuario | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Reenvío de invitación
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminListUsers();
      setUsuarios(data);
    } catch (err: any) {
      setError(err.message || "No se pudo cargar la lista de usuarios.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  // ── Lista filtrada ─────────────────────────────────────────────────────────

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
  const clearFilters = () => {
    setFilterText("");
    setFilterRol("");
    setFilterEstado("");
  };

  // ─── CREACIÓN INDIVIDUAL ───────────────────────────────────────────────────

  const handleIndividualSubmit = async () => {
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
      setFormSuccess(
        `Usuario ${formData.nombre} ${formData.apellido} creado. Se envió un correo con la invitación.`
      );
      setFormData(emptyForm);
      fetchUsuarios();
    } catch (err: any) {
      setFormError(err.message || "No se pudo crear el usuario.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleCloseIndividual = () => {
    setOpenIndividual(false);
    setFormData(emptyForm);
    setFormError("");
    setFormSuccess("");
  };

  // ─── IMPORTACIÓN MASIVA ────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelError("");
    setBulkResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (rows.length === 0) {
          setExcelError("El archivo no tiene filas de datos.");
          return;
        }

        const normalized: CreateUserPayload[] = rows.map((row) => {
          const get = (keys: string[]) => {
            for (const k of keys) {
              const found = Object.keys(row).find(
                (rk) => rk.toLowerCase().trim() === k.toLowerCase()
              );
              if (found) return String(row[found]).trim();
            }
            return "";
          };

          return {
            nombre: get(["nombre", "name", "first name", "firstname"]),
            apellido: get(["apellido", "apellidos", "lastname", "last name", "surname"]),
            email: get(["email", "correo", "mail", "e-mail"]),
            rol: get(["rol", "role", "perfil"]).toLowerCase().replace(/\s/g, "_"),
          };
        });

        const invalidos = normalized.filter(
          (r) => !r.nombre || !r.apellido || !r.email || !ROLES.find((rol) => rol.value === r.rol)
        );

        if (invalidos.length > 0) {
          setExcelError(
            `${invalidos.length} fila(s) tienen datos inválidos. Verificá que las columnas sean: nombre, apellido, email, rol (valores: ${ROLES.map((r) => r.value).join(", ")}).`
          );
          setExcelRows(normalized);
          return;
        }

        setExcelRows(normalized);
      } catch {
        setExcelError("No se pudo leer el archivo. Asegurate de que sea un .xlsx o .csv válido.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const handleBulkSubmit = async () => {
    setBulkLoading(true);
    setBulkResult(null);
    setExcelError("");

    try {
      const result = await adminCreateUsersBulk(excelRows);
      setBulkResult(result);
      if (result.creados.length > 0) {
        fetchUsuarios();
      }
    } catch (err: any) {
      setExcelError(err.message || "Error al procesar la importación.");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleCloseMasivo = () => {
    setOpenMasivo(false);
    setExcelRows([]);
    setExcelError("");
    setBulkResult(null);
  };

  // ─── PLANTILLA ─────────────────────────────────────────────────────────────

  const downloadTemplate = () => {
    const templateData = [
      { nombre: "María", apellido: "García", email: "maria.garcia@ejemplo.com", rol: "docente" },
      { nombre: "Juan", apellido: "López", email: "juan.lopez@ejemplo.com", rol: "director" },
      { nombre: "Ana", apellido: "Martínez", email: "ana.martinez@ejemplo.com", rol: "encargado_zona" },
      { nombre: "Jose", apellido: "Juarez", email: "jose.juarez@ejemplo.com", rol: "equipo_padi" }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Usuarios");
    XLSX.writeFile(wb, "plantilla_usuarios_padi.xlsx");
  };

  // ─── ELIMINACIÓN ───────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleteLoading(true);
    try {
      await adminDeleteUser(confirmDelete.id);
      setConfirmDelete(null);
      fetchUsuarios();
    } catch (err: any) {
      setError(err.message || "No se pudo eliminar el usuario.");
      setConfirmDelete(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ─── REENVÍO DE INVITACIÓN ─────────────────────────────────────────────────

  const handleResendInvite = async (usuario: Usuario) => {
    setResendingId(usuario.id);
    setResendSuccess("");
    setError("");
    try {
      await adminResendInvite(usuario.id);
      setResendSuccess(`Invitación reenviada a ${usuario.email}.`);
      setTimeout(() => setResendSuccess(""), 5000);
    } catch (err: any) {
      setError(err.message || "No se pudo reenviar la invitación.");
    } finally {
      setResendingId(null);
    }
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────

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

      {/* ── Barra de búsqueda y filtros ─────────────────────────────────────── */}
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
          select
          size="small"
          label="Rol"
          value={filterRol}
          onChange={(e) => setFilterRol(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">Todos los roles</MenuItem>
          {ROLES.map((r) => (
            <MenuItem key={r.value} value={r.value}>
              {r.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Estado"
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">Todos los estados</MenuItem>
          <MenuItem value="activo">Activo</MenuItem>
          <MenuItem value="pendiente">Pendiente</MenuItem>
        </TextField>

        {hasFilters && (
          <Button
            size="small"
            onClick={clearFilters}
            sx={{ textTransform: "none", color: "#888", whiteSpace: "nowrap" }}
          >
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
                <TableCell sx={{ fontWeight: 700, width: 90 }} align="center">Acc.</TableCell>
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
                      <Chip
                        label={rolLabel(u.rol)}
                        color={rolColor(u.rol)}
                        size="small"
                        variant="outlined"
                      />
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
                                {resendingId === u.id ? (
                                  <CircularProgress size={14} sx={{ color: "#f57f17" }} />
                                ) : (
                                  <MarkEmailReadIcon fontSize="small" />
                                )}
                              </IconButton>
                            </span>
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

      {/* ── MODAL: Creación individual ─────────────────────────────────────── */}
      <Dialog
        open={openIndividual}
        onClose={handleCloseIndividual}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700 }}>
          <PersonAddIcon sx={{ color: "#65944F" }} />
          Crear nuevo usuario
          <IconButton onClick={handleCloseIndividual} sx={{ ml: "auto" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          {formError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {formError}
            </Alert>
          )}
          {formSuccess && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
              {formSuccess}
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
            <MenuItem value="" disabled>
              Seleccioná un rol
            </MenuItem>
            {ROLES.map((r) => (
              <MenuItem key={r.value} value={r.value}>
                {r.label}
              </MenuItem>
            ))}
          </TextField>

          <Typography variant="caption" color="#888" sx={{ display: "block", mt: 1 }}>
            El usuario recibirá un email con un enlace para establecer su contraseña.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={handleCloseIndividual} sx={{ textTransform: "none", color: "#666" }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleIndividualSubmit}
            disabled={formLoading}
            startIcon={formLoading ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
            sx={{
              bgcolor: "#65944F",
              textTransform: "none",
              borderRadius: 2,
              "&:hover": { bgcolor: "#558040" },
            }}
          >
            {formLoading ? "Creando..." : "Crear usuario"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── MODAL: Carga masiva ────────────────────────────────────────────── */}
      <Dialog
        open={openMasivo}
        onClose={handleCloseMasivo}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700 }}>
          <GroupAddIcon sx={{ color: "#65944F" }} />
          Carga masiva de usuarios
          <IconButton onClick={handleCloseMasivo} sx={{ ml: "auto" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            Subí un archivo <strong>.xlsx o .csv</strong> con las columnas:{" "}
            <strong>nombre, apellido, email, rol</strong>. Los valores válidos para el rol son:{" "}
            {ROLES.map((r) => <code key={r.value} style={{ marginRight: 6 }}>{r.value}</code>)}
          </Alert>

          {!bulkResult && (
            <Box
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: "2px dashed #65944F",
                borderRadius: 3,
                p: 4,
                textAlign: "center",
                cursor: "pointer",
                bgcolor: "#f9fdf6",
                transition: "0.2s",
                "&:hover": { bgcolor: "#f0faec" },
                mb: 2,
              }}
            >
              <CloudUploadIcon sx={{ fontSize: 48, color: "#65944F", opacity: 0.7 }} />
              <Typography variant="body1" color="#555" mt={1}>
                Hacé clic para seleccionar un archivo
              </Typography>
              <Typography variant="caption" color="#999">
                Formatos aceptados: .xlsx, .csv
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </Box>
          )}

          <Button
            size="small"
            startIcon={<DownloadIcon />}
            onClick={downloadTemplate}
            sx={{ textTransform: "none", color: "#65944F", mb: 2 }}
          >
            Descargar plantilla de ejemplo
          </Button>

          {excelError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {excelError}
            </Alert>
          )}

          {excelRows.length > 0 && !bulkResult && (
            <>
              <Typography variant="subtitle2" fontWeight={700} mb={1} color="#333">
                Vista previa — {excelRows.length} fila(s) detectada(s)
              </Typography>
              <TableContainer
                component={Paper}
                elevation={0}
                sx={{ maxHeight: 280, border: "1px solid #e0e0e0", borderRadius: 2, mb: 2 }}
              >
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Apellido</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Rol</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {excelRows.map((row, i) => {
                      const isInvalid =
                        !row.nombre ||
                        !row.apellido ||
                        !row.email ||
                        !ROLES.find((r) => r.value === row.rol);
                      return (
                        <TableRow key={i} sx={{ bgcolor: isInvalid ? "#fff3f3" : "inherit" }}>
                          <TableCell>{row.nombre || <span style={{ color: "#c62828" }}>—</span>}</TableCell>
                          <TableCell>{row.apellido || <span style={{ color: "#c62828" }}>—</span>}</TableCell>
                          <TableCell>{row.email || <span style={{ color: "#c62828" }}>—</span>}</TableCell>
                          <TableCell>
                            {ROLES.find((r) => r.value === row.rol) ? (
                              <Chip label={rolLabel(row.rol)} size="small" variant="outlined" color={rolColor(row.rol)} />
                            ) : (
                              <span style={{ color: "#c62828", fontWeight: 600 }}>{row.rol || "—"}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {bulkResult && (
            <Box>
              <Alert
                severity={bulkResult.errores.length === 0 ? "success" : "warning"}
                sx={{ mb: 2, borderRadius: 2 }}
                icon={bulkResult.errores.length === 0 ? <CheckCircleIcon /> : <ErrorOutlineIcon />}
              >
                <strong>{bulkResult.creados.length}</strong> usuario(s) creado(s)
                {bulkResult.errores.length > 0 && (
                  <> · <strong>{bulkResult.errores.length}</strong> error(es)</>
                )}
              </Alert>

              {bulkResult.errores.length > 0 && (
                <>
                  <Typography variant="subtitle2" fontWeight={700} color="#c62828" mb={1}>
                    Errores:
                  </Typography>
                  <TableContainer
                    component={Paper}
                    elevation={0}
                    sx={{ maxHeight: 200, border: "1px solid #f0c0c0", borderRadius: 2 }}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Error</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {bulkResult.errores.map((e: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell sx={{ color: "#555" }}>{e.email}</TableCell>
                            <TableCell sx={{ color: "#c62828" }}>{e.error}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          {bulkResult ? (
            <Button
              variant="contained"
              onClick={handleCloseMasivo}
              sx={{ bgcolor: "#65944F", textTransform: "none", borderRadius: 2, "&:hover": { bgcolor: "#558040" } }}
            >
              Cerrar
            </Button>
          ) : (
            <>
              <Button onClick={handleCloseMasivo} sx={{ textTransform: "none", color: "#666" }}>
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={handleBulkSubmit}
                disabled={bulkLoading || excelRows.length === 0 || !!excelError}
                startIcon={
                  bulkLoading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <UploadFileIcon />
                  )
                }
                sx={{
                  bgcolor: "#65944F",
                  textTransform: "none",
                  borderRadius: 2,
                  "&:hover": { bgcolor: "#558040" },
                }}
              >
                {bulkLoading ? "Procesando..." : `Importar ${excelRows.length} usuario(s)`}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* ── CONFIRMACIÓN DE ELIMINACIÓN ────────────────────────────────────── */}
      <Dialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={700}>¿Eliminar usuario?</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro que querés eliminar a{" "}
            <strong>
              {confirmDelete?.nombre} {confirmDelete?.apellido}
            </strong>
            ? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmDelete(null)} sx={{ textTransform: "none", color: "#666" }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleteLoading}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            {deleteLoading ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
