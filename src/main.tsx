// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css"; // Tu archivo de CSS

// 👇 ¡ESTAS 3 LÍNEAS SON CLAVE!
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./theme"; // 1. Importa tu tema

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* 2. Envuelve TODO con el ThemeProvider */}
    <ThemeProvider theme={theme}>
      {/* 3. CssBaseline aplica tu color de fondo y normaliza estilos */}
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
