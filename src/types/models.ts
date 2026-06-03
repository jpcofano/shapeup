// ════════════════════════════════════════════════════════════════════════════
//  ShapeUp — Modelo de dominio (v2)
//  Adaptación del modelo de "Comida Familiar" al dominio de ejercicio.
//
//  Cambios v2 (decisiones zanjadas con el usuario):
//   · Multiusuario con VISIBILIDAD controlada por el owner (quién ve qué plan).
//   · PROGRAMA = pieza central (plan de N días/semana); + rutinas/ejercicios sueltos.
//   · REGISTRO COMPLETO: reps/carga/RPE por serie son de primera clase.
//   · CONTENIDO "CÓMO HACER" siempre disponible: técnica por ejercicio, metodología
//     por programa, principios globales. Nada queda implícito.
//   · INTEROP con Free Exercise DB (dominio público, 800+ ejercicios) para sembrar
//     el catálogo y poder importar más. Campos `fuente`/`fuenteId` para trazabilidad.
//   · MÓDULO DE SALUD (composición + cardio/FC, import por CSV) y MOTOR DE
//     RECOMENDACIONES (avanzado, a desarrollar) — tipos listos, lógica futura.
//   · CONTRATO DE ACTUALIZACIÓN: cada acción actualiza contadores, timestamps,
//     cachés derivados y progreso (ver §"Campos derivados / contrato" abajo).
//
//  Mapa: Ingrediente→Ejercicio · Receta→Rutina("Día") · Menu→Programa ·
//        Plan→SesionProgramada · Historial(voto)→Historial(log real)
// ════════════════════════════════════════════════════════════════════════════

export type FirestoreTimestamp = { seconds: number; nanoseconds: number };

// ─── Miembros (whitelist en /config/familia; misma familia que la app de comidas) ─
export const MIEMBRO_IDS = ["juanpablo", "maria", "sofia", "federico"] as const;
export type MiembroId = typeof MIEMBRO_IDS[number];
export type Rol = "padre" | "madre" | "hija" | "hijo" | "invitado";

export interface RangoNumerico {
  value: number;
  min?: number;
  max?: number;
  raw: string;          // "8-12", "10", "AMRAP", "30 s"
}

// ════════════════════════════════════════════════════════════════════════════
//  ENUMS DE DOMINIO
// ════════════════════════════════════════════════════════════════════════════

// Modalidad: discrimina el esquema de Prescripcion. Alineada a la `category` de
// Free Exercise DB (strength / stretching / cardio / plyometrics / …).
export const MODALIDADES = ["Fuerza", "Cardio", "Movilidad", "Isométrico"] as const;
export type Modalidad = typeof MODALIDADES[number];

// Mecánica del ejercicio (FEDB `mechanic`).
export const MECANICAS = ["Compuesto", "Aislamiento"] as const;
export type Mecanica = typeof MECANICAS[number];

// Grupos musculares — hoja. Superset de la app + cobertura completa de los músculos
// de Free Exercise DB para que la importación de los 800 sea 1:1 (ver FEDB_MUSCULO).
export const GRUPOS_MUSCULARES = [
  "Pecho", "Espalda", "Dorsales", "Espalda media", "Lumbares", "Trapecios",
  "Hombros", "Bíceps", "Tríceps", "Antebrazos", "Cuello",
  "Core", "Glúteos", "Cuádriceps", "Isquios", "Pantorrillas",
  "Abductores", "Aductores",
  "Cuerpo completo", "Cardiovascular",
] as const;
export type GrupoMuscular = typeof GRUPOS_MUSCULARES[number];

// Mapeo músculo Free Exercise DB (inglés) → nuestro GrupoMuscular (lo usa el importador).
export const FEDB_MUSCULO: Record<string, GrupoMuscular> = {
  abdominals: "Core",
  abductors: "Abductores",
  adductors: "Aductores",
  biceps: "Bíceps",
  calves: "Pantorrillas",
  chest: "Pecho",
  forearms: "Antebrazos",
  glutes: "Glúteos",
  hamstrings: "Isquios",
  lats: "Dorsales",
  "lower back": "Lumbares",
  "middle back": "Espalda media",
  neck: "Cuello",
  quadriceps: "Cuádriceps",
  shoulders: "Hombros",
  traps: "Trapecios",
  triceps: "Tríceps",
};

