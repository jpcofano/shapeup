# 65 — Temas claro/oscuro (5 temas) + sincronizar UI kit ↔ vivo

Repo: jpcofano/shapeup. Continúa la secuencia lineal de `docs/prompts/`.

## Contexto
Auditoría de diseño (`explorations/home-redux/AUDITORIA-temas-claro-oscuro.md`)
detectó que hay **dos sistemas de theming en paralelo que no coinciden**:

- **`src` tokens base (equivalente a `colors_and_type.css`)**: 8 temas
  (`ion, volt, solar, blaze, crimson, pulse, grape, indigo`) vía `[data-theme]`,
  **solo oscuro** (`color-scheme: dark`, sin ninguna variante clara).
- **Prototipo Home Redux** (`docs/home-redux/…/home-redux.css`): **5 acentos**
  (`ion, volt, blaze, indigo, pulse`) con **claro Y oscuro** funcionando bien,
  vía `[data-accent]` + `[data-mode]` y tokens duales `--acc-d`/`--acc-l`, más
  **toggle sol/luna en el copete** en todas las pantallas.

Síntomas que hay que corregir: (1) al cambiar a **claro se ve mal** porque la capa
clara solo existe en el prototipo; (2) el **toggle de modo debe estar en el copete
y disponible en los 5 temas**, no solo en Home Redux.

## Fix 1 — Consolidar a 5 temas con claro/oscuro en los tokens base
En la hoja de tokens base:
- Reducir a **5 temas**: `ion, volt, blaze, indigo, pulse`. Quitar `solar`,
  `crimson`, `grape` (y sacarlos del selector de tema y de cualquier tipo/enum).
- Portar el patrón del prototipo: por acento definir **valor dark + valor
  light-AA** (`--acc-d` / `--acc-l`), y resolver `--accent` según
  `[data-mode="dark"|"light"]`. Agregar variantes claras de las superficies
  (`--bg/--card/--border/--fg/--muted/--track` …), no solo del acento.
- Reemplazar `color-scheme: dark` fijo por `color-scheme` según el modo activo.
- Fijar el hex definitivo de `indigo` (prototipo: `#8b90ff`/`#4f46e5`;
  tokens viejos: `#7c83ff`/`#6366f1`) — usar el del prototipo salvo indicación.

**Aceptación:** cada uno de los 5 temas se ve correcto en claro y en oscuro; todo
token de superficie tiene par claro; ningún componente queda ilegible al pasar a
claro (contraste AA en texto e iconos).

## Fix 2 — Toggle de modo en el copete, para todos los temas
- Portar el toggle sol/luna del prototipo (`.hdr-toggle` / `[data-toggle-mode]`)
  al header (copete) compartido de la app, visible en **todas** las pantallas y
  con los **5 temas**, no solo en Home Redux.
- Persistir modo (`dark`/`light`/`system`) igual que hoy el tema; respetar
  `prefers-color-scheme` cuando el modo es `system`.

**Aceptación:** desde cualquier pantalla y con cualquiera de los 5 temas, el toggle
del copete alterna claro/oscuro y persiste.

## Fix 3 — Configuración → Apariencia
Asegurar que la config de apariencia expone **modo (claro/oscuro/sistema) + acento
(los 5) + preview**, como en el prototipo (pantalla `config`). Si ya existe como
card en Perfil, solo verificar que liste 5 temas y el control de modo.

## Fix 4 — Sincronizar UI kit ↔ vivo
Este repo es la fuente; el UI kit de diseño (`ui_kits/shapeup/`) quedó viejo.
Dejar constancia en el PR de qué cambió para que diseño lo replique en el kit:
- Kit hoy: 8 temas, dark-only, sin toggle de modo, README con 3 layouts viejos.
- Vivo tras este pase: 5 temas, claro/oscuro, toggle en copete.
Listar en el PR el diff conceptual (temas quitados, tokens light nuevos, toggle)
para que el kit se actualice en paralelo. **No** hace falta tocar el kit desde
este repo; solo documentarlo.

## Verificación
`npx tsc -b` + `npx vitest run` limpios. Visual (Playwright headless, incluir
escala de grises): los 5 temas × {claro, oscuro} en Home, Configuración y una
pantalla de sesión; toggle del copete operando desde ≥2 pantallas. Confirmar merge
en `main` al cerrar (verificar con `git log --oneline main | head`).
