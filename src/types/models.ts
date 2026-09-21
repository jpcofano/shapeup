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
  /** Paso del stepper de carga (kg). Si falta, `lib/pasoCarga.ts` usa el default del equipo. */
  pasoCargaKg?: number;

  // ── Variantes (analog sustitutos/equivalencias) ──
  progresiones?: string[];         // idEjercicio[] más difíciles
  regresiones?: string[];          // idEjercicio[] más fáciles / menos equipo

  // ── Media (FEDB hospeda imágenes vía raw.githubusercontent) ──
  imagenes?: string[];             // URLs
  videoYoutubeId?: string;         // ID de YouTube (11 chars). Si existe → demo EXACTA, máxima precedencia.
  videoUrl?: string;
  videoEsGenerico?: boolean;       // true: clip representativo por patrón, no footage propio del ejercicio

  sinonimos: string[];
  // ── Trazabilidad de la fuente (lo que pidió el usuario) ──
  fuente?: string;                 // "Free Exercise DB" | "Plan ShapeUp" | "manual"
  fuenteId?: string;               // id original en la fuente (FEDB id)
  fuenteUrl?: string;

  // ── Contrato de actualización ──
  vecesUsado: number;              // ++ cuando entra en una sesión registrada
  ultimaVez?: string;              // "YYYY-MM-DD"
  origen: "seed" | "import" | "manual";
  traduccion?: "ok" | "pendiente";
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
  /** Epoch ms cuando empieza la serie (sellado por el reducer al saltarDescanso). */
  inicioMs?: number;
  /** Epoch ms cuando se completa la serie (sellado por el reducer al completarSerie). */
  finMs?: number;
  /** Biometría fina — solo si hay curva live_data.json del ZIP de Samsung. */
  fcPico?: number;
  fcFinSerie?: number;
  recuperacionBpm?: number;
  /**
   * FC media de la serie, sobre su propia ventana (P79).
   *
   * **No es la FC media de la sesión**: ésa promedia los descansos y queda
   * sistemáticamente por debajo de la FC real de trabajo. Solo se calcula con
   * suficientes muestras (`MIN_MUESTRAS_SERIE`); una ronda sin curva fina no
   * tiene FC media, no tiene una inventada.
   */
  fcMedia?: number;
  /**
   * La FC de esta serie tiene pinta de artefacto (P79, §9.3): saltos imposibles
   * entre muestras o un pico por encima de la FC máxima teórica. En VR pasa
   * seguido — agarrar el control contrae el antebrazo y los golpes sacuden el
   * reloj. Una serie dudosa no entra en la FC de trabajo.
   */
  fcDudosa?: boolean;
}
/** Motivo opcional al saltear un ejercicio en la sesión (P68b). */
export type MotivoSalto = "dolor" | "equipo-ocupado" | "sin-tiempo" | "otro";

export interface BloqueRegistro {
  orden: number;
  idEjercicio: string;
  nombreEjercicio: string;
  modalidad: Modalidad;
  series: SerieRegistro[];
  /** Solo presentes si el bloque se salteó (P68b). */
  saltado?: boolean;
  motivoSalto?: MotivoSalto;
  // ── Sustitución en vivo (P73). Solo si hubo. ──────────────────────────────
  // `idEjercicio` y `nombreEjercicio` guardan los DEL SUSTITUTO: el bloque
  // cuenta lo que se hizo. El original queda acá al lado.
  idEjercicioOriginal?: string;
  /**
   * El nombre del original, guardado al sustituir (P73).
   *
   * Se guarda en vez de resolverlo contra el catálogo al mostrar: el detalle
   * del historial no carga el catálogo, y una lectura de Firestore por bloque
   * para mostrar un nombre no vale la pena.
   */
  nombreEjercicioOriginal?: string;
  motivoSustitucion?: MotivoSustitucion;
  zonaMolestia?: ZonaMolestia;
  /**
   * Qué posición ocupaba el elegido en el ranking, empezando en 1. `0` si vino
   * del buscador y no estaba entre los candidatos.
   *
   * Es el dato que después dice si el algoritmo acierta: si siempre elegís el
   * tercero, el orden está mal.
   */
  posicionSustituto?: number;
  /** 1RM estimado (Epley) de las series del día, solo Fuerza y solo si hay valor (P70). No se muestra. */
  e1rmKg?: number;
  /**
   * Los parámetros con los que **se jugó** esta sesión de VR (P79, ADR #039).
   *
   * La rutina nunca se muta: `/rutinas` es compartida por la familia y
   * cambiarla por la progresión de un miembro se la cambia a todos. Tampoco hay
   * un override por miembro, que sería el contador acumulado que el ADR #037
   * prohíbe. La historia ES la fuente: la próxima sesión arranca con esto.
   */
  prescripcionUsada?: { rondas: number; trabajoSeg: number; descansoSeg: number };
}

