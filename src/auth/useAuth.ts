import { useContext } from "react";
import { AuthContext } from "./AuthContext";

/** Hook para consumir el estado de autenticación desde cualquier componente. */
export function useAuth() {
  return useContext(AuthContext);
}
