# Handoff: ShapeUp — Theming Home + Configuración (2 direcciones × 2 modos × 5 acentos)

## Overview
Rediseño del Home de ShapeUp con sistema de theming completo: dos direcciones visuales (**A "Pulse"** — enérgica/deportiva, y **B v2 "Premium contemporáneo"**), modo claro/oscuro/sistema y 5 acentos (Ion, Volt, Blaze, Indigo, Pulse). Incluye pantalla de Configuración (sección Apariencia) y prototipo navegable con theming en vivo. Fase a implementar: Home + Configuración + página de QA.

## About the Design Files
Los archivos de este paquete son **referencias de diseño creadas en HTML** — prototipos que muestran el look y el comportamiento previstos, NO código de producción para copiar. La tarea es **recrear estos diseños en el entorno del repo destino** (Vite + Firebase, `jpcofano/shapeup`) usando sus patrones y librerías existentes.

## Fidelity
**High-fidelity.** Colores, tipografía, espaciado, radios y estados son finales. Recrear pixel-perfect consumiendo design tokens (ver abajo).

## Archivos del paquete
- `ShapeUp Prototipo.html` — prototipo navegable (Home ↔ Config, switcher de evaluación, theming por CSS variables, persistencia en localStorage). **Fuente de verdad de comportamiento.**
- `Home Redux - Pulso y Sereno.html` — canvas estático con todas las variantes, specs de componentes y hoja de tokens.
- `home-redux.css` — **fuente de verdad de estilos**: tokens de acento, superficies por dirección/modo, y todos los componentes (`.a-*` = dirección A, `.c-*` + `.v21` = dirección B v2 final; ignorar `.b-*` = B v1 descartada).

## Arquitectura de theming (3 ejes)
Data-attributes en la raíz: `data-direction="pulse|premium"`, `data-theme="light|dark"` (con `system` respetando `prefers-color-scheme`), `data-accent="ion|volt|blaze|indigo|pulse"`. Cambiar un eje = cambiar un atributo. La dirección es un token set (tipografía, radios, superficies, iconografía), no un fork de componentes.

## Design Tokens

### Acentos — pares duales (dark / light, ambos AA sobre sus fondos)
| Acento | Dark (`--acc-d`) | Light (`--acc-l`) |
|---|---|---|
| Ion | `#22d3ee` | `#0e7490` |
| Volt | `#4ade80` | `#15803d` |
| Blaze | `#ff7a45` | `#c2410c` |
| Indigo | `#8b90ff` | `#4f46e5` |
| Pulse | `#ff4d79` | `#be185c` |

En el prototipo: `--accent` = valor del modo; `--on-accent` = `#0b0f14` (dark) / `#ffffff` (light); `--accent-dim` = accent al 14% (dark) / 10% (light) sobre transparente.

### Rampa de intensidad (regla anti-empaste — implementar en código)
Ningún componente accede al color crudo. Derivar por acento:
- `--accent-subtle` ≈ 8–12% alpha (fondos teñidos: chips "done", pastilla del nav activo, relleno duotono)
- `--accent-border` ≈ 25–30% (bordes teñidos, ej. hero de A)
- `--accent-muted` (iconos secundarios)
- `--accent-solid` (anillo, CTA, ítem activo del nav — **presupuesto: máx. 3 por pantalla**)
- `--accent-strong` (hover/pressed)
Ajustar alphas por modo y verificar AA en cada nivel usado sobre texto/iconos.

### Semánticos (independientes del acento — validados contra colisión Volt-verde)
- Positivo: `#34d399` (dark) / `#067647` (light)
- Negativo: `#f87171` (dark) / `#b42318` (light)
- Regla: el color nunca es el único canal — todo delta lleva flecha de tendencia (`trending-down`/`trending-up`) dentro de un pill.

### Superficies — Dirección A "Pulse"
- Dark: bg `#0a0c10`, card `#14171d`, card2 `#1a1e26`, border `#252b36`, fg `#f4f6fa`, muted `#909aa9`, track `#232935`
- Light: bg `#eceef1`, card `#ffffff`, card2 `#f4f5f8`, border `#dfe2e8`, fg `#14171c`, muted `#5c6570`, track `#dde0e6`

### Superficies — Dirección B v2 "Premium" (usar valores v2.1)
- Dark: bg `#0f1012`, surface `#17181c`, surface2 `#1f2127`, border `#26282f`, fg `#f2f3f5`, muted `#90949d`, track `#25272d`
- Light: bg `#f1f1f3`, surface `#ffffff`, surface2 `#f5f5f7`, **border `#d7d7de`** (reforzado v2.1), fg `#151619`, muted `#5f636c`, track `#e5e5e9`
- Light: sombra 2 capas `0 1px 2px rgba(20,20,25,0.05), 0 12px 28px rgba(20,20,25,0.09)` en tarjetas y métricas.

