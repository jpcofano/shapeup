# Pendientes anteriores a P100

> **Lo vigente está en `docs/ROADMAP-producto.md`** (el orden de prompts en §11 y el backlog del
> traspaso del 30/09). Estas son las listas de pendientes que había antes de P100, movidas tal cual
> el 01/10/2026. Pueden tener cosas ya hechas o repetidas entre sí.

## Desde `CLAUDE.md`, sección «Roadmap»

## Roadmap (ideas evaluadas, orden tentativo)
Corto plazo (después de S1–S3; progresión de cargas y costo cardíaco por rutina
ya se implementaron como I2/I3 — ver "Serie I" arriba):
- **PRs y logros**: récords personales por ejercicio (carga, reps, tonelaje) + hitos
  familiares livianos. Motivación para los 4 miembros.
- **Panel familiar de adherencia** (solo owner): sesiones hechas vs planificadas por
  miembro por semana; respeta visibilidad existente.

Mediano plazo:
- **Correlaciones simples en Salud**: sueño vs RPE, kcal vs tendencia de peso semanal.
- **Backup/export CSV** de historial y mediciones (resguardo de datos; plan Blaze, con los mismos topes que Spark).
- **PWA completa**: offline con cola de escrituras (entrenar sin señal en el gimnasio) +
  notificaciones de "hoy toca X".

