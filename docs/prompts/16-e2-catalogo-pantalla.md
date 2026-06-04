# Prompt 16 — E2.1 · Recuperar la pantalla de Catálogo

> La etapa E2 dejó la capa de datos (`src/data/ejercicios.ts`) y los filtros
> (`src/lib/filtros.ts`) listos, pero la **pantalla** de Catálogo quedó como placeholder y, por
> el ADR #006, salió del nav inferior para meter Salud. Hoy no hay forma de llegar al catálogo
> desde la UI. Recuperala.
>
> (1) Construí la pantalla **Catálogo** de verdad: lista de ejercicios con buscador y filtros
> usando `lib/filtros.ts` (región/equipo/modalidad/patrón/nivel + texto), leyendo de
> `data/ejercicios.ts`. Tarjeta por ejercicio que muestre nombre, grupo muscular, equipo y, al
> abrir, sus `instrucciones`/`puntosClave`/`erroresComunes`. Alta/edición **solo para el owner**
> (las reglas ya lo exigen; ocultá el botón para los demás).
> (2) Resolvé el **acceso** sin amontonar el nav inferior (mantené 6 ítems): lo más prolijo es
> un control de pestañas arriba de la pantalla de **Biblioteca/Rutinas** ("Rutinas | Ejercicios"),
> ya que el catálogo se navega junto con las rutinas. Documentá la decisión en un ADR. Asegurate
> de que también se llegue al catálogo al **elegir ejercicios** en el editor de rutina (E3).
> (3) Notá que el catálogo ahora incluye los ejercicios del plan (`EJ-8001+`) y los juegos de VR
> (`EJ-9001+`, modalidad Cardio / equipo VR): verificá que los filtros los muestren bien.
>
> Al terminar, actualizá `docs/MAPEO-IMPLEMENTACION.md` (Bitácora E2.1, Estado → E2 ✅, Mapa del
> código, ADR del acceso). JSDoc en lo público. `git add -A && git commit` + `git push`.
> **Pará y esperá mi revisión.**