/** Zona de molestia marcada al cerrar la sesión (P70). */
export type ZonaMolestia =
  | "hombro" | "codo" | "muñeca" | "espalda" | "cadera" | "rodilla" | "tobillo" | "otra";

/** Por qué se cambió un ejercicio por otro en el momento (P73). */
export type MotivoSustitucion = "dolor" | "equipo-ocupado" | "no-me-sale" | "otro";
/** Enriquecimiento biométrico de una sesión ShapeUp cruzada con Samsung Health. */
export interface BiometriaSesion {
  fuente: FuenteDato;                  // "samsung-health-csv"
  /** Ausente en matchPor "rango": ahí no hay una única sesión Samsung detrás (P57). */
  datauuidSamsung?: string;
  fcMedia?: number;
  fcMax?: number;
  fcMin?: number;
  zonaPrincipal?: ZonaFC;             // derivada de fcMedia vs config/perfiles.zonasFC del miembro
  kcal?: number;
  /**
   * Cómo se identificó la sesión Samsung. `"directo"` es el caso de una entrada
   * externa (P75): el dato no se matcheó contra nada, ES el de esa entrada.
   */
  matchPor: "custom-id" | "ventana" | "dia" | "rango" | "directo";
  granularidad: "serie" | "sesion";  // qué tan fino llegó el enriquecimiento
  /**
   * Ventana efectiva usada para los cálculos: la intersección entre la ventana
   * de la app y la del workout de Samsung (P78). Ausentes si no hubo recorte.
   *
   * El principio: **la ventana de la app define el intervalo**; Samsung aporta
   * muestras, no el contenedor. La fila de Samsung tiene un solo dato
   * confiable —el inicio, que lo apretaste vos—: el fin no lo es.
   */
  finMsEfectivo?: number;
  inicioMsEfectivo?: number;

  /**
   * Las kcal salieron de un prorrateo por tiempo, no de la fila entera (P78).
   * El detalle las muestra con un `~` adelante.
   */
  kcalEstimada?: boolean;

  /** Suma de los tramos medidos, en minutos. NO es el reloj de pared (P78). */
  duracionMedidaMin?: number;

  /**
   * Todos los `datauuid` agregados, el principal incluido (P78).
   *
   * `datauuidSamsung` sigue guardando **el principal** por compatibilidad con
   * lo ya escrito. La regla 1b de `clasificarImport` tiene que mirar los dos, o
   * cada reimport vuelve a meter el segundo tramo como actividad suelta.
   */
  tramosSamsung?: string[];

  /**
   * Qué parte de la ventana de la sesión tiene dato de FC (P78), de 0 a 1.
   *
   * · `coberturaFina`  — minutos con curva de ~1/s.
   * · `coberturaTotal` — la fina más los huecos cubiertos con muestras crudas.
   *
   * Existen para que la falla **se vea**: hasta P78, una sesión de 60 min con
   * el reloj cortado a los 20 se guardaba como si estuviera entera.
   */
  coberturaFina?: number;
  coberturaTotal?: number;

  /** Dónde está el hueco, cuando la cobertura fina no alcanza (P78). */
  motivoCobertura?: "cortado-antes" | "arranco-tarde" | "hueco-entre-tramos" | "sin-cortar";

  /**
   * Con qué versión del algoritmo se calculó este enriquecimiento (P79, ADR #038).
   *
   * Ausente = 1 (todo lo anterior a P78). Sin esto, una sesión ya enriquecida
   * **nunca recibía un algoritmo nuevo**: el ADR #021 la omitía por tener
   * `granularidad: "serie"` y se quedaba para siempre con el cálculo viejo.
   */
  versionEnriquecimiento?: number;
}

/** Quién registró la actividad: vos al arrancarla, o el reloj solo (P75b). */
export type OrigenExterna = "declarada" | "autodetectada";

