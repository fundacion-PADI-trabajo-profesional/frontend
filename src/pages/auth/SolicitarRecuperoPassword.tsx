import { useState, type FormEvent } from "react";
import { Box, TextField, Button, Typography, Alert, InputAdornment } from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import { requestPasswordReset } from "../../api/auth";

type ResultState = "success" | "not_registered" | null;

export default function SolicitarRecuperoPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResultState>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("El correo electrónico es obligatorio.");
      return;
    }

    setIsLoading(true);

    try {
      await requestPasswordReset(email.trim());
      setResult("success");
    } catch (err: any) {
      const msg: string = err.message || "";
      if (msg === "EMAIL_NOT_REGISTERED") {
        // Email no registrado en el sistema → indicar que contacte al Equipo PADI
        setResult("not_registered");
      } else if (msg.toLowerCase().includes("demasiados")) {
        // CA5: rate limit — mostrar error específico sin cambiar la pantalla
        setError(msg);
      } else {
        // Cualquier otro error inesperado → mensaje genérico de éxito (no revelar detalles)
        setResult("success");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f4f6f8",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 450,
          p: 4,
          bgcolor: "white",
          borderRadius: 4,
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        }}
      >
        {/* Botón volver */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/login")}
          sx={{
            color: "#555",
            textTransform: "none",
            mb: 2,
            p: 0,
            "&:hover": { bgcolor: "transparent", color: "#000" },
          }}
        >
          Volver al login
        </Button>

        <Typography
          variant="h5"
          align="center"
          gutterBottom
          sx={{ fontWeight: 700, mb: 1, color: "#333" }}
        >
          Recuperar contraseña
        </Typography>

        {/* Formulario principal */}
        {result === null && (
          <>
            <Typography variant="body2" align="center" sx={{ color: "#666", mb: 3 }}>
              Ingresá tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                type="email"
                placeholder="Tu correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon sx={{ color: "#A3BE54" }} />
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading}
                sx={{
                  py: 1.5,
                  bgcolor: "#65944F",
                  fontWeight: 700,
                  textTransform: "none",
                  borderRadius: 2,
                  "&:hover": { bgcolor: "#558040" },
                }}
              >
                {isLoading ? "Enviando..." : "Enviar enlace de recuperación"}
              </Button>
            </form>
          </>
        )}

        {/* Email enviado con éxito */}
        {result === "success" && (
          <>
            <Alert severity="success" sx={{ mb: 3 }}>
              Recibirás un enlace de recuperación en breve.
              Revisá tu bandeja de entrada (y la carpeta de spam).
            </Alert>

            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate("/login")}
              sx={{
                py: 1.5,
                textTransform: "none",
                borderRadius: 2,
                borderColor: "#65944F",
                color: "#65944F",
                fontWeight: 600,
                "&:hover": { borderColor: "#558040", color: "#558040", bgcolor: "transparent" },
              }}
            >
              Volver al login
            </Button>
          </>
        )}

        {/* Email no registrado en el sistema */}
        {result === "not_registered" && (
          <>
            <Alert severity="warning" sx={{ mb: 3 }}>
              Este correo no está registrado en el sistema. Para obtener acceso,
              comunicate con el <strong>Equipo PADI</strong>.
            </Alert>

            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate("/login")}
              sx={{
                py: 1.5,
                textTransform: "none",
                borderRadius: 2,
                borderColor: "#65944F",
                color: "#65944F",
                fontWeight: 600,
                "&:hover": { borderColor: "#558040", color: "#558040", bgcolor: "transparent" },
              }}
            >
              Volver al login
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
}
