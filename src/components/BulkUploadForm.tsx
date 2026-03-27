import React, { useState } from 'react';
import { Box, Button, Typography, CircularProgress, Alert, Paper } from '@mui/material';
// import UploadFileIcon from '@mui/icons-material/UploadFile';
import * as XLSX from 'xlsx';
import { bulkCreateEstudiantes } from '../api/estudiantes';

// Definimos la estructura de las Props para quitar el error ts(7031)
interface BulkUploadProps {
    onSuccess: (data: any[]) => void;
    onCancel: () => void;
}

export default function BulkUploadForm({ onCancel, onSuccess }: BulkUploadProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary', cellDates: true }); 
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws, { raw: false, defval: null });

                const estudiantes = data.map((row: any) => {
                let fecha = row["Fecha Nacimiento"];
                
                // Si la fecha viene como string o formato extraño, intentamos normalizarla
                const dateObj = new Date(fecha);
                const finalDate = isNaN(dateObj.getTime()) ? null : dateObj.toISOString();

                return {
                    dni: String(row["DNI"]),
                    nombre: row["Nombre"],
                    apellido: row["Apellido"],
                    fecha_nacimiento: finalDate, // Enviamos ISOString que el backend entiende perfecto
                    genero_id: row["Genero"],
                    sala_id: Number(row["SalaID"]),
                    escuela_id: row["EscuelaID"] // Como lo agregaste al final
                };
            });

            if (estudiantes.some(e => !e.escuela_id)) {
                setError("Hay alumnos sin EscuelaID válido. Asegurate de que el Excel esté guardado con los valores calculados.");
                setLoading(false);
                return;
            }

            // Validar si hay fechas inválidas antes de enviar
            if (estudiantes.some(e => !e.fecha_nacimiento)) {
                setError("Hay alumnos con fechas de nacimiento inválidas. Usa el formato AAAA-MM-DD.");
                setLoading(false);
                return;
            }

            const response = await bulkCreateEstudiantes({ estudiantes });
                
            onSuccess(response.data); 

            } catch (err: any) {
                const serverMsg = err.response?.data?.message || err.message || "Error desconocido";
                setError(serverMsg);
            } finally {
                setLoading(false);
            }
        };

        reader.readAsBinaryString(file);
    };

    return (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>Carga Masiva de Estudiantes</Typography>
            <Typography color="textSecondary" sx={{ mb: 3 }}>
                Sube un archivo Excel (.xlsx) con las columnas: DNI, Nombre, Apellido, FechaNacimiento, Genero, SalaID.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box sx={{ border: '2px dashed #ccc', py: 5, borderRadius: 2, mb: 3 }}>
                <Button variant="contained" component="label" disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : "Seleccionar Archivo Excel"}
                    <input type="file" hidden accept=".xlsx, .xls" onChange={handleFileUpload} />
                </Button>
            </Box>

            <Button onClick={onCancel}>Cancelar</Button>
        </Paper>
    );
}