Largo plazo (registrado, sin compromiso):
- Sync de salud verdaderamente automático — ver "Serie H" arriba.
- Al cerrar el proyecto: purga del historial de git (mails de menores) → repo privado
  (ADR #015).


## Desde `docs/ESTADO-DEL-PROYECTO.md` (al 25/09)

## Pendientes (orden sugerido, al 2026-09-25)

**Próximos prompts (01/10/2026), en este orden: P97 → P98 → P99 → P94.** Zonas como Samsung,
rutinas de VR y progresión, marcas y análisis de sesión, y análisis general. El plan y sus
decisiones están en [ANALISIS-ASISTIDO.md](ANALISIS-ASISTIDO.md), «Marcas y análisis en dos capas
(P99) y análisis general (P94)».

**Lo primero, y no es código:**

0. **Abrir /salud y apretar "Sincronizar ahora"** (tarjeta "Puente Samsung"), mirar la vista
   previa y confirmar. Entra la biometría de 7 sesiones con curva fina y lo que el puente
   juntó desde el 18/09. **Ya no hace falta ningún ZIP.** Nada de lo de abajo se valida bien
   hasta que esto corra una vez.
1. **Usar la app dos o tres días.** P80 (VR por tiempo) y P81 (sesiones de juego) **no tienen
   un solo dato real adentro**: hace falta una sesión de VR jugada de corrido y una sesión de
   juego con el workout "Shape up" arrancado en el reloj. Construir encima antes de eso es
   ir a ciegas.

**Después, por orden:**

2. **Sincronización automática del puente** — hoy es un botón. Estaba fuera de alcance de PU4
   y es el pendiente real de la serie H.
3. **Enlazar y convertir entradas externas** — bloque 5 del roadmap, P76.
4. **PRs y logros** + **panel familiar de adherencia** (corto plazo del roadmap de CLAUDE.md).
5. **PWA completa** — offline con cola de escrituras + notificaciones.

**Decisiones abiertas del owner** (no arrancar sin respuesta):

- **La ventana de las sesiones viejas de VR es corta.** Las anteriores a P80 miden entre 10 y
  24 minutos menos que `duracionRealMin`, porque salía de las rondas marcadas. P83 aprovecha
  mejor lo que hay adentro pero no recupera lo que quedó afuera. ¿Se reescriben las
  históricas tomando `duracionRealMin` como ventana? Es un script, y es decisión suya.
- **Sesiones anteriores a P80 sin `modo` ni `duracionObjetivoMin` sellados.** Hoy se heredan
  al leer (`conObjetivo`); nada se reescribió en Firestore.

**Suelto, de la corrida nocturna:** `scripts/corregir-mecanica.ts` y
`scripts/serie-adherencia.ts` están escritos y **nunca se corrieron**, y no tienen alias en
`package.json`.

## Futuro / ideas registradas
- **Sync de salud automático — serie H** (plan en `CLAUDE.md`, taxonomía en ADR #032, auditoría
  en `docs/ROADMAP-producto.md` §15). Hoy la curva de FC entra por import manual (exportar de
  Samsung → elegir el zip). Las vías se clasifican por **de dónde leen**, no por el transporte:
  - **A** — Health Sync → Google Drive (lee Health Connect): en uso y automática, pero
    **topeada**: en sesiones de fuerza Health Connect publica 2 muestras de FC, no la curva.
  - **B** — Intervals.icu y **C** — cascarón Capacitor con plugin de Health Connect: descartadas,
    mismo techo que A (leen Health Connect).
  - **D** — app Android con el **Samsung Health Data SDK** (lee la app de Samsung Health):
    **construida y en uso** (PU1–PU4, 18/09/2026). El puente sube crudo a `/ingesta-sdk` cada
    6 horas y ShapeUp lo importa desde /salud. H2 (15/09) había dado positivo: mismo
    identificador y misma curva que el ZIP (ADR #036). **No es la C**: la C lee Health
    Connect, que no tiene la curva; la D lee la app de Samsung Health, que sí.
  - **E** — app Wear OS con el Sensor SDK (lee el sensor del reloj): descartada por costo.
  La vía A no se retira y Health Sync sigue siendo el puente de la balanza.
  ⚠ **Lo que falta, corregido el 21/09/2026:** la D está construida, pero **la curva de FC
  todavía entra solo por el ZIP**. El crudo del puente la trae (`SesionSdk.log`) y
  `lib/adaptadorSdk.ts` la descarta a propósito; `sincronizarDesdePuente` nunca llama a
  `enriquecerTrasImport`. Persistirla y enriquecer desde el puente es el pendiente #1.
- Expansión de mancuernas: discos sueltos de hierro fundido para sumar a los handles existentes.


## Desde `docs/MAPEO-IMPLEMENTACION.md`, «Backlog / roadmap»

## Backlog / roadmap (ideas — NO implementadas)

> No es estado: nada de acá está hecho hasta que tenga su entrada en la Bitácora. Orden ≈ prioridad.

### A. Flujo de entrenar (del análisis de UX)
- **A1. "Próxima sesión" + Home hero "Empezar" + Entrenar como 3 puertas**, con rutinas filtradas por miembro. Lógica pura `lib/proximaSesion.ts` (programa × historial). Resuelve "cómo empiezo / dónde elijo".
- **A2. Modo libre / un ejercicio:** sesión ad-hoc desde el catálogo; Historial con `tipo:"libre"` (sin `idRutina`). Resuelve "cómo hago 1 ejercicio".
- **A3. Mi programa / Mi semana:** ver el plan (N días, qué toca cada uno), empezar cualquier día, cambiar de programa.
- **A4. Dentro del entreno:** cronómetro de trabajo (isométricos/cardio) + pausar + terminar/abandonar.
- **A5. Reemplazar un ejercicio** sobre la marcha.
- **A6. Notas y RPE** por sesión.

### B. Riqueza de ejercicios (prioridad del owner)
- **B1. Explicaciones más ricas:** surfacear músculos primarios/secundarios, nivel, mecánica, patrón y equipo en el detalle. *Datos FEDB ya importados → solo mostrarlos.*
- ~~**B2. Video por ejercicio.**~~ ✅ **Hecho** (P43, ver Bitácora) — clip representativo por patrón vía `videoUrl` (no embed de YouTube; clips libres de Commons hotlinkeados). Pendiente real: footage propio de los 34 ejercicios de casa y curado fino del top FEDB.
- **B3. Mini-mapa corporal** de músculos trabajados (resalta grupos con primary/secondary de FEDB).
- **B4. Variantes / progresión-regresión** (más fácil ↔ más difícil) por ejercicio.
- **B5. Equipo alternativo** ("sin mancuerna: banda / mochila cargada").

### C. Progreso y motivación
- **C1. Récords personales (PR)** por ejercicio + 1RM estimado.
- **C2. Gráfico de progresión** por ejercicio (carga / volumen / tonelaje en el tiempo).
- **C3. Resumen semanal** ("tu semana en números").
- **C4. Hitos/logros** con mesura (sin gamificación malsana).

### D. Inteligencia / salud (Samsung) — futuro
- **D1. Motor de recomendaciones:** ajustar el entreno según sueño/HRV/recuperación (señales confirmadas en P22). Idealmente Cloud Function.
- **D2. Auto-progresión sugerida** (subir peso/reps la próxima vez).
- **D3. Correlación entreno ↔ FC/recuperación** (habilitada por el match biométrico P23).

### E. Catálogo / calidad de vida
- **E1. Buscador + filtros** (músculo, equipo, "solo lo que puedo en casa con mi equipo").
- **E2. Favoritos.**
- **E3. Crear/editar/reordenar rutinas desde la app** (hoy solo por seed).
- **E4. Recordatorios / notificaciones** (PWA push: OK Android, limitado en iOS).
- **E5. Traducciones FEDB** al castellano (al final, contra el catálogo definitivo).

### F. Familia
- **F1. El owner asigna/edita programas** a los miembros desde la app (hoy por seed).
- **F2. Vista familiar suave** (sesiones de la semana por miembro, respetando visibilidad).

### G. Planificación / periodización
- **G1. Calendario de adherencia** (heatmap mensual tipo "contribuciones").
- **G2. Deload sugerido** automáticamente cada N semanas (ya hay plantilla de deload, PRG-0009).
- **G3. Fases / mesociclos** (volumen → intensidad) en el programa.
- **G4. Planificar la semana** (elegir/arrastrar qué rutina va cada día).

### H. Onboarding / arranque
- **H1. Wizard inicial:** objetivo + equipo disponible + días/semana → sugiere y asigna el programa. *Resuelve de raíz "cuál es mi programa".*
- **H2. Test de calibración** (cuántas flexiones/dominadas) → calibra cargas/regresiones iniciales.
- **H3. Editor de FCmáx / zonas FC** en el perfil.

### I. Seguridad y técnica
- **I1. Calentamiento y enfriamiento guiados** (la rutina ya tiene toggles calentar/enfriar).
- **I2. Banderas de dolor/molestia:** marcar "me duele X" → sugiere regresión o evitar el ejercicio.
- **I3. Reglas de recuperación:** aviso suave si se repite el mismo grupo muscular en días seguidos.
- **I4. Menores (16/17, en crecimiento):** foco en técnica, topes de carga conservadores y alerta si suben rápido.

### J. Ecosistema familiar
- **J1. Integración con Comida Familiar** (app hermana del mismo dueño): cruzar entreno del día con la comida — recordatorio de proteína post-entreno, calorías quemadas vs ingeridas. *Distintivo del ecosistema.*
- **J2. Check-in familiar:** quién entrenó hoy (respetando visibilidad).
- **J3. Reto familiar suave** (X sesiones entre todos esta semana).
- **J4. (Sensible) Adherencia de los hijos visible para el padre** — solo con consentimiento y de forma apropiada a la edad.

### K. Experiencia durante el entreno
- **K1. Modo manos libres:** voz que anuncia "siguiente serie / descanso" + cuenta regresiva hablada (Web Speech API).
- **K2. Pantalla siempre encendida** durante la sesión (Wake Lock API).
- **K3. Modo horizontal** para ver el video del ejercicio.
- **K4. Texto grande / alto contraste** (adultos 50+).

### L. Equipo / gimnasio en casa
- **L1. Inventario de equipo** (mancuernas/discos/banda) → solo sugiere ejercicios posibles y calcula cargas alcanzables.
- **L2. Calculadora de discos:** "para 14 kg en la mancuerna, poné estos discos" (según el kit DeporAr).
- **L3. Seguimiento de VR:** qué juego jugaste, FC/calorías por juego, "tu más quemador" (PSVR2).

### M. Datos / respaldo
- **M1. Exportar el historial** (CSV/JSON) — backup propio.
- **M2. Compartir** una sesión o un PR (imagen/resumen).

### Restricciones a respetar (transversales)
- **Plan Spark (gratis):** cuidar lecturas/escrituras; agregados diarios; nada de alta frecuencia.
- **Imágenes y videos por URL/embed externo** (FEDB dominio público, YouTube embed oficial), **no hosteados** (Storage mínimo).
- **Copyright:** solo embed oficial de YouTube; nunca descargar/hostear video.
- **PWA:** push limitado en iOS.
