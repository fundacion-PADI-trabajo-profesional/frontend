import React, { useState, useRef } from 'react';
import {
    Box, Button, Typography, CircularProgress, Alert,
    Paper, Dialog, DialogTitle, DialogContent, DialogActions,
    Divider, IconButton, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip
} from '@mui/material';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { bulkCreateEstudiantes, getGeneros, type EstudianteBulkRow } from '../../api/estudiantes';
import { getEscuelas } from '../../api/escuelas';
import { getAulas, type Aula } from '../../api/aulas';
import { normalizarDni, ID_INTERNO, dnisRepetidos } from '../../utils/dni';
import { normalizarGenero } from '../../utils/genero';
import { etiquetaAula, etiquetaAulaAnterior, resolverAula, type AulaCandidata } from '../../utils/cargaMasiva';

interface BulkDryRunResult {
    nuevos: { dni: string }[];
    promovidos: { dni: string; old_sala_id: number | null }[];
    repitentes: { dni: string }[];
    retrocesos: { dni: string; old_sala_id: number | null }[];
    reactivados?: { dni: string }[];
}

/** Respuesta del backend al confirmar: filas guardadas y filas que fallaron con su motivo. */
interface BulkResult {
    procesados: EstudianteBulkRow[];
    errores: { fila: { dni: string | null; nombre: string | null; apellido: string | null }; motivo: string }[];
}

/** Ids de género si el catálogo no responde (coinciden con la semilla de la base). */
const GENEROS_FALLBACK = ["M", "F", "X"];

async function getGeneroIds(): Promise<string[]> {
    try {
        const ids = (await getGeneros()).map((g) => String(g.id).toUpperCase());
        return ids.length > 0 ? ids : GENEROS_FALLBACK;
    } catch {
        return GENEROS_FALLBACK;
    }
}

interface BulkUploadProps {
    open: boolean;
    onSuccess: (creados: EstudianteBulkRow[]) => void;
    onCancel: () => void;
}

