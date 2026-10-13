import { Box, Button, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";

interface Props {
    areaNombre: string;
    onClose: () => void;
    /** Si no viene, no se puede corregir (por ejemplo, alumno dado de baja). */
    onCorrect?: () => void;
}

/** Barra superior de la revisión de un área. Queda fija arriba al scrollear para que "Corregir respuestas" siempre esté a mano. */
export default function BarraRevision({ areaNombre, onClose, onCorrect }: Props) {
    return (
        <Box sx={{ px: 2, py: 1, display: "flex", alignItems: "center", borderBottom: "1px solid #eee", position: "sticky", top: 0, zIndex: 2, bgcolor: "#fff" }}>
            <IconButton edge="start" color="inherit" onClick={onClose} aria-label="Cerrar revisión">
                <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1, fontWeight: 700 }} variant="h6" noWrap>
                Revisión: {areaNombre}
            </Typography>
            {onCorrect && (
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={onCorrect}
                    sx={{ textTransform: "none", borderColor: "#5c7cfa", color: "#5c7cfa", whiteSpace: "nowrap" }}
                >
                    Corregir respuestas
                </Button>
            )}
        </Box>
    );
}