// Jerarquía región→hojas (análogo GRUPOS_PROTEINA): filtros y balance empuje/tracción.
export const GRUPOS_MUSCULARES_REGION: Record<string, GrupoMuscular[]> = {
  "Tren superior - empuje": ["Pecho", "Hombros", "Tríceps"],
  "Tren superior - tracción": ["Espalda", "Dorsales", "Espalda media", "Trapecios", "Bíceps", "Antebrazos"],
  "Tren inferior": ["Cuádriceps", "Isquios", "Glúteos", "Pantorrillas", "Abductores", "Aductores"],
  "Core": ["Core", "Lumbares"],
  "Cuerpo completo / Cardio": ["Cuerpo completo", "Cardiovascular", "Cuello"],
};
export const GRUPOS_MUSCULARES_REGION_ORDEN = [
  "Tren superior - empuje", "Tren superior - tracción",
  "Tren inferior", "Core", "Cuerpo completo / Cardio",
] as const;
export type RegionMuscular = typeof GRUPOS_MUSCULARES_REGION_ORDEN[number];

// Patrón de movimiento (estándar de fuerza y acondicionamiento).
export const PATRONES_MOVIMIENTO = [
  "Empuje horizontal", "Empuje vertical",
  "Tracción horizontal", "Tracción vertical",
  "Dominante de rodilla", "Dominante de cadera", "Zancada / unilateral",
  "Core anti-extensión", "Core anti-rotación", "Core flexión",
  "Locomoción / cardio", "Aislamiento",
] as const;
export type PatronMovimiento = typeof PATRONES_MOVIMIENTO[number];

// Fuerza FEDB (`force`): push / pull / static. Lo guardamos para interop/orden.
export const FUERZAS_FEDB = ["empuje", "tracción", "estático"] as const;
export type FuerzaFEDB = typeof FUERZAS_FEDB[number];
export const FEDB_FUERZA: Record<string, FuerzaFEDB> = {
  push: "empuje", pull: "tracción", static: "estático",
};

// Equipo. Incluye el equipo real del usuario + variantes de gym + mapeo FEDB.
export const EQUIPOS = [
  "Peso corporal", "Mancuernas", "Barra de dominadas", "Barra", "Discos",
  "Kettlebell", "Banda elástica", "TRX / anillas", "Banco", "Máquina", "Polea",
  "Máquina de cardio", "Cuerda", "Rueda abdominal", "VR", "Otro",
] as const;
export type Equipo = typeof EQUIPOS[number];

// Mapeo equipment Free Exercise DB → nuestro Equipo.
export const FEDB_EQUIPO: Record<string, Equipo> = {
  "body only": "Peso corporal",
  dumbbell: "Mancuernas",
  barbell: "Barra",
  kettlebells: "Kettlebell",
  cable: "Polea",
  machine: "Máquina",
  bands: "Banda elástica",
  "medicine ball": "Otro",
  "exercise ball": "Otro",
  "e-z curl bar": "Barra",
  "foam roll": "Otro",
  other: "Otro",
};

export const NIVELES = ["Principiante", "Intermedio", "Avanzado"] as const;
export type Nivel = typeof NIVELES[number];
export const FEDB_NIVEL: Record<string, Nivel> = {
  beginner: "Principiante", intermediate: "Intermedio", expert: "Avanzado",
};

export const FOCOS_RUTINA = [
  "Cuerpo completo", "Tren superior", "Tren inferior",
  "Empuje (Push)", "Tracción (Pull)", "Pierna", "Core",
  "Cardio / HIIT", "Movilidad", "VR",
] as const;
export type FocoRutina = typeof FOCOS_RUTINA[number];

export const OBJETIVOS = [
  "Fuerza", "Hipertrofia", "Resistencia muscular",
  "Pérdida de grasa", "Recomposición", "Movilidad", "General / salud",
] as const;
export type Objetivo = typeof OBJETIVOS[number];

export const LUGARES = ["Casa", "Gimnasio", "Aire libre", "VR"] as const;
export type Lugar = typeof LUGARES[number];

export const INTENSIDADES_CARDIO = ["Suave", "Moderada", "Vigorosa", "Máxima"] as const;
export type IntensidadCardio = typeof INTENSIDADES_CARDIO[number];

// Zonas de FC (de los datos del reloj del usuario; configurables por miembro).
export const ZONAS_FC = ["Z1", "Z2", "Z3", "Z4", "Z5"] as const;
export type ZonaFC = typeof ZONAS_FC[number];

