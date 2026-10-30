import { Box, Button, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MarkEmailUnreadOutlinedIcon from "@mui/icons-material/MarkEmailUnreadOutlined";
import { useNavigate } from "react-router-dom";
import FormularioReenvioInvitacion from "../../components/auth/FormularioReenvioInvitacion";

/** Página pública: pedir de nuevo el link de activación cuando venció o no llegó. */
export default function ReenviarInvitacion() {
    const navigate = useNavigate();
    return (
        <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#f4f6f8" }}>
            <Box sx={{ width: "100%", maxWidth: 450, p: 4, bgcolor: "white", borderRadius: 4, boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate("/login")}
                    sx={{ color: "#555", textTransform: "none", mb: 2, p: 0, "&:hover": { bgcolor: "transparent", color: "#000" } }}
                >
                    Volver al login
                </Button>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                    <MarkEmailUnreadOutlinedIcon sx={{ color: "#65944F", fontSize: 32 }} />
                    <Typography variant="h5" sx={{ fontWeight: 700, color: "#111827" }}>Pedir un link de activación nuevo</Typography>
                </Box>
                <FormularioReenvioInvitacion descripcion="Si te invitaron a PADI y el link del correo venció o no te llegó, escribí tu correo y te mandamos otro. Los links duran 24 horas." />
            </Box>
        </Box>
    );
}
