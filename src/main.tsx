// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

// Tema básico para MUI (puedes extenderlo o reemplazar por tu `theme.ts`)
const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#5c7cfa" },
    secondary: { main: "#A3BE54" },
  },
  typography: {
    fontFamily: "'Montserrat', sans-serif",
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);