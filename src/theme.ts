// src/theme.ts
import { createTheme } from "@mui/material/styles";

// Tus colores
const PADI_COLORS = {
  azul: "#375E9E",
  verde: "#B8DB7B",
  grisClaro: "#f4f7f6",
};

const theme = createTheme({
  palette: {
    primary: {
      main: PADI_COLORS.azul, // Este será el color del botón
    },
    secondary: {
      main: PADI_COLORS.verde, // Este será el color del "Tip"
    },
    background: {
      default: PADI_COLORS.grisClaro, // El fondo de la app
    },
  },
  // --- SECCIÓN MODIFICADA ---
  typography: {
    // 1. Cambiamos la fuente principal
    fontFamily: "'Montserrat', sans-serif",

    // 2. Definimos los pesos para los títulos
    h3: {
      fontWeight: 600, // Ej: "Nuestra Misión"
    },
    h5: {
      fontWeight: 600, // Ej: "Formación a Docentes"
    },
    // 3. (Opcional) Definir el peso del cuerpo de texto
    body1: {
      fontWeight: 400, // Texto de párrafo
    },

    // 4. Tus estilos de botón (los mantuve)
    button: {
      textTransform: "none",
      fontWeight: "bold", // 'bold' para Montserrat suele ser 700
    },
  },
  components: {
    // Estilos por defecto para componentes
    MuiCard: {
      styleOverrides: {
        root: {
          // Estos estilos NO se aplican a tu login porque usas
          // el componente <Paper> de Grid, no <Card>
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontSize: "1rem",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          // Esto asegura que el label y el borde usen el color 'primary'
          "& .MuiOutlinedInput-root": {
            "&.Mui-focused fieldset": {
              borderColor: PADI_COLORS.azul,
            },
          },
          "& .MuiInputLabel-root.Mui-focused": {
            color: PADI_COLORS.azul,
          },
        },
      },
    },
  },
});

export default theme; // 👈 ¡ASEGÚRATE DE TENER ESTO!
