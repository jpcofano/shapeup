import { describe, it, expect } from "vitest";
import { findMemberByEmail } from "./resolveMemberId";
import type { FamiliaConfig } from "../types/models";

const miembros: FamiliaConfig["miembros"] = {
  juanpablo: { nombre: "Juan Pablo", rol: "padre", mails: ["jp@example.com", "juanpablo@work.com"] },
  maria:     { nombre: "María",      rol: "madre", mails: ["maria@example.com"] },
  sofia:     { nombre: "Sofía",      rol: "hija",  mails: ["sofia@example.com"] },
  federico:  { nombre: "Federico",   rol: "hijo",  mails: ["fede@example.com"] },
};

describe("findMemberByEmail", () => {
  it("resuelve el memberId cuando el email coincide", () => {
    expect(findMemberByEmail(miembros, "jp@example.com")).toBe("juanpablo");
    expect(findMemberByEmail(miembros, "maria@example.com")).toBe("maria");
  });

  it("resuelve cuando el miembro tiene múltiples emails", () => {
    expect(findMemberByEmail(miembros, "juanpablo@work.com")).toBe("juanpablo");
  });

  it("es case-insensitive", () => {
    expect(findMemberByEmail(miembros, "JP@EXAMPLE.COM")).toBe("juanpablo");
    expect(findMemberByEmail(miembros, "Maria@Example.com")).toBe("maria");
  });

  it("devuelve null cuando el email no está en la whitelist", () => {
    expect(findMemberByEmail(miembros, "extraño@example.com")).toBeNull();
    expect(findMemberByEmail(miembros, "")).toBeNull();
  });
});