// Estados de sesión (análogo ESTADOS_PLAN, sin compras).
export const ESTADOS_SESION_ACTIVOS = ["Programada", "En curso", "Completada"] as const;
export const ESTADOS_SESION_FINALES = ["Registrada"] as const;
export const ESTADOS_SESION = [...ESTADOS_SESION_ACTIVOS, ...ESTADOS_SESION_FINALES] as const;
export type EstadoSesion = typeof ESTADOS_SESION[number];

export const TIPOS_SESION = ["Rutina", "Programa", "VR"] as const;
export type TipoSesion = typeof TIPOS_SESION[number];
export type TipoSeleccion = "rutina" | "programa";

export const ESTADOS_PROGRAMA = ["Activo", "Pausado", "Archivado", "Plantilla"] as const;
export type EstadoPrograma = typeof ESTADOS_PROGRAMA[number];

// ════════════════════════════════════════════════════════════════════════════
//  EJERCICIO — catálogo (analog Ingrediente). /ejercicios/{EJ-XXXX}
//  Escritura: owner. Lectura: cualquier miembro.
//  Interop Free Exercise DB: fuente/fuenteId + campos alineados (mecanica, fuerzaFEDB).
// ════════════════════════════════════════════════════════════════════════════
export interface Ejercicio {
  idEjercicio: string;             // "EJ-0001"
  nombre: string;
  nombreCanonico: string;          // normalizeText(nombre)

  modalidad: Modalidad;
  patron: PatronMovimiento;
  mecanica?: Mecanica;             // FEDB mechanic
  fuerzaFEDB?: FuerzaFEDB;         // FEDB force (empuje/tracción/estático)
  grupoMuscularPrimario: GrupoMuscular;
  gruposSecundarios: GrupoMuscular[];
  equipo: Equipo[];
  unilateral: boolean;
  nivel: Nivel;

  // ── Técnica = "cómo hacer", SIEMPRE disponible (analog pasos de receta) ──
  instrucciones: string[];         // ejecución paso a paso, en orden
  puntosClave: string[];           // banner verde (lo que sí)
  erroresComunes: string[];        // banner ámbar (lo que no)
  consejosSeguridad?: string[];    // contraindicaciones / cuidados

  descansoSugeridoSeg: number;

  // ── Variantes (analog sustitutos/equivalencias) ──
  progresiones?: string[];         // idEjercicio[] más difíciles
  regresiones?: string[];          // idEjercicio[] más fáciles / menos equipo

  // ── Media (FEDB hospeda imágenes vía raw.githubusercontent) ──
  imagenes?: string[];             // URLs
  videoUrl?: string;

  sinonimos: string[];
  // ── Trazabilidad de la fuente (lo que pidió el usuario) ──
  fuente?: string;                 // "Free Exercise DB" | "Plan ShapeUp" | "manual"
  fuenteId?: string;               // id original en la fuente (FEDB id)
  fuenteUrl?: string;

  // ── Contrato de actualización ──
  vecesUsado: number;              // ++ cuando entra en una sesión registrada
  ultimaVez?: string;              // "YYYY-MM-DD"
  origen: "seed" | "import" | "manual";
  fechaCreacion?: FirestoreTimestamp;
  ultimaModificacion?: FirestoreTimestamp;
}

// ════════════════════════════════════════════════════════════════════════════
//  PRESCRIPCIÓN — "esquema por tipo de ejercicio" (unión discriminada por modalidad)
// ════════════════════════════════════════════════════════════════════════════
export interface PrescripcionFuerza {
  modalidad: "Fuerza";
  series: number;
  repsObjetivo: RangoNumerico;
  cargaKg?: number;
  porcentajeRM?: number;
  rirObjetivo?: number;            // reps en reserva (el plan usa 1–3 "en el tanque")
  rpeObjetivo?: number;
  tempo?: string;                  // "3-1-1-0" (el plan enfatiza bajada 2–3 s)
  descansoSeg: number;
  alFallo?: boolean;
}
export interface PrescripcionCardio {
  modalidad: "Cardio";
  formato: "Continuo" | "Intervalos";
  intensidad?: IntensidadCardio;
  zonaObjetivo?: ZonaFC;           // p.ej. mantener Z3 con picos a Z4
  duracionMin?: number;
  distanciaKm?: number;
  rondas?: number;
  trabajoSeg?: number;
  descansoSeg?: number;
  juegoSugerido?: string;          // para días de VR: "Body Combat", "Creed", …
}
export interface PrescripcionMovilidad {
  modalidad: "Movilidad";
  rondas: number;
  duracionHoldSeg?: number;
  repsObjetivo?: RangoNumerico;
  porLado: boolean;
  descansoSeg: number;
}
export interface PrescripcionIsometrico {
  modalidad: "Isométrico";
  series: number;
  duracionHoldSeg: number;
  porLado: boolean;
  descansoSeg: number;
}
export type Prescripcion =
  | PrescripcionFuerza | PrescripcionCardio | PrescripcionMovilidad | PrescripcionIsometrico;

