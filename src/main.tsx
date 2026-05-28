// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";

import { setupFetchInterceptor } from "./api/auth";
import { ThemeProvider, createTheme, responsiveFontSizes } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

setupFetchInterceptor();
import CssBaseline from "@mui/material/CssBaseline";

const queryClient = new QueryClient();

let theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#5c7cfa" },
    secondary: { main: "#A3BE54" },
  },
  typography: {
    fontFamily: "'Montserrat', sans-serif",
  },
});

theme = responsiveFontSizes(theme);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>
);