export default function BulkUploadForm({ open, onCancel, onSuccess }: BulkUploadProps) {
    const [bulkLoading, setBulkLoading] = useState(false);
    const [excelRows, setExcelRows] = useState<EstudianteBulkRow[]>([]);
    const [excelError, setExcelError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [step, setStep] = useState<'upload' | 'preview' | 'resultado'>('upload');
    const [stats, setStats] = useState<BulkDryRunResult | null>(null);
    const [resultado, setResultado] = useState<BulkResult | null>(null);
    const [generoIds, setGeneroIds] = useState<string[]>(GENEROS_FALLBACK);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = () => {
        setExcelRows([]);
        setExcelError(null);
        setSuccessMessage(null);
        setStep('upload');
        setStats(null);
        setResultado(null);
    };

    /** Cierra la pantalla de resultado: si algo se cargó, la página refresca el listado. */
    const handleCerrarResultado = () => {
        const creados = resultado?.procesados ?? [];
        resetState();
        if (creados.length > 0) onSuccess(creados); else onCancel();
    };

    const handleClose = () => {
        if (step === 'resultado') { handleCerrarResultado(); return; }
        resetState();
        onCancel();
    };

    // ─── GENERACIÓN DE PLANTILLA ────────────────────────────────
    const handleDownloadTemplate = async () => {
        try {
            setBulkLoading(true);
            setExcelError(null);

            const [escuelas, todasLasAulas, idsGenero] = await Promise.all([
                getEscuelas(),
                getAulas(),
                getGeneroIds(),
            ]);

            // Aulas agrupadas por escuela_id (para ordenar por escuela)
            const aulasPorEscuela = new Map<string, Aula[]>();
            for (const aula of todasLasAulas) {
                const eid = String(aula.escuela_id);
                if (!aulasPorEscuela.has(eid)) aulasPorEscuela.set(eid, []);
                aulasPorEscuela.get(eid)!.push(aula);
            }

            // Lista combinada: nombre de escuela (sin aula) + "Escuela - Comisión - Turno"
            // Agrupada por escuela para que el dropdown sea fácil de navegar
            const combinedEntries: string[] = [];
            for (const escuela of escuelas) {
                combinedEntries.push(escuela.nombre);
                const aulas = (aulasPorEscuela.get(String(escuela.id)) || [])
                    .sort((a, b) => (a.sala_id - b.sala_id) || `${a.comision}${a.turno}`.localeCompare(`${b.comision}${b.turno}`));
                for (const aula of aulas) {
                    combinedEntries.push(etiquetaAula(escuela.nombre, aula));
                }
            }

            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet("Carga de Estudiantes");

            // 1. Columnas — una sola columna G para colegio y/o aula
            ws.columns = [
                { header: "DNI / ID interno", key: "dni", width: 18 },
                { header: "Nombre", key: "nombre", width: 18 },
                { header: "Apellido", key: "apellido", width: 18 },
                { header: "Fecha Nacimiento", key: "fecha_nac", width: 18 },
                { header: "Genero", key: "genero", width: 10 },
                { header: "SalaID", key: "sala", width: 10 },
                { header: "Colegio / Aula", key: "colegio_aula", width: 45 },
            ];

            // Estilo del encabezado
            ws.getRow(1).eachCell((cell) => {
                cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5c7cfa" } };
                cell.alignment = { vertical: "middle", horizontal: "center" };
            });
            ws.getRow(1).height = 20;

            // 2. Validaciones por fila
            const LAST_ROW = 1000;
            for (let row = 2; row <= LAST_ROW; row++) {
                ws.getCell(`E${row}`).dataValidation = {
                    type: "list",
                    allowBlank: true,
                    formulae: [`"${idsGenero.join(",")}"`],
                    showErrorMessage: true,
                    errorTitle: "Valor inválido",
                    error: `Ingresá ${idsGenero.join(", ")}`,
                };

                ws.getCell(`F${row}`).dataValidation = {
                    type: "list",
                    allowBlank: true,
                    formulae: ['"3,4,5"'],
                    showErrorMessage: true,
                    errorTitle: "Valor inválido",
                    error: "Ingresá 3, 4 o 5",
                };

                ws.getCell(`G${row}`).dataValidation = {
                    type: "list",
                    allowBlank: true,
                    formulae: [`Datos_soporte!$A$2:$A$${combinedEntries.length + 1}`],
                    showErrorMessage: true,
                    errorTitle: "Opción inválida",
                    error: "Elegí una opción del menú desplegable",
                };

                ws.getCell(`D${row}`).numFmt = "dd/mm/yyyy";
            }

            ws.views = [{ state: "frozen", ySplit: 1 }];

            // Nota en el encabezado de DNI y hoja "Instrucciones". Va después de la hoja de datos
            // porque el lector del archivo toma siempre la primera hoja.
            ws.getCell("A1").note = `Si el alumno no tiene DNI, cargá el identificador interno: ${ID_INTERNO.resumen}. Ej: ${ID_INTERNO.ejemplo}`;
            const wsInst = wb.addWorksheet("Instrucciones");
            wsInst.columns = [{ header: "Cómo completar la planilla", key: "texto", width: 120 }];
            wsInst.getRow(1).font = { bold: true, size: 13 };
            const lineas = [
                "Una fila por alumno. Descargá esta plantilla cada vez: el desplegable de colegios y aulas se arma con los datos actuales.",
                "",
                "DNI / ID interno: el DNI del alumno, solo números. Si no tiene DNI, un identificador interno armado así:",
                ...ID_INTERNO.pasos.map((p, i) => `    ${i + 1}. ${p}`),
                `    Ejemplo: ${ID_INTERNO.ejemplo}. Todo junto, sin espacios ni guiones, en mayúsculas.`,
                "    El identificador es del alumno para siempre: el año que viene cargalo con el mismo. Cuando consigas el DNI real, reemplazalo desde la ficha del alumno.",
                "",
                "Fecha Nacimiento: día/mes/año, por ejemplo 25/05/2018.",
                `Genero: ${idsGenero.join(", ")}.`,
                "SalaID: 3, 4 o 5.",
                "Colegio / Aula: elegí una opción del desplegable. Si elegís solo el colegio, el alumno queda sin aula asignada.",
            ];
            lineas.forEach((texto) => wsInst.addRow({ texto }));

            // 3. Hoja oculta: Datos_soporte con la lista combinada
            const wsSupport = wb.addWorksheet("Datos_soporte", { state: 'hidden' });
            wsSupport.columns = [{ header: "Colegio / Aula", key: "label", width: 50 }];
            combinedEntries.forEach((entry) => wsSupport.addRow({ label: entry }));

            // 4. Descargar archivo
            const buffer = await wb.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'plantilla_estudiantes.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Error al generar Excel:", error);
            setExcelError("No se pudo armar la plantilla. Verificá tu conexión.");
        } finally {
            setBulkLoading(false);
        }
    };

    // ─── LECTURA DEL EXCEL SUBIDO ───────────────────────────────────────────
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setExcelError(null);
        const reader = new FileReader();

        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws, { raw: false, defval: null });

                const rawRows = data as Record<string, unknown>[];
                // La plantilla nueva titula la columna "DNI / ID interno"; las viejas, "DNI"
                const leerDni = (row: Record<string, unknown>) => row["DNI / ID interno"] ?? row["DNI"];
                const validRows = rawRows.filter((row) => leerDni(row) || row["Nombre"] || row["Apellido"]);

                const [escuelas, todasLasAulas, idsGenero] = await Promise.all([
                    getEscuelas(),
                    getAulas(),
                    getGeneroIds(),
                ]);
                setGeneroIds(idsGenero);

                // schoolOnlyMap: escuela nombre → escuela_id
                const schoolOnlyMap = new Map(escuelas.map((e) => [e.nombre, String(e.id)]));

                // schoolAulaMap: etiqueta → aulas candidatas. Se registran la etiqueta actual (con sala) y la
                // anterior (sin sala): esta última se repite entre las salas de un mismo turno, y se desempata
                // con el SalaID de la fila.
                const schoolAulaMap = new Map<string, AulaCandidata[]>();
                for (const aula of todasLasAulas) {
                    const escuela = escuelas.find((e) => String(e.id) === String(aula.escuela_id));
                    if (!escuela) continue;
                    const candidata: AulaCandidata = { escuela_id: String(aula.escuela_id), aula_id: aula.id, sala_id: Number(aula.sala_id) };
                    for (const label of [etiquetaAula(escuela.nombre, aula), etiquetaAulaAnterior(escuela.nombre, aula)]) {
                        const lista = schoolAulaMap.get(label) ?? [];
                        lista.push(candidata);
                        schoolAulaMap.set(label, lista);
                    }
                }

                const estudiantes = validRows.map((row) => {
                    const fecha = row["Fecha Nacimiento"];
                    let finalDate = null;

                    if (fecha) {
                        if (fecha instanceof Date && !isNaN(fecha.getTime())) {
                            finalDate = fecha.toISOString();
                        } else if (typeof fecha === 'string') {
                            const parts = fecha.split(/[/-]/);
                            if (parts.length === 3) {
                                const day = parseInt(parts[0], 10);
                                const month = parseInt(parts[1], 10) - 1;
                                const year = parseInt(parts[2], 10);
                                const fullYear = year < 100 ? 2000 + year : year;
                                const parsed = new Date(fullYear, month, day);
                                if (!isNaN(parsed.getTime())) finalDate = parsed.toISOString();
                            } else {
                                const parsed = new Date(fecha);
                                if (!isNaN(parsed.getTime())) finalDate = parsed.toISOString();
                            }
                        }
                    }

                    const colegioAula = row["Colegio / Aula"] ? String(row["Colegio / Aula"]).trim() : null;
                    let escuela_id: string | null = null;
                    let aula_id: string | null = null;

                    const salaFila = row["SalaID"] ? Number(row["SalaID"]) : null;
                    let aula_incompatible = false;
                    if (colegioAula) {
                        const aulaMatch = resolverAula(schoolAulaMap.get(colegioAula) ?? [], salaFila);
                        if (aulaMatch) {
                            escuela_id = aulaMatch.escuela_id;
                            aula_id = aulaMatch.aula_id;
                            aula_incompatible = aulaMatch.incompatible;
                        } else {
                            escuela_id = schoolOnlyMap.get(colegioAula) ?? null;
                        }
                    }

                    const generoNormalizado = normalizarGenero(row["Genero"]);
                    return {
                        dni: normalizarDni(leerDni(row)),
                        nombre: row["Nombre"] ? String(row["Nombre"]).trim() : null,
                        apellido: row["Apellido"] ? String(row["Apellido"]).trim() : null,
                        fecha_nacimiento: finalDate,
                        genero_id: generoNormalizado && idsGenero.includes(generoNormalizado) ? generoNormalizado : null,
                        genero_texto: row["Genero"] ? String(row["Genero"]).trim() : null,
                        sala_id: salaFila,
                        escuela_id,
                        colegio_aula_label: colegioAula,
                        aula_id,
                        aula_incompatible,
                    };
                });

                setExcelRows(estudiantes);
                setStep('upload');
                if (fileInputRef.current) fileInputRef.current.value = '';

            } catch {
                setExcelError("Error al leer el archivo Excel. Asegurate de que sea el formato correcto.");
            }
        };

        reader.readAsBinaryString(file);
    };

    // ─── PASO 1: ANALIZAR (DRY RUN) ──────────────────────────────────────────
    const handleAnalyze = async () => {
        setBulkLoading(true);
        setExcelError(null);

        // Todo lo que haría fallar la fila en el backend se frena acá, con el número de fila de la vista previa
        const filasCon = (pred: (e: EstudianteBulkRow) => boolean) =>
            excelRows.map((e, i) => (pred(e) ? i + 1 : 0)).filter(Boolean).join(", ");
        const problemas: string[] = [];
        const sinDni = filasCon(e => !e.dni);
        const sinNombre = filasCon(e => !e.nombre);
        const sinGenero = filasCon(e => !e.genero_id);
        const sinEscuela = filasCon(e => !e.escuela_id);
        const sinFecha = filasCon(e => !e.fecha_nacimiento);
        const aulaOtraSala = filasCon(e => !!e.aula_incompatible);
        if (sinDni) problemas.push(`sin DNI / ID interno (${sinDni})`);
        if (sinNombre) problemas.push(`sin nombre (${sinNombre})`);
        if (sinGenero) problemas.push(`con género inválido, usá ${generoIds.join(", ")} (${sinGenero})`);
        if (sinEscuela) problemas.push(`sin colegio válido (${sinEscuela})`);
        if (sinFecha) problemas.push(`con fecha de nacimiento inválida (${sinFecha})`);
        if (aulaOtraSala) problemas.push(`con un aula de otra sala, elegí el aula de su sala o solo el colegio (${aulaOtraSala})`);
        for (const rep of dnisRepetidos(excelRows.map(e => e.dni))) {
            problemas.push(`con el DNI / ID interno ${rep.dni} repetido (${rep.filas.join(", ")})`);
        }
        if (problemas.length > 0) {
            setExcelError(`Corregí el Excel antes de continuar. Filas (columna #) ${problemas.join("; ")}.`);
            setBulkLoading(false);
            return;
        }

        try {
            const response = await bulkCreateEstudiantes({ estudiantes: excelRows, dryRun: true });
            const data = response.data;
            setStats(data);

            // Mapeamos los estados a las filas para mostrarlos en la tabla
            const enrichedRows: EstudianteBulkRow[] = excelRows.map(est => {
                const retroceso = data.retrocesos.find((r: { dni: string; old_sala_id: number | null }) => r.dni === est.dni);
                const promovido = data.promovidos.find((r: { dni: string; old_sala_id: number | null }) => r.dni === est.dni);
                const repitente = data.repitentes.find((r: { dni: string }) => r.dni === est.dni);
                const reactivado = data.reactivados?.find((r: { dni: string }) => r.dni === est.dni);

                if (retroceso) return { ...est, estado: 'retroceso' as const, old_sala_id: retroceso.old_sala_id };
                if (promovido) return { ...est, estado: 'promovido' as const, old_sala_id: promovido.old_sala_id };
                if (repitente) return { ...est, estado: 'repite' as const };
                if (reactivado) return { ...est, estado: 'reactivado' as const };
                return { ...est, estado: 'nuevo' as const };
            });

            setExcelRows(enrichedRows);
            setStep('preview');
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setExcelError(msg || "Error al analizar los datos");
        } finally {
            setBulkLoading(false);
        }
    };

    // ─── PASO 2: GUARDAR DEFINITIVO ──────────────────────────────────────────
    const handleConfirmSubmit = async () => {
        setBulkLoading(true);
        setExcelError(null);

        try {
            const response = await bulkCreateEstudiantes({ estudiantes: excelRows, dryRun: false });
            const data: BulkResult = {
                procesados: response.data?.procesados ?? [],
                errores: response.data?.errores ?? [],
            };
            setResultado(data);

            if (data.errores.length === 0) {
                setSuccessMessage(`Se cargaron ${data.procesados.length} alumno(s).`);
                setTimeout(() => {
                    onSuccess(data.procesados);
                    resetState();
                }, 1500);
            } else {
                // El backend responde "éxito" aunque fallen filas: acá se muestran con su motivo
                setStep('resultado');
            }

        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setExcelError(msg || "Error interno al guardar estudiantes");
        } finally {
            setBulkLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 700 }}>
                <GroupAddIcon sx={{ color: "#65944F" }} />
                Carga masiva de Estudiantes
                <IconButton onClick={handleClose} sx={{ ml: "auto" }} disabled={bulkLoading}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <Divider />

            <DialogContent sx={{ pt: 3 }}>
                {!successMessage && step === 'upload' && (
                    <>
                        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                            Descargá la plantilla, completá los datos eligiendo el colegio o aula en la columna <strong>Colegio / Aula</strong>, y subí el archivo <strong>.xlsx</strong>.
                            <br /><br />
                            <strong>Importante:</strong> El formato de la Fecha de Nacimiento debe ser <strong>DD/MM/AAAA</strong> (ej: 25/05/2018).
                            <br /><br />
                            <strong>Sin DNI:</strong> si un alumno no tiene DNI, en la columna <strong>DNI / ID interno</strong> cargá el identificador interno: {ID_INTERNO.resumen} (ej: <strong>{ID_INTERNO.ejemplo}</strong>). Es del alumno para siempre: el año que viene cargalo con el mismo. La plantilla trae una hoja "Instrucciones" con el detalle.
                        </Alert>

                        <Box onClick={() => !bulkLoading && fileInputRef.current?.click()} sx={{ border: "2px dashed #65944F", borderRadius: 3, p: 4, textAlign: "center", cursor: bulkLoading ? "not-allowed" : "pointer", bgcolor: "#f9fdf6", transition: "0.2s", "&:hover": { bgcolor: bulkLoading ? "#f9fdf6" : "#f0faec" }, mb: 2 }}>
                            <CloudUploadIcon sx={{ fontSize: 48, color: "#65944F", opacity: 0.7 }} />
                            <Typography variant="body1" color="#555" mt={1}>Hacé clic para seleccionar el archivo Excel</Typography>
                            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={handleFileChange} />
                        </Box>

                        <Button size="small" startIcon={bulkLoading ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />} onClick={handleDownloadTemplate} sx={{ textTransform: "none", color: "#65944F", mb: 2 }} disabled={bulkLoading}>
                            {bulkLoading ? "Generando plantilla..." : "DESCARGAR PLANTILLA ESTUDIANTES"}
                        </Button>
                    </>
                )}

                {excelError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{excelError}</Alert>}
                {successMessage && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} icon={<CheckCircleIcon fontSize="inherit" />}><strong>¡Éxito!</strong> {successMessage}</Alert>}

                {step === 'resultado' && resultado && (
                    <>
                        <Alert severity={resultado.procesados.length > 0 ? "warning" : "error"} sx={{ mb: 2, borderRadius: 2 }}>
                            <strong>Se cargaron {resultado.procesados.length} de {resultado.procesados.length + resultado.errores.length} alumnos.</strong> Los siguientes no se pudieron cargar. Corregí el Excel y volvé a subir solo esas filas.
                        </Alert>
                        <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 320, border: "1px solid #e0e0e0", borderRadius: 2, mb: 2 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>DNI / ID interno</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Motivo</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {resultado.errores.map((e, i) => (
                                        <TableRow key={i} sx={{ bgcolor: "#fff3f3" }}>
                                            <TableCell>{e.fila?.dni || "—"}</TableCell>
                                            <TableCell>{e.fila?.nombre} {e.fila?.apellido}</TableCell>
                                            <TableCell sx={{ color: "#c62828" }}>{e.motivo}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                )}

                {step === 'preview' && stats && !successMessage && (
                    <Alert severity={stats.retrocesos.length > 0 ? "warning" : "info"} icon={stats.retrocesos.length > 0 ? <WarningAmberIcon /> : undefined} sx={{ mb: 3, borderRadius: 2 }}>
                        <strong>Análisis Alumnos:</strong> Se detectaron {stats.nuevos.length} ingresos nuevos, {stats.promovidos.length} pases de año y {stats.repitentes.length} que repiten sala.
                        {(stats.reactivados?.length ?? 0) > 0 && (
                            <Box sx={{ mt: 1, color: '#1565c0', fontWeight: 'bold' }}>
                                {stats.reactivados?.length} alumno(s) serán reactivados (estaban dados de baja).
                            </Box>
                        )}
                        {stats.retrocesos.length > 0 && (
                            <Box sx={{ mt: 1, color: '#d32f2f', fontWeight: 'bold' }}>
                                ¡Atención! Hay {stats.retrocesos.length} alumno(s) que figuran retrocediendo de sala. ¿Estás seguro de que esto es correcto?
                            </Box>
                        )}
                    </Alert>
                )}

                {excelRows.length > 0 && !successMessage && step !== 'resultado' && (
                    <>
                        <Typography variant="subtitle2" fontWeight={700} mb={1} color="#333">
                            Vista previa — {excelRows.length} estudiante(s)
                        </Typography>
                        <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 280, border: "1px solid #e0e0e0", borderRadius: 2, mb: 2 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>DNI / ID interno</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Género</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Colegio / Aula</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Sala</TableCell>
                                        {step === 'preview' && <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {excelRows.map((row, i) => {
                                        const isInvalid = !row.dni || !row.nombre || !row.genero_id || !row.escuela_id || !row.fecha_nacimiento || !!row.aula_incompatible;
                                        return (
                                            <TableRow key={i} sx={{ bgcolor: isInvalid ? "#fff3f3" : "inherit" }}>
                                                <TableCell sx={{ color: "#888" }}>{i + 1}</TableCell>
                                                <TableCell>{row.dni || <span style={{ color: "#c62828" }}>Falta</span>}</TableCell>
                                                <TableCell>{row.nombre} {row.apellido}</TableCell>
                                                <TableCell>{row.genero_id || <span style={{ color: "#c62828" }}>{row.genero_texto ? `Inválido: ${row.genero_texto}` : "Falta"}</span>}</TableCell>
                                                <TableCell>{row.colegio_aula_label}{row.aula_incompatible && <span style={{ color: "#c62828" }}> (aula de otra sala)</span>}</TableCell>
                                                <TableCell>{row.sala_id || "—"}</TableCell>
                                                {step === 'preview' && (
                                                    <TableCell>
                                                        {row.estado === 'nuevo' && <Chip label="Nuevo ingreso" size="small" color="success" />}
                                                        {row.estado === 'promovido' && <Chip label={`Pasó (De ${row.old_sala_id} a ${row.sala_id})`} size="small" color="primary" variant="outlined" />}
                                                        {row.estado === 'repite' && <Chip label="Mantiene sala" size="small" color="default" />}
                                                        {row.estado === 'retroceso' && <Chip label={`Retrocede (De ${row.old_sala_id} a ${row.sala_id})`} size="small" color="error" />}
                                                        {row.estado === 'reactivado' && <Chip label="Reactivado" size="small" color="info" />}
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                {step !== 'resultado' && (
                    <Button onClick={handleClose} sx={{ textTransform: "none", color: "#666" }} disabled={bulkLoading}>
                        Cancelar
                    </Button>
                )}

                {step === 'resultado' && (
                    <Button variant="contained" onClick={handleCerrarResultado} sx={{ bgcolor: "#65944F", textTransform: "none", borderRadius: 2, "&:hover": { bgcolor: "#558040" } }}>
                        Cerrar
                    </Button>
                )}

                {!successMessage && step === 'upload' && (
                    <Button
                        variant="contained"
                        onClick={handleAnalyze}
                        disabled={bulkLoading || excelRows.length === 0 || !!excelError}
                        startIcon={bulkLoading ? <CircularProgress size={16} color="inherit" /> : <UploadFileIcon />}
                        sx={{ bgcolor: "#65944F", textTransform: "none", borderRadius: 2, "&:hover": { bgcolor: "#558040" } }}
                    >
                        {bulkLoading ? "Analizando..." : "Analizar Datos"}
                    </Button>
                )}

                {!successMessage && step === 'preview' && (
                    <Button
                        variant="contained"
                        onClick={handleConfirmSubmit}
                        disabled={bulkLoading || !!excelError}
                        startIcon={bulkLoading ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
                        sx={{
                            bgcolor: (stats?.retrocesos?.length ?? 0) > 0 ? "#d32f2f" : "#65944F",
                            textTransform: "none",
                            borderRadius: 2,
                            "&:hover": { bgcolor: (stats?.retrocesos?.length ?? 0) > 0 ? "#b71c1c" : "#558040" }
                        }}
                    >
                        {bulkLoading ? "Guardando..." : "Confirmar Importación"}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}