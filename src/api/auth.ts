const API_URL = import.meta.env.VITE_API_URL;

/**
 * Flag para evitar múltiples refreshes simultáneos.
 */
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Helper para obtener el token almacenado.
 */
export const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/**
 * Intenta renovar el access_token usando el refresh_token almacenado.
 * Llama al endpoint del backend /auth/refresh-token.
 * Retorna el nuevo access_token o null si falla.
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    console.warn("No hay refresh token almacenado.");
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      console.warn("No se pudo renovar la sesión.");
      return null;
    }

    const data = await response.json();

    if (data.access_token) {
      localStorage.setItem("token", data.access_token);
    }
    if (data.refresh_token) {
      localStorage.setItem("refreshToken", data.refresh_token);
    }

    return data.access_token || null;
  } catch (error) {
    console.error("Error al renovar token:", error);
    return null;
  }
}

/**
 * Wrapper que garantiza que solo se haga un refresh a la vez,
 * incluso si múltiples requests fallan con 401 simultáneamente.
 */
async function getRefreshedToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = refreshAccessToken().finally(() => {
    isRefreshing = false;
    refreshPromise = null;
  });

  return refreshPromise;
}

/**
 * Maneja la respuesta del fetch. Si recibe 401, intenta refresh y reintenta UNA vez.
 */
async function handleResponse(response: Response, retryFn?: () => Promise<Response>) {
  if (response.status === 401 && retryFn) {
    // Intentar renovar el token
    const newToken = await getRefreshedToken();

    if (newToken) {
      // Reintentar la request original con el nuevo token
      const retryResponse = await retryFn();
      const retryData = await retryResponse.json().catch(() => ({}));

      if (!retryResponse.ok) {
        if (retryResponse.status === 401) {
          // El refresh no sirvió, forzar logout
          forceLogout();
        }
        throw new Error(retryData.message || retryData.description || "Error en la petición");
      }

      return { data: retryData };
    } else {
      // No se pudo renovar, forzar logout
      forceLogout();
      throw new Error("Sesión expirada. Por favor, iniciá sesión nuevamente.");
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.description || "Error en la petición");
  }

  return { data };
}

/**
 * Limpia tokens y redirige al login.
 */
function forceLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("padiUser");
  localStorage.removeItem("padiProfile");
  localStorage.removeItem("userRole");
  window.location.href = "/login";
}

/**
 * Objeto API estandarizado para usar en toda la app.
 * Incluye refresh automático de token ante respuestas 401.
 */
export const api = {
  get: async (endpoint: string) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse(response, () =>
      fetch(`${API_URL}${endpoint}`, {
        method: "GET",
        headers: getAuthHeaders(), // getAuthHeaders() tomará el token ya actualizado
      })
    );
  },

  post: async (endpoint: string, body: any) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(response, () =>
      fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      })
    );
  },

  put: async (endpoint: string, body: any) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse(response, () =>
      fetch(`${API_URL}${endpoint}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      })
    );
  },

  delete: async (endpoint: string) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(response, () =>
      fetch(`${API_URL}${endpoint}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
    );
  },
};

// --- AUTENTICACIÓN ---

/**
 * Envía credenciales.
 * Devuelve user, profile y session (con access_token y refresh_token).
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
    session: data.session,
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

// --- ADMINISTRACIÓN DE USUARIOS (solo equipo_padi) ---

export interface CreateUserPayload {
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
}

/**
 * Crea un único usuario desde el panel admin.
 */
export async function adminCreateUser(data: CreateUserPayload) {
  const response = await api.post("/admin/users", data);
  return response.data;
}

/**
 * Crea múltiples usuarios en lote.
 */
export async function adminCreateUsersBulk(users: CreateUserPayload[]) {
  const response = await api.post("/admin/users/bulk", { users });
  return response.data;
}

/**
 * Obtiene la lista de todos los usuarios.
 */
export async function adminListUsers() {
  const response = await api.get("/admin/users");
  return response.data;
}

/**
 * Elimina un usuario por ID.
 */
export async function adminDeleteUser(userId: string) {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
}
