import { useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { resolveMemberId } from "./resolveMemberId";
import { upsertUserDoc } from "./upsertUserDoc";
import type { MiembroId } from "../types/models";
import { AuthContext, type AuthState } from "./AuthContext";

/**
 * Envuelve la app y expone { user, memberId, loading } via AuthContext.
 * Cruza el email contra /config/familia; si no está, memberId = null.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user:     null,
    memberId: null,
    loading:  true,
  });

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ user: null, memberId: null, loading: false });
        return;
      }

      const result = await resolveMemberId(user.email ?? "");
      const memberId: MiembroId | null = result.ok ? result.value : null;

      if (memberId) {
        // fire-and-forget: no bloqueamos la UI si falla
        upsertUserDoc(user, memberId).catch(() => undefined);
      }

      setState({ user, memberId, loading: false });
    });
  }, []);

  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  );
}