// ════════════════════════════════════════════════════════════════════════════
//  BLOQUE — ejercicio prescripto dentro de una rutina (analog IngredienteEnReceta)
// ════════════════════════════════════════════════════════════════════════════
export interface BloqueEjercicio {
  orden: number;
  idEjercicio: string;
  nombreEjercicio: string;
  modalidad: Modalidad;
  prescripcion: Prescripcion;

  grupoSet?: string;               // "A","B" → superseries/circuito
  notas?: string;                  // "cómo hacer" específico de este bloque
  alternativas?: Array<{
    idEjercicio: string;
    motivo?: "regresión" | "progresión" | "equipo";
  }>;
}

// ════════════════════════════════════════════════════════════════════════════
//  RUTINA ("Día") — lo compuesto (analog Receta). /rutinas/{RUT-XXXX}
// ════════════════════════════════════════════════════════════════════════════
export interface Rutina {
  idRutina: string;
  nombre: string;
  nombreCanonico: string;

  foco: FocoRutina;
  objetivo: Objetivo;
  nivel: Nivel;
  nivelOrden: number;
  lugar: Lugar;
  equipoNecesario: Equipo[];       // derivado/cache

  // "Cómo hacer" a nivel sesión (siempre disponible)
  descripcion?: string;
  calentamiento?: string;          // texto o "RUT-XXXX" de movilidad
  vueltaACalma?: string;
  riesgos?: string;
  notas?: string;
  superseries?: string[];          // ["A: 1+2", "B: 3+5"] — guía de emparejado

  bloques: BloqueEjercicio[];

  // Derivados (cache; lib/metricas.ts)
  duracionEstimadaMin: number | null;
  totalSeries: number | null;

  // Contrato de actualización
  vecesEntrenada: number;          // ++ al registrar
  ultimaVez?: string;
  ultimoRpe?: number;

  fuente?: string;
  fechaCreacion?: FirestoreTimestamp;
  ultimaModificacion?: FirestoreTimestamp;
}

// ════════════════════════════════════════════════════════════════════════════
//  PROGRAMA — plan de N días/semana (PIEZA CENTRAL). /programas/{PRG-XXXX}
//  (analog Menu, pero protagonista). "Habilito y entro el lunes y me dice qué toca".
// ════════════════════════════════════════════════════════════════════════════
export interface DiaPrograma {
  orden: number;                   // 1..diasPorSemana
  diaSemana?: "lunes" | "martes" | "miércoles" | "jueves" | "viernes" | "sábado" | "domingo";
  etiqueta: string;                // "Día 1 — Fuerza A", "Martes — VR"
  tipo: "rutina" | "vr" | "descanso";
  idRutina?: string;               // si tipo="rutina"
  vrSugerido?: string;             // si tipo="vr"
  duracionObjetivoMin?: number;
  opcional: boolean;
  notas?: string;
}

export interface Programa {
  idPrograma: string;              // "PRG-0001"
  nombre: string;
  nombreCanonico: string;
  estado: EstadoPrograma;
  objetivo: Objetivo;
  nivel: Nivel;
  diasPorSemana: number;
  duracionSemanas?: number;        // p.ej. ciclo de 8 semanas

  descripcion?: string;
  // "Forma de trabajo" del programa, SIEMPRE disponible
  comoUsar?: string;               // cómo seguir el programa día a día
  metodologia?: string[];          // p.ej. superseries, tempo, descansos
  reglasProgresion?: string[];     // cómo subir dificultad semana a semana
  notas?: string;

  dias: DiaPrograma[];

  // Contrato de actualización
  vecesUsado: number;
  ultimaVez?: string;
  fechaCreacion?: FirestoreTimestamp;
  ultimaModificacion?: FirestoreTimestamp;
}

// ════════════════════════════════════════════════════════════════════════════
//  SESIÓN PROGRAMADA — instancia agendada + máquina de estados (analog Plan).
//  /sesiones/{SES-…}. Sin compras. `progreso` espeja EntrenarState para reanudar.
// ════════════════════════════════════════════════════════════════════════════
export interface ProgresoSesion {
  bloqueActual: number;
  seriesHechas: Record<number, number>;
  registro?: Record<number, SerieRegistro[]>;
  actualizado: FirestoreTimestamp;
}

