# Tarea: Borrar la rutina de Pistol Whip y reapuntar los programas (no hay espacio)

Repo: jpcofano/shapeup. Pistol Whip (**EJ-9001**) pide demasiado espacio. Se elimina la
rutina VR que lo usa (`RUT-0006`, que era 100% Pistol Whip) y los programas que la
referenciaban pasan a usar rutinas VR existentes más estacionarias.

**Importante:**
- **NO** tocar el catálogo: EJ-9001 (Pistol Whip) queda en `ejercicios` tal cual. No
  editar `seed-vr.ts`, no borrar el ejercicio, no cambiar `poseidoPorOwner`.
- Solo se borra la **rutina** RUT-0006 y se reapuntan **3 días de programa**.

## 1. `scripts/seed-plan.ts` — borrar RUT-0006 y reapuntar programas

### a) Eliminar la rutina RUT-0006 del array `RUTINAS`
Borrar este bloque completo:
```ts
  { id: "RUT-0006", nombre: "VR — Piernas y cardio (Pistol Whip)", foco: "VR",
    objetivo: "Recomposición", nivel: "Intermedio", nivelOrden: 2, lugar: "VR", equipo: ["VR"],
    descripcion: "Esquivar agachándose = sentadillas naturales. El que más suma piernas.", durEstMin: 30,
    bloques: [CVR(1, "EJ-9001", "Pistol Whip (VR)", 30, "Z3", "Pistol Whip")] },
```

### b) Reapuntar los 3 días de programa que usaban RUT-0006
- **PRG-0003**, día 2 (martes):
  ```ts
  { orden: 2, dia: "martes", etiqueta: "Martes — VR piernas (Pistol Whip)", tipo: "rutina", idRutina: "RUT-0006" },
  ```
  →
  ```ts
  { orden: 2, dia: "martes", etiqueta: "Martes — Cardio VR (quema)", tipo: "rutina", idRutina: "RUT-0004" },
  ```
- **PRG-0004**, día 4 (jueves):
  ```ts
  { orden: 4, dia: "jueves", etiqueta: "Jueves — VR piernas (Pistol Whip)", tipo: "rutina", idRutina: "RUT-0006" },
  ```
  →
  ```ts
  { orden: 4, dia: "jueves", etiqueta: "Jueves — VR (Body Combat)", tipo: "rutina", idRutina: "RUT-0008" },
  ```
- **PRG-0005**, día 1 (lunes):
  ```ts
  { orden: 1, dia: "lunes", etiqueta: "Lunes — Pistol Whip", tipo: "rutina", idRutina: "RUT-0006" },
  ```
  →
  ```ts
  { orden: 1, dia: "lunes", etiqueta: "Lunes — Beat the Beats", tipo: "rutina", idRutina: "RUT-0005" },
  ```
  (PRG-0005 ya usa RUT-0005 el miércoles; con el cambio Beat the Beats queda lunes y
  miércoles. Es un programa "solo VR" de 5 días con 4 rutinas disponibles tras quitar
  una, así que una repetición es inevitable; quedan a 2 días de distancia.)

## 2. Borrar el documento `rutinas/RUT-0006` de Firestore
Quitarlo del seed no borra el doc ya sembrado: hay que eliminarlo una vez. Desde la
consola de Firebase borrá `rutinas/RUT-0006`, **o** corré un script chico:

```ts
// scripts/borrar-rut-0006.ts
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
const __dir = dirname(fileURLToPath(import.meta.url));
const sa = JSON.parse(readFileSync(resolve(__dir, "service-account.json"), "utf8"));
initializeApp({ credential: cert(sa) });
await getFirestore().collection("rutinas").doc("RUT-0006").delete();
console.log("RUT-0006 borrada");
process.exit(0);
```
`npx tsx scripts/borrar-rut-0006.ts`

## 3. Re-sembrar los programas
```bash
npx tsx scripts/seed-plan.ts --dry-run   # revisar diff de PRG-0003/0004/0005
npx tsx scripts/seed-plan.ts --force     # aplicar (RUT-0006 ya no existe en el seed)
```

## 4. Verificación
- `grep -rn "RUT-0006\|EJ-9001\|Pistol Whip" scripts/ src/` → no debe quedar ninguna
  **rutina/programa** usándolos (Pistol Whip solo puede figurar en el catálogo de
  `seed-vr.ts`). Si hay un `RUT-0006` hardcodeado en `src/`, reapuntalo igual que arriba.
- En la app: RUT-0006 ya no aparece en la Biblioteca; PRG-0003 (martes), PRG-0004
  (jueves) y PRG-0005 (lunes) muestran sus nuevas rutinas. Pistol Whip (EJ-9001) sigue
  como ejercicio en la Biblioteca.
