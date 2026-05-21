import { vi, afterEach } from "vitest";

// --- localStorage mock para entorno Node ---
const store: Record<string, string> = {};

const localStorageMock = {
  getItem: (key: string): string | null => store[key] ?? null,
  setItem: (key: string, value: string): void => {
    store[key] = value;
  },
  removeItem: (key: string): void => {
    delete store[key];
  },
  clear: (): void => {
    Object.keys(store).forEach((k) => delete store[k]);
  },
};

vi.stubGlobal("localStorage", localStorageMock);

// --- fetch mock global (cada test sobreescribe el valor de retorno) ---
vi.stubGlobal("fetch", vi.fn());

// --- Helpers exportados para usar en los tests ---
export function setUserInStorage(user: {
  id?: string;
  rol: string;
  escuela_id?: string;
  nombre?: string;
  apellido?: string;
}) {
  localStorageMock.setItem(
    "padiUser",
    JSON.stringify({ id: "test-user-id", nombre: "Test", apellido: "User", ...user })
  );
}

export function clearStorage() {
  localStorageMock.clear();
}

/** Crea un Response falso con JSON body */
export function mockFetchResponse(data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => data,
  } as Response;
}

afterEach(() => {
  localStorageMock.clear();
  vi.restoreAllMocks();
});
