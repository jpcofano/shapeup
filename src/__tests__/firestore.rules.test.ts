// @vitest-environment node
// Tests de reglas de seguridad de Firestore contra el emulador local.
// Requiere: firebase emulators:start --only firestore (o usar npm run test:rules).
import {
  initializeTestEnvironment, assertFails, assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { beforeAll, beforeEach, afterAll, describe, it } from "vitest";

const __dir    = dirname(fileURLToPath(import.meta.url));
const RULES    = readFileSync(resolve(__dir, "../../firestore.rules"), "utf8");
const PROJECT  = "shapeup-test";

// ── Datos de familia (coindicen con seed-config.ts) ───────────────────────────
const FAMILIA = {
  miembros: {
    juanpablo: { nombre: "Juan Pablo", rol: "padre", mails: ["jpcofano@gmail.com"] },
    maria:     { nombre: "María",      rol: "madre", mails: ["marialascano@gmail.com", "maria.lascano@accenture.com"] },
    sofia:     { nombre: "Sofía",      rol: "hija",  mails: ["sofiacofano@gmail.com"] },
    federico:  { nombre: "Federico",   rol: "hijo",  mails: ["fedecofano1@gmail.com"] },
  },
  owner: "juanpablo",
  timezone: "America/Argentina/Buenos_Aires",
  semanaArrancaEn: "lunes",
};

const EMAIL: Record<string, string> = {
  juanpablo: "jpcofano@gmail.com",
  maria:     "marialascano@gmail.com",
  sofia:     "sofiacofano@gmail.com",
  federico:  "fedecofano1@gmail.com",
  stranger:  "stranger@example.com",
};

let env: RulesTestEnvironment;

// ── Setup / teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: { host: "127.0.0.1", port: 8080, rules: RULES },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
  // /config/familia es necesaria para que las reglas puedan resolver memberId.
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "config", "familia"), FAMILIA);
  });
});

afterAll(async () => { await env.cleanup(); });

// ── Helpers ───────────────────────────────────────────────────────────────────

function as(member: string) {
  return env.authenticatedContext(member, { email: EMAIL[member] });
}
const stranger  = () => env.authenticatedContext("stranger", { email: EMAIL.stranger });
const anonymous = () => env.unauthenticatedContext();

// ── Ejercicios ────────────────────────────────────────────────────────────────

describe("ejercicios", () => {
  it("miembro puede leer",           () => assertSucceeds(getDoc(doc(as("maria").firestore(),     "ejercicios", "EJ-0001"))));
  it("no-miembro no puede leer",     () => assertFails(  getDoc(doc(stranger().firestore(),        "ejercicios", "EJ-0001"))));
  it("anónimo no puede leer",        () => assertFails(  getDoc(doc(anonymous().firestore(),       "ejercicios", "EJ-0001"))));
  it("owner puede escribir",         () => assertSucceeds(setDoc(doc(as("juanpablo").firestore(),  "ejercicios", "EJ-9999"), { nombre: "Test" })));
  it("miembro no-owner no escribe",  () => assertFails(  setDoc(doc(as("sofia").firestore(),       "ejercicios", "EJ-9999"), { nombre: "Test" })));
  it("no-miembro no puede escribir", () => assertFails(  setDoc(doc(stranger().firestore(),        "ejercicios", "EJ-9999"), { nombre: "Test" })));
});

// ── Rutinas ───────────────────────────────────────────────────────────────────

describe("rutinas", () => {
  it("miembro puede leer",       () => assertSucceeds(getDoc(doc(as("sofia").firestore(),    "rutinas", "RUT-0001"))));
  it("miembro puede escribir",   () => assertSucceeds(setDoc(doc(as("sofia").firestore(),    "rutinas", "RUT-9999"), { nombre: "Test" })));
  it("no-miembro no puede leer", () => assertFails(  getDoc(doc(stranger().firestore(),      "rutinas", "RUT-0001"))));
  it("anónimo no puede leer",    () => assertFails(  getDoc(doc(anonymous().firestore(),     "rutinas", "RUT-0001"))));
});

// ── Programas ─────────────────────────────────────────────────────────────────