/** Por qué una actividad entró al historial como entrada externa (P75b). */
export type MotivoIngreso = "shapeup-sin-sesion" | "vr" | "actividad" | "duracion";

export interface Historial {
  idHist: string;
  fechaRealizada: string;
  fechaRealizadaTimestamp: FirestoreTimestamp;

  idSesion: string;
  idRutina?: string;            // ausente en sesiones libres
  nombreRutina: string;
  /**
   * Origen de la entrada. Si falta se lee como `"rutina"` (retrocompat con el
   * historial anterior a P74).
   *
   * **`"externa"` está declarado pero NADIE LO ESCRIBE desde P76b.** P75 creaba
   * una entrada por cada actividad de salud, y con el import real eso eran 2257
   * documentos duplicando filas que ya estaban en `/cardio`. Ahora las
   * actividades se muestran filtrando `/cardio` al leer
   * (`lib/actividadRelevante.ts`) y nada se copia.
   *
   * El valor se conserva a propósito, por dos motivos: los predicados de
   * `lib/tipoHistorial.ts` siguen siendo correctos para cualquier entrada vieja
   * que haya quedado, y P76 lo va a necesitar cuando convierta una actividad
   * marcada como ShapeUp en una sesión de verdad.
   */
  tipo?: "rutina" | "libre" | "externa";
  /** "parcial" si se guardó desde la hoja de salida (P68). Ausente = "completa". */
  completitud?: "completa" | "parcial";
  idPrograma?: string;
  semanaInicio: string;
  miembro: MiembroId;

  duracionRealMin: number | null;
  rpe: number | null;
  tonelajeKg: number | null;
  totalSeriesHechas: number | null;

  /** ADR #019: ventana de la sesión completa (epoch ms), sellada en finalizarSesion. */
  inicioMs?: number;
  finMs?: number;

  bloques: BloqueRegistro[];

  /** Enriquecimiento post-hoc con datos de Samsung Health (FC, zona, kcal). */
  biometria?: BiometriaSesion;

  /**
   * Solo en `tipo: "externa"`: de dónde salió la entrada.
   *
   * **Sin uso desde P76b**, igual que el `tipo` correspondiente: se declara
   * para leer las entradas que hayan quedado de P75 y para P76, que va a
   * convertir actividades en sesiones. Nada lo escribe hoy.
   */
  externa?: {
    actividad: string;             // "Caminata", "Body Combat"
    datauuid: string;              // el de Samsung
    fuente: FuenteDato;
    distanciaKm?: number;
    /**
     * `"autodetectada"` = el reloj la registró solo, sin que vos la arrancaras
     * (ADR #035; el discriminador es `esAutodetectada` en `lib/importSelectivo`).
     * Se marca, no se descarta: descartar es irreversible (P75b).
     */
    origen: OrigenExterna;
    /** Por qué entró al historial en vez de quedarse solo en salud (P75b). */
    motivoIngreso: MotivoIngreso;
  };

  /**
   * Cómo le resultó la sesión de VR (P79, §9.1). Opcional, un toque al cerrar.
   *
   * ⛔ **Es un dato de análisis y NO entra en ninguna regla de progresión.** El
   * sistema decide solo con lo que mide; la sensación no es una medición
   * confiable. Está para poder mirar después si lo que se midió "en zona" se
   * sintió como tal. **No la enchufes a una regla sin decidirlo antes.**
   */
  dificultadPercibida?: "suave" | "normal" | "intenso";
  /**
   * Qué sugirió la app al empezar esta sesión de VR y qué hizo la persona
   * (P79). `"manual"` es lo elegido a mano cuando no hubo medición para
   * decidir: el análisis nunca lo confunde con una decisión medida.
   */
  progresionVR?: {
    palanca: "subir-dificultad" | "recortar-descanso" | "sumar-ronda" | "mantener" | "bajar";
    aceptada: boolean;
    fuente: "fc" | "descanso" | "manual";
  };

