import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { ThemeName } from "../contexts/ThemeProvider";
import type { AnalisisGuardado, Historial, PerfilMiembro } from "../types/models";
import { CabeceraMarcas } from "../components/historial/CabeceraMarcas";
import { AnalisisSesion } from "../components/historial/AnalisisSesion";
import { calcularEnriquecimiento } from "../lib/enriquecerImport";
import { zonasDesdeFcMax } from "../lib/zonas";
import { CURVA, DATAUUID, HISTORIAL, SESION_SAMSUNG } from "../lib/__fixtures__/sesionTestigo20260927";

// QA de la pantalla de la sesión (P105, para capturas sin login). Los mismos
// componentes que HistorialDetalle (CabeceraMarcas y AnalisisSesion), sin
// lecturas de Firestore: la sesión testigo del 27/09, enriquecida por el camino
// real en el navegador. Los análisis son inventados. Tema y modo se eligen en
// la página o por la URL: /qa/sesion?tema=ion&modo=oscuro.
//
// La sesión lleva un id que no existe: los botones de AnalisisSesion («Validar
// y guardar», «Sacar el análisis») escriben por id, y con una sesión iniciada
// en el navegador no tienen que tocar la sesión real del 27/09.

/** Un id que no existe en /historial: guardar o borrar falla sin tocar nada. */
const ID_QA = "H-QA-SESION";

const TEMAS: ThemeName[] = ["ion", "volt", "blaze", "pulse", "indigo"];
const MODOS = [{ id: "oscuro", modo: "dark" }, { id: "claro", modo: "light" }] as const;

/** La sesión testigo, enriquecida como lo hace la sincronización. */
export function sesionTestigo(): Historial {
  const perfil = { fcMaxTeorica: 169, zonasFC: zonasDesdeFcMax(169) } as PerfilMiembro;
  const u = calcularEnriquecimiento([HISTORIAL], {
    sesionesSamsung: [SESION_SAMSUNG], liveData: { [DATAUUID]: CURVA }, shapeUpCustomId: "ShapeUp", muestrasFcCrudas: [],
  }, perfil).updates[0];
  return { ...HISTORIAL, idHist: ID_QA, idSesion: "SES-QA", biometria: u.biometria, bloques: u.bloques ?? HISTORIAL.bloques };
}

const ANALISIS_3 = {
  version: 3, tipo: "sesion", idHist: ID_QA, generadoEn: "2026-10-21", modelo: "inventado (QA)",
  veredicto: "Sesión sólida: casi toda en zona alta, con buenas bajadas entre bloques.",
  destacados: ["Sostuviste un tramo largo arriba de Z4.", "Bajaste rápido después de los picos."],
  marcasAnalisis: [
    { refMarca: "tramoSostenido", tono: "positivo", texto: "El tramo más largo de la sesión." },
    { tramo: { inicioS: 480, finS: 1320 }, tono: "atencion", texto: "Acá la FC quedó más abajo que en el resto." },
  ],
  resumen: "Texto inventado para QA: una sesión de VR de 49 minutos, la mayor parte en Z4.",
  hallazgos: [{ tema: "intensidad", detalle: "Mucho tiempo en zona alta.", evidencia: "inventado" }],
  sugerencias: [], banderas: [], preguntas: [], datosFaltantes: [],
  armado: { versionPrompt: 4, versionEsquema: 3, ventana: null, versionEnriquecimiento: 9 },
  armadoOrigen: "eco", cargadoMs: Date.UTC(2026, 9, 21, 12),
} as unknown as AnalisisGuardado;

const ANALISIS_2 = {
  version: 2, tipo: "sesion", idHist: ID_QA, generadoEn: "2026-10-02", modelo: "inventado (QA)",
  resumen: "Texto inventado para QA: un análisis guardado con el esquema 2, que se ve como antes.",
  hallazgos: [{ tema: "recuperación", detalle: "Bajadas rápidas entre bloques.", evidencia: "inventado" }],
  sugerencias: [], banderas: [], preguntas: [], datosFaltantes: [],
  armado: { versionPrompt: 3, versionEsquema: 2, ventana: null, versionEnriquecimiento: 8 },
  armadoOrigen: "eco", cargadoMs: Date.UTC(2026, 9, 2, 12),
} as unknown as AnalisisGuardado;

function Caso({ id, titulo, h }: { id: string; titulo: string; h: Historial }) {
  return (
    <section data-caso={id} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>
        {titulo}
      </h2>
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 17, color: "var(--fg)" }}>{h.nombreRutina}</p>
        <CabeceraMarcas h={h} historial={[h]} />
      </div>
      <AnalisisSesion h={h} historial={[h]} errorHistorial={null} nocheAnterior={null} fcReposoDia={null} onCambio={() => {}} />
    </section>
  );
}

export function QaSesion() {
  const [params, setParams] = useSearchParams();
  const tema = (TEMAS as string[]).includes(params.get("tema") ?? "") ? (params.get("tema") as ThemeName) : "ion";
  const modo = MODOS.find((m) => m.id === params.get("modo")) ?? MODOS[0];
  const elegir = (clave: "tema" | "modo", valor: string) => {
    const p = new URLSearchParams(params);
    p.set(clave, valor);
    setParams(p, { replace: true });
  };

  const testigo = useMemo(sesionTestigo, []);
  const sinCurva = useMemo<Historial>(() => {
    const { curva: _c, marcas: _m, ...resto } = testigo.biometria ?? {};
    return { ...testigo, biometria: testigo.biometria ? { ...resto } as Historial["biometria"] : undefined };
  }, [testigo]);

  return (
    <div data-theme={tema} data-mode={modo.modo} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--fg)", padding: 16, boxSizing: "border-box" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
        <header style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h1 style={{ margin: 0, fontSize: 18 }}>QA — La pantalla de la sesión (P105)</h1>
          <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
            La sesión testigo del 27/09 con análisis inventados. Sin login y sin Firestore.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <label style={{ fontSize: 13 }}>
              Tema{" "}
              <select aria-label="Tema" value={tema} onChange={(e) => elegir("tema", e.target.value)}>
                {TEMAS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 13 }}>
              Modo{" "}
              <select aria-label="Modo" value={modo.id} onChange={(e) => elegir("modo", e.target.value)}>
                {MODOS.map((m) => <option key={m.id} value={m.id}>{m.id}</option>)}
              </select>
            </label>
          </div>
          <Link to="/" style={{ color: "var(--accent)", fontSize: 13 }}>← Volver a la app</Link>
        </header>

        <Caso id="curva-esquema3" titulo="1 · Con curva y análisis (esquema 3)" h={{ ...testigo, analisis: ANALISIS_3 }} />
        <Caso id="curva-sin-analisis" titulo="2 · Con curva, sin análisis" h={testigo} />
        <Caso id="sin-curva" titulo="3 · Sin curva" h={sinCurva} />
        <Caso id="esquema2" titulo="4 · Con un análisis de esquema 2" h={{ ...testigo, analisis: ANALISIS_2 }} />
      </div>
    </div>
  );
}
