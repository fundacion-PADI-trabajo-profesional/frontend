import { describe, it, expect, beforeEach } from "vitest";
import {
  canEquipoPadi,
  canEncargadoZona,
  canDirector,
  permissions,
  getCurrentUser,
  hasPermission,
} from "../../utils/permissions";
import { setUserInStorage } from "../setup";

// ─── canEquipoPadi ────────────────────────────────────────────────────────────
describe("canEquipoPadi", () => {
  it("returns true for equipo_padi", () => {
    expect(canEquipoPadi("equipo_padi")).toBe(true);
  });
  it.each(["director", "encargado_zona", "docente"])(
    "returns false for %s",
    (rol) => {
      expect(canEquipoPadi(rol)).toBe(false);
    }
  );
});

// ─── canEncargadoZona ─────────────────────────────────────────────────────────
describe("canEncargadoZona", () => {
  it("returns true for encargado_zona", () => {
    expect(canEncargadoZona("encargado_zona")).toBe(true);
  });
  it.each(["equipo_padi", "director", "docente"])(
    "returns false for %s",
    (rol) => {
      expect(canEncargadoZona(rol)).toBe(false);
    }
  );
});

// ─── canDirector ─────────────────────────────────────────────────────────────
describe("canDirector", () => {
  it("returns true for director", () => {
    expect(canDirector("director")).toBe(true);
  });
  it.each(["equipo_padi", "encargado_zona", "docente"])(
    "returns false for %s",
    (rol) => {
      expect(canDirector(rol)).toBe(false);
    }
  );
});

// ─── permissions.createEvaluacion ────────────────────────────────────────────
describe("permissions.createEvaluacion", () => {
  it.each(["equipo_padi", "encargado_zona", "director", "docente"])(
    "permite %s",
    (rol) => {
      expect(permissions.createEvaluacion(rol)).toBe(true);
    }
  );
});

// ─── permissions.startEvaluacion ─────────────────────────────────────────────
describe("permissions.startEvaluacion", () => {
  it.each(["equipo_padi", "encargado_zona", "director", "docente"])(
    "permite %s",
    (rol) => {
      expect(permissions.startEvaluacion(rol)).toBe(true);
    }
  );
  it("no permite rol desconocido", () => {
    expect(permissions.startEvaluacion("otro")).toBe(false);
  });
});

// ─── permissions.createEstudiante ────────────────────────────────────────────
describe("permissions.createEstudiante", () => {
  it.each(["equipo_padi", "encargado_zona", "director", "docente"])(
    "permite %s",
    (rol) => {
      expect(permissions.createEstudiante(rol)).toBe(true);
    }
  );
  it("no permite rol desconocido", () => {
    expect(permissions.createEstudiante("otro")).toBe(false);
  });
});

// ─── permissions.assignDocenteAula ───────────────────────────────────────────
describe("permissions.assignDocenteAula", () => {
  it.each(["equipo_padi", "encargado_zona", "director"])("permite %s", (rol) => {
    expect(permissions.assignDocenteAula(rol)).toBe(true);
  });
  it("no permite docente", () => {
    expect(permissions.assignDocenteAula("docente")).toBe(false);
  });
});

// ─── permissions.assignEstudianteAula ────────────────────────────────────────
describe("permissions.assignEstudianteAula", () => {
  it.each(["equipo_padi", "encargado_zona", "director"])("permite %s", (rol) => {
    expect(permissions.assignEstudianteAula(rol)).toBe(true);
  });
  it("no permite docente", () => {
    expect(permissions.assignEstudianteAula("docente")).toBe(false);
  });
});

// ─── permissions.deleteEvaluacion ────────────────────────────────────────────
describe("permissions.deleteEvaluacion", () => {
  it.each(["equipo_padi", "encargado_zona", "docente"])("permite %s", (rol) => {
    expect(permissions.deleteEvaluacion(rol)).toBe(true);
  });
  it("no permite director", () => {
    expect(permissions.deleteEvaluacion("director")).toBe(false);
  });
});

// ─── permissions.createAula ──────────────────────────────────────────────────
describe("permissions.createAula", () => {
  it.each(["equipo_padi", "encargado_zona", "director"])("permite %s", (rol) => {
    expect(permissions.createAula(rol)).toBe(true);
  });
  it("no permite docente", () => {
    expect(permissions.createAula("docente")).toBe(false);
  });
});

// ─── permissions.viewAllEscuelas ─────────────────────────────────────────────
describe("permissions.viewAllEscuelas", () => {
  it("solo permite equipo_padi", () => {
    expect(permissions.viewAllEscuelas("equipo_padi")).toBe(true);
  });
  it.each(["director", "encargado_zona", "docente"])(
    "no permite %s",
    (rol) => {
      expect(permissions.viewAllEscuelas(rol)).toBe(false);
    }
  );
});

// ─── permissions.viewZonas ───────────────────────────────────────────────────
describe("permissions.viewZonas", () => {
  it.each(["equipo_padi", "encargado_zona"])("permite %s", (rol) => {
    expect(permissions.viewZonas(rol)).toBe(true);
  });
  it.each(["director", "docente"])("no permite %s", (rol) => {
    expect(permissions.viewZonas(rol)).toBe(false);
  });
});

// ─── getCurrentUser ──────────────────────────────────────────────────────────
describe("getCurrentUser", () => {
  it("returns null when localStorage is empty", () => {
    expect(getCurrentUser()).toBeNull();
  });

  it("returns parsed user from localStorage", () => {
    setUserInStorage({ id: "u-1", rol: "director" });
    const user = getCurrentUser();
    expect(user).not.toBeNull();
    expect(user?.id).toBe("u-1");
    expect(user?.rol).toBe("director");
  });

  it("returns null when stored value is not valid JSON", () => {
    localStorage.setItem("padiUser", "not-json{{{");
    expect(getCurrentUser()).toBeNull();
  });
});

// ─── hasPermission ───────────────────────────────────────────────────────────
describe("hasPermission", () => {
  it("returns false when no user is stored", () => {
    expect(hasPermission("createEvaluacion")).toBe(false);
  });

  it("returns true when user has the permission", () => {
    setUserInStorage({ rol: "equipo_padi" });
    expect(hasPermission("viewAllEscuelas")).toBe(true);
  });

  it("returns false when user lacks the permission", () => {
    setUserInStorage({ rol: "docente" });
    expect(hasPermission("createAula")).toBe(false);
  });
});