describe("programas", () => {
  it("miembro puede leer",          () => assertSucceeds(getDoc(doc(as("federico").firestore(), "programas", "PRG-0001"))));
  it("miembro puede escribir",      () => assertSucceeds(setDoc(doc(as("federico").firestore(), "programas", "PRG-9999"), { nombre: "Test" })));
  it("no-miembro no puede escribir",() => assertFails(  setDoc(doc(stranger().firestore(),      "programas", "PRG-9999"), { nombre: "Test" })));
});

// ── Config ────────────────────────────────────────────────────────────────────

describe("config", () => {
  it("miembro puede leer /config/familia",          () => assertSucceeds(getDoc(doc(as("maria").firestore(),     "config", "familia"))));
  it("no-miembro no puede leer /config/familia",    () => assertFails(  getDoc(doc(stranger().firestore(),        "config", "familia"))));
  it("anónimo no puede leer /config/familia",       () => assertFails(  getDoc(doc(anonymous().firestore(),       "config", "familia"))));
  it("miembro puede leer /config/visibilidad",      () => assertSucceeds(getDoc(doc(as("sofia").firestore(),     "config", "visibilidad"))));
  it("owner puede escribir /config/visibilidad",    () => assertSucceeds(setDoc(doc(as("juanpablo").firestore(), "config", "visibilidad"), { test: true })));
  it("no-owner no puede escribir /config/visibilidad",() => assertFails(setDoc(doc(as("maria").firestore(),      "config", "visibilidad"), { test: true })));
  it("cualquier miembro puede escribir /config/perfiles", () => assertSucceeds(setDoc(doc(as("maria").firestore(), "config", "perfiles"), { maria: { color: "#fff" } })));
  it("owner puede escribir /config/metodologia",    () => assertSucceeds(setDoc(doc(as("juanpablo").firestore(), "config", "metodologia"), { version: 1 })));
  it("no-owner no puede escribir /config/metodologia",() => assertFails(setDoc(doc(as("federico").firestore(),   "config", "metodologia"), { version: 1 })));
});

// ── Users ─────────────────────────────────────────────────────────────────────

describe("users", () => {
  it("miembro puede leer su propio doc",        () => assertSucceeds(getDoc(doc(as("juanpablo").firestore(), "users", "juanpablo"))));
  it("miembro no puede leer doc ajeno",         () => assertFails(  getDoc(doc(as("sofia").firestore(),      "users", "juanpablo"))));
  it("miembro puede crear su propio user doc",  () => assertSucceeds(setDoc(doc(as("maria").firestore(),     "users", "maria"), { uid: "maria", email: EMAIL.maria, memberId: "maria", nombre: "María", ultimoLogin: new Date() })));
  it("no-miembro no puede crear user doc",      () => assertFails(  setDoc(doc(stranger().firestore(),        "users", "stranger"), { uid: "stranger" })));
});

// ── Historial y sesiones ──────────────────────────────────────────────────────

describe("historial y sesiones", () => {
  it("miembro puede leer historial",    () => assertSucceeds(getDoc(doc(as("federico").firestore(), "historial", "H-001"))));
  it("no-miembro no puede leer",        () => assertFails(  getDoc(doc(stranger().firestore(),       "historial", "H-001"))));
  it("miembro puede escribir sesiones", () => assertSucceeds(setDoc(doc(as("maria").firestore(),     "sesiones", "SES-001"), { miembro: "maria" })));
  it("miembro puede leer mediciones",   () => assertSucceeds(getDoc(doc(as("sofia").firestore(),     "mediciones", "MED-001"))));
  it("miembro puede leer cardio",       () => assertSucceeds(getDoc(doc(as("juanpablo").firestore(), "cardio", "CAR-001"))));
});

// ── Login (resolución memberId via get() interno) ─────────────────────────────

describe("resolución de memberId (login)", () => {
  it("email de miembro permite leer ejercicios (get /config/familia OK)", () =>
    assertSucceeds(getDoc(doc(as("juanpablo").firestore(), "ejercicios", "EJ-0001"))));
  it("email fuera de familia bloquea lectura de ejercicios",              () =>
    assertFails(  getDoc(doc(stranger().firestore(),        "ejercicios", "EJ-0001"))));
  it("email alternativo de maría también funciona", () => {
    const ctx = env.authenticatedContext("maria2", { email: "maria.lascano@accenture.com" });
    return assertSucceeds(getDoc(doc(ctx.firestore(), "ejercicios", "EJ-0001")));
  });
});
