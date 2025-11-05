// src/api/auth.ts

// This URL comes from your .env file
const API_URL = import.meta.env.VITE_API_URL;

/**
 * Sends login credentials to the backend.
 * The backend should return { user, session, profile } on success.
 */
export async function login(email: string, password: string) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Credenciales inválidas");
  }

  // Backend returns { user, session, profile }
  return { user: data.user, profile: data.profile };
}

/**
 * Sends new user data to the backend for registration.
 */
export async function register(
  email: string,
  password: string,
  nombre: string,
  apellido: string,
  rol: string
) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, nombre, apellido, rol }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "No se pudo crear la cuenta");
  }
  return data.user;
}