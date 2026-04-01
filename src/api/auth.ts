const API_URL = import.meta.env.VITE_API_URL;

/**
 * Helper para obtener el token almacenado.
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/**
 * Objeto API estandarizado para usar en toda la app.
 * Reemplaza a axios y fetch manual.
 * Se encarga de poner la URL base y el Token automáticamente.
 */
export const api = {
  get: async (endpoint: string) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  post: async (endpoint: string, body: any) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  put: async (endpoint: string, body: any) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  delete: async (endpoint: string) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

/**
 * Maneja la respuesta del fetch para simular un formato standard (como axios)
 * y lanza errores si falla.
 */
async function handleResponse(response: Response) {
  const data = await response.json().catch(() => ({})); // Previene error si body viene vacío

  if (!response.ok) {
    // Si el token expiró (401), podrías redirigir al login aquí
    if (response.status === 401) {
      // Opcional: window.location.href = "/login";
      console.warn("Sesión expirada o inválida");
    }
    throw new Error(data.message || data.description || "Error en la petición");
  }

  // Devolvemos { data: ... } para ser consistentes con la estructura que espera tu app
  // Si tu backend devuelve { success: true, data: [...] }, esto lo pasa directo.
  return { data };
}

// --- AUTENTICACIÓN ---

/**
 * Envía credenciales.
 * Actualizado: Ahora devuelve también la SESSION para poder guardar el token.
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

  return {
    user: data.user,
    profile: data.profile,
    session: data.session
  };
}

export async function register(
  email: string,
  password: string,
  nombre: string,
  apellido: string,
  rol: string,
  zona?: string
) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, nombre, apellido, rol, zona }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "No se pudo crear la cuenta");
  }
  return data.user;
}

export async function updateProfileData(userId: string, nombre: string, apellido: string) {
  const response = await api.put("/auth/profile", { userId, nombre, apellido });
  return response.data;
}

export async function requestPasswordReset(email: string) {
  const response = await api.post("/auth/reset-password-request", { email });
  return response.data;
}

export async function updatePasswordUser(accessToken: string, refreshToken: string, newPassword: string) {
  const response = await fetch(`${API_URL}/auth/update-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken, refreshToken, newPassword }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Error al actualizar la contraseña");
  }
  return data;
}