  comoMeSenti?: string;
  queMejorar?: string;
  /** Zonas con molestia, estructuradas para poder contarlas (P70). */
  molestias?: ZonaMolestia[];
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
  // ── Marcas que consulta el filtro de lectura (P76b) ───────────────────────
  // Se persisten con nombre estable y sin guión bajo porque ahora se consultan
  // al mostrar el historial (`lib/actividadRelevante.ts`), no son de paso.
  // Opcionales por los documentos importados antes de P76b, que no las tienen.
  esVR: boolean;
  /** El reloj la marcó como ShapeUp: `custom_id` por ZIP, `customTitle` por SDK. */
  marcadaShapeUp?: boolean;
  /** La registró el reloj solo. Por el SDK viene explícita; por ZIP, sin FC. */
  autodetectada?: boolean;
  duracionMin?: number;
  distanciaKm?: number;
  kcal?: number;
  fcPromedio?: number;
  fcMaxima?: number;
  fcMinima?: number;               // P76a: el parser y el adaptador ya la traían; antes se tiraba al guardar
  zonaPrincipal?: ZonaFC;
  sensacion?: number;              // 1–5
  fuente: FuenteDato;
  notas?: string;
  inicioMs?: number;                // epoch ms inicio de la sesión (import Samsung Health)
  finMs?: number;                   // epoch ms fin de la sesión
  fechaCreacion?: FirestoreTimestamp;
}

export interface RegistroSueno {
  idSueno: string;
  miembro: MiembroId;
  fecha: string;
  horas?: number;
  horaAcostarse?: string;          // "HH:MM" — inicio del tramo
  horaLevantarse?: string;         // "HH:MM" — fin del tramo
  inicioMs?: number;               // epoch ms inicio del tramo (para consolidarNoches)
  finMs?: number;                  // epoch ms fin del tramo
  fuente: FuenteDato;
}

// ── Métricas de salud genéricas (señales del motor de recomendaciones) ────────
// Para métricas de Samsung Health SIN colección tipada propia. Granularidad diaria.
// idMetrica = `${miembro}-${tipo}-${fecha}` → idempotente por día.
export const TIPOS_METRICA = [
  "hrv", "fc-reposo", "fc-media-dia", "fc-max-dia", "estres", "pasos", "spo2",
  "frecuencia-respiratoria", "temperatura-piel",
  "presion-sistolica", "presion-diastolica",
  "vo2max", "recovery-hr", "vitality",
] as const;
export type TipoMetrica = typeof TIPOS_METRICA[number];

export type AgregacionMetrica = "dia" | "noche" | "ultimo-del-dia";

export interface MetricaSalud {
  idMetrica:   string;             // `${miembro}-${tipo}-${fecha}` (idempotente)
  miembro:     MiembroId;
  tipo:        TipoMetrica;
  fecha:       string;             // "YYYY-MM-DD"
  valor:       number;
  unidad?:     string;             // "ms","bpm","%","pasos","mmHg","ml/kg/min","°C"
  agregacion:  AgregacionMetrica;
  payload?:    Record<string, unknown>;  // extras crudos (p.ej. bins de HRV)
  fuente:      FuenteDato;
  datauuid?:   string;
  fechaCreacion?: FirestoreTimestamp;
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
    idPrograma?: string;           // para deload y acciones que apuntan a un programa
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

// Perfil por miembro: equipo por lugar, objetivos, zonas de FC personalizadas, color.
export interface PerfilMiembro {
  color?: string;
  /**
   * OBSOLETO (P72) — lista plana, sin distinguir dónde se entrena. Se conserva
   * porque los perfiles todavía sin migrar la tienen; `lib/perfil.equipoDe()` la
   * lee como el equipo del `lugarHabitual`. Para escribir, usar `equipoPorLugar`.
   */
  equipoDisponible?: Equipo[];
  /**
   * Equipo declarado por lugar (P72). Una lista vacía es una decisión explícita
   * ("acá no tengo nada"), distinta de no declarar el lugar.
   */
  equipoPorLugar?: Partial<Record<Lugar, Equipo[]>>;
  objetivos?: Objetivo[];
  lugarHabitual?: Lugar;
  zonasFC?: Partial<Record<ZonaFC, { min: number; max: number }>>;
  fcMaxTeorica?: number;
  /**
   * Meta de días por semana, si el miembro apunta a algo distinto de lo que
   * dice el plan (P77a). Ausente = manda el plan. **No se escribe un valor
   * igual al del plan**: elegir el mismo número borra el override, para que la
   * meta siga al plan si el plan cambia.
   */
  metaSemanalDias?: number;
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
