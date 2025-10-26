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
  typography: {
    // Puedes agregar una fuente de Google Fonts si quieres
    fontFamily: "Roboto, sans-serif",
    button: {
      textTransform: "none", // Para que los botones no estén en MAYÚSCULAS
      fontWeight: "bold",
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