export interface SesionProgramada {
  idSesion: string;                // "SES-YYYYMMDD-<ts>"
  miembro: MiembroId;              // de quién es la sesión
  semanaInicio: string;            // "YYYY-MM-DD"
  semanaFin: string;
  fecha?: string;                  // día asignado

  tipoSeleccion: TipoSeleccion;
  tipoSesion: TipoSesion;
  idSeleccion: string;             // idRutina | idPrograma
  idRutina?: string;               // rutina concreta a ejecutar (si aplica)
  nombreRutina: string;
  diaProgramaOrden?: number;       // qué día del programa es

  estado: EstadoSesion;
  origen: string | null;           // "programa:PRG-0001#dia1"
  fechaProgramacion: FirestoreTimestamp;
  progreso?: ProgresoSesion | null;
  rpeSesion?: number | null;
  notas: string;
}

// ════════════════════════════════════════════════════════════════════════════
//  HISTORIAL / REGISTRO — log real post-sesión, personal (analog Historial).
//  /historial/{H-…}. Registro COMPLETO: series/reps/carga reales, RPE, tonelaje.
// ════════════════════════════════════════════════════════════════════════════
export interface SerieRegistro {
  serie: number;
  reps?: number;
  cargaKg?: number;
  duracionSeg?: number;
  rir?: number;
  completada: boolean;
}
export interface BloqueRegistro {
  orden: number;
  idEjercicio: string;
  nombreEjercicio: string;
  modalidad: Modalidad;
  series: SerieRegistro[];
}
export interface Historial {
  idHist: string;
  fechaRealizada: string;
  fechaRealizadaTimestamp: FirestoreTimestamp;

  idSesion: string;
  idRutina: string;
  nombreRutina: string;
  idPrograma?: string;
  semanaInicio: string;
  miembro: MiembroId;

  duracionRealMin: number | null;
  rpe: number | null;
  tonelajeKg: number | null;       // Σ reps×carga (derivado)
  totalSeriesHechas: number | null;

  bloques: BloqueRegistro[];

  comoMeSenti?: string;
  queMejorar?: string;
  notas?: string;
}

// ════════════════════════════════════════════════════════════════════════════
//  MÓDULO DE SALUD — composición + cardio/FC. Import por CSV (Samsung Health) o manual.
//  Sync en vivo NO es posible para una web app; ver mapeo. Tipos listos; UI v1.5.
// ════════════════════════════════════════════════════════════════════════════
export type FuenteDato = "samsung-health-csv" | "manual" | "captura";

export interface MedicionCorporal {
  idMedicion: string;              // "MED-…"
  miembro: MiembroId;
  fecha: string;                   // "YYYY-MM-DD"
  pesoKg?: number;
  grasaPct?: number;
  masaMuscularKg?: number;
  masaGrasaKg?: number;
  aguaPct?: number;
  imc?: number;
  fuente: FuenteDato;
  notas?: string;
  fechaCreacion?: FirestoreTimestamp;
}

export interface SesionCardio {
  idCardio: string;                // "CAR-…"
  miembro: MiembroId;
  fecha: string;
  actividad: string;               // "Body Combat", "Caminata", "Aeróbic"…
  esVR: boolean;
  duracionMin?: number;
  kcal?: number;
  fcPromedio?: number;
  fcMaxima?: number;
  zonaPrincipal?: ZonaFC;
  sensacion?: number;              // 1–5
  fuente: FuenteDato;
  notas?: string;
  fechaCreacion?: FirestoreTimestamp;
}

export interface RegistroSueno {
  idSueno: string;
  miembro: MiembroId;
  fecha: string;
  horas?: number;
  horaAcostarse?: string;          // "01:00"
  fuente: FuenteDato;
}

// ════════════════════════════════════════════════════════════════════════════
//  MOTOR DE RECOMENDACIONES — AVANZADO / A DESARROLLAR.
//  Lee Historial + módulo de salud y propone modificaciones. Lógica = fase futura;
//  acá quedan los tipos para dejarlo zanjado en el mapeo.
// ════════════════════════════════════════════════════════════════════════════
export const TIPOS_RECOMENDACION = [
  "Reducir volumen", "Subir carga", "Bajar intensidad", "Día de descanso",
  "Deload", "Cambiar ejercicio", "Dormir más", "Sumar cardio Z2", "Felicitación",
] as const;
export type TipoRecomendacion = typeof TIPOS_RECOMENDACION[number];