### Tipografía
- **A**: Archivo (Google Fonts). Display/cifras: 800–900 *itálica*, uppercase, tracking −0.005/−0.03em; labels 9–10px uppercase 700, tracking 0.1em; cifras tabulares.
- **B v2**: Hanken Grotesk única familia; jerarquía por peso (500→800) y tamaño; tracking −0.02/−0.04em en títulos y cifras; labels 10px 700 uppercase tracking 0.14em; cifras tabulares.
- Iconos: Lucide. A: stroke 2. B v2: duotono (trazo en `--accent`/neutral + relleno `--accent-dim`).

### Radios
- **A**: tarjetas 16–20px, botones 12px, chips de día 11px, avatar 12px.
- **B v2 (radio firma — esquina inferior-izquierda recortada)**: tarjetas `24px 24px 24px 4px`, botones/elementos `12px 12px 12px 4px`, chips `11px 11px 11px 4px`, nav pill `8px 8px 8px 3px`. **No simplificar a rectángulo.**

### Micropatrón chevron (solo B v2, tarjeta del día)
SVG tile 30×30, chevron stroke 2.5 redondeado, opacidad 6% blanco (dark) / 5% negro (light). Ver data-URI exacto en `home-redux.css` (`.v21 .c-card.pattern`).

## Screens

### Home (estructura idéntica en ambas direcciones; tratamiento distinto)
1. **Header**: saludo "Dale, Juan." (la voz de la app — conservar) + "Día 3 de 4 · esta semana" + avatar. A: Archivo 900 itálica uppercase 27px; B: Hanken 800 25px.
2. **Anillo de progreso** (sesiones 2/4): A — segmentado, 1 segmento = 1 sesión, stroke 12, r 66, gap ~16, glow en segmentos hechos. B v2 — continuo, stroke 14, r 82, remate redondeado, gradiente dentro del acento (accent → accent 55% + blanco), glow `drop-shadow(0 0 10px accent 40%)` solo en dark.
3. **Tarjeta del día** ("Día de descanso" + botón secundario "Entrenar igual"): A — hero con lavado de acento (gradiente 135°, accent 16% → card 62%) + marca chevron 10%; B v2 — surface + hairline + micropatrón chevron.
4. **3 métricas** (Volumen 3.960 kg, Peso 84.6 kg −0.4, Racha 3 semanas): A — tiles con hover de borde teñido; B v2 — componente contenedor + label + valor con unidad + delta en pill semántico con flecha.
5. **Módulo semanal movilidad** (L–D, 2/7): chips de día con estados done (fondo `--accent-dim`) / today (A: borde acento; B v2: borde 1.5px `--fg` — no depende del acento) / pendiente (punto neutro).
6. **Bottom nav 6 ítems** (Inicio, Rutinas, Entrenar, Historial, Salud, Perfil): A — barra 3px sobre activo + label uppercase; B v2 — pastilla duotono con radio firma tras el icono activo.

### Configuración (sección Apariencia, en ambas direcciones)
- Segmented control Claro / Oscuro / Sistema.
- Selector de acento: 5 swatches (muestran el valor del modo actual), selección con borde `--fg` de 2px.
- Preview en vivo: mini-anillo + CTA que reflejan el acento/modo elegido al instante.
- Filas de ajustes: Unidades, Notificaciones, Datos de salud (con chevron-right).

## Interactions & Behavior
- Transiciones 150ms ease en hover/press; press: `scale(0.97)` (A y B v2).
- Hover: A — bordes tiñen a acento; B v2 — secundario sube a `--surface2` + borde más fuerte; CTA `brightness(1.07)`.
- Cambio de tema/acento desde Config: aplica en vivo a toda la UI (solo cambian data-attributes).
- Feedback al completar sesión (diseñado, no implementado en prototipo): A — segmento se enciende con glow + scale 1.06, chip del día pasa a ✓; B v2 — pulso suave del anillo.
- Botones nunca parten texto (`white-space: nowrap`).

## State Management & Persistencia
- Estado: `{ direction, mode, accent }` (+ pantalla activa).
- Firebase: preferencias en el perfil del usuario (proyecto `shapeup-41e74`, env `VITE_FIREBASE_*`); espejo en localStorage aplicado por script inline en `index.html` **antes del primer render** (sin flash). Sync al loguearse.
- Defaults sugeridos: `premium / system / ion`.
- Modo `system`: `matchMedia('(prefers-color-scheme: dark)')` + listener de cambio.

## QA obligatorio
- Ruta interna que renderice Home en grilla con las 20 combinaciones (2×2×5).
- Toggle de escala de grises (`filter: grayscale(1)`): en gris, jerarquía e identidad de cada dirección deben mantenerse (validado en diseño — frame "B v2 · Gris").
- Verificar el peor caso semántico: Volt activo + delta positivo visible (frame "B v2.1 · caso crítico").

## Assets
Sin imágenes. Iconos: Lucide (`lucide` npm). Fuentes: Archivo y Hanken Grotesk (Google Fonts).
