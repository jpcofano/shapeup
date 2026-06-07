import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallPromptResult {
  /** true si el navegador emitió beforeinstallprompt y aún no se instaló. */
  canInstall: boolean;
  /** true si la app ya está corriendo en modo standalone (ya instalada). */
  isInstalled: boolean;
  /** true si es iOS/Safari (que no emite beforeinstallprompt). */
  isIOS: boolean;
  /** Llama al prompt nativo de instalación. No-op si canInstall es false. */
  promptInstall: () => Promise<void>;
}

function detectStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigator as any).standalone === true
  );
}

function detectIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * Gestiona el ciclo de vida del prompt de instalación PWA.
 * - Escucha `beforeinstallprompt` (Chrome/Android/Desktop).
 * - Detecta modo standalone (ya instalado) y iOS (sin prompt nativo).
 * - Expone `promptInstall()` que dispara el prompt y limpia el evento.
 */
export function useInstallPrompt(): InstallPromptResult {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => detectStandalone());
  const isIOS = detectIOS();

  useEffect(() => {
    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    }

    function handleAppInstalled() {
      setDeferred(null);
      setIsInstalled(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function promptInstall() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferred(null);
  }

  return {
    canInstall:    !!deferred,
    isInstalled,
    isIOS,
    promptInstall,
  };
}