export const SENALES_SALUD = [
  "sueño", "fc-reposo", "hrv", "tendencia-peso", "tendencia-grasa",
  "rpe-sesiones", "adherencia", "tonelaje",
] as const;
export type SenalSalud = typeof SENALES_SALUD[number];

export interface Recomendacion {
  idRecom: string;                 // "REC-…"
  miembro: MiembroId;
  fecha: string;
  tipo: TipoRecomendacion;
  mensaje: string;                 // texto claro de qué hacer y por qué
  severidad: "info" | "sugerencia" | "importante";
  basadoEn: SenalSalud[];          // qué señales la dispararon
  accionSugerida?: {
    idRutina?: string;
    idEjercicio?: string;
    cambio?: string;               // descripción del ajuste propuesto
  };
  aplicada?: boolean;
  fechaCreacion?: FirestoreTimestamp;
}

// ════════════════════════════════════════════════════════════════════════════
//  CONFIG — auth por whitelist + visibilidad + metodología global.
// ════════════════════════════════════════════════════════════════════════════
export interface MiembroConfig { id: MiembroId; nombre: string; rol: Rol; }

export interface FamiliaConfigMiembro { nombre: string; rol: Rol; mails: string[]; }
export interface FamiliaConfig {
  miembros: Record<MiembroId, FamiliaConfigMiembro>;
  owner: MiembroId;
  timezone: string;
  semanaArrancaEn: "lunes" | "domingo";
}

// Perfil por miembro: equipo disponible, objetivos, zonas de FC personalizadas, color.
export interface PerfilMiembro {
  color?: string;
  equipoDisponible?: Equipo[];
  objetivos?: Objetivo[];
  lugarHabitual?: Lugar;
  zonasFC?: Partial<Record<ZonaFC, { min: number; max: number }>>;
  fcMaxTeorica?: number;
}
export type PerfilesConfig = Partial<Record<MiembroId, PerfilMiembro>>;

// VISIBILIDAD: qué programas/rutinas ve cada miembro. El owner ve todo.
// /config/visibilidad. (analog de la visibilidad de recetas en la app de comidas).
export interface VisibilidadMiembro {
  programas: string[];             // idPrograma[]
  rutinas: string[];               // idRutina[]
}
export type VisibilidadConfig = Partial<Record<MiembroId, VisibilidadMiembro>>;

// METODOLOGÍA global — los principios del plan, SIEMPRE disponibles en la app.
// /config/metodologia.
export interface PrincipioEntrenamiento {
  titulo: string;                  // "Esfuerzo (RIR)"
  detalle: string;                 // explicación de cómo aplicarlo
}
export interface MetodologiaConfig {
  principios: PrincipioEntrenamiento[];
  estructuraSesionFuerza?: string[];   // "Calentamiento 7 min", "Bloque 32 min", …
  ordenProgresion?: string[];          // "+ reps" → "+ serie" → "tempo" → …
  version: number;
  ultimaActualizacion: FirestoreTimestamp;
}

export interface DiccionariosConfig {
  modalidades: Modalidad[];
  mecanicas: Mecanica[];
  gruposMusculares: GrupoMuscular[];
  patrones: PatronMovimiento[];
  equipos: Equipo[];
  niveles: Nivel[];
  focosRutina: FocoRutina[];
  objetivos: Objetivo[];
  lugares: Lugar[];
  intensidadesCardio: IntensidadCardio[];
  zonasFC: ZonaFC[];
  tiposSesion: TipoSesion[];
  estadosSesion: { activos: EstadoSesion[]; finales: EstadoSesion[] };
  miembros: MiembroConfig[];
  version: number;
  ultimaActualizacion: FirestoreTimestamp;
}

export interface UserDoc {
  uid: string;
  email: string;
  memberId: MiembroId;
  nombre: string;
  rol?: Rol;
  ultimoLogin: FirestoreTimestamp;
  fechaPrimerLogin?: FirestoreTimestamp;
  fechaCreacion?: FirestoreTimestamp;
}

// ─── Backward-compat aliases (para src/auth/ — copiar tal cual) ───────────────
export type MemberId = MiembroId;
export type MemberRole = Rol;
export type MemberInfo = FamiliaConfigMiembro;
export type Diccionarios = DiccionariosConfig;
