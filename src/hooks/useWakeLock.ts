import { useEffect, useRef } from "react";

/**
 * Mantiene un Screen Wake Lock mientras `activo` sea true.
 * Vuelve a pedirlo si la página se oculta y regresa (visibilitychange).
 * Lo libera al desmontar o cuando activo pasa a false.
 */
export function useWakeLock(activo: boolean): void {
  const lockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!activo || !("wakeLock" in navigator)) return;
    let cancelled = false;

    async function solicitar() {
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (cancelled) { lock.release().catch(() => {}); return; }
        lockRef.current = lock;
        lock.addEventListener("release", () => { lockRef.current = null; });
      } catch { /* permiso denegado o API no soportada */ }
    }

    solicitar();

    function onVisibilityChange() {
      if (document.visibilityState === "visible" && !lockRef.current) solicitar();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      lockRef.current?.release().catch(() => {});
      lockRef.current = null;
    };
  }, [activo]);
}
