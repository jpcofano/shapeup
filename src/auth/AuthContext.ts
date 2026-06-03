import { createContext } from "react";
import type { User } from "firebase/auth";
import type { MiembroId } from "../types/models";

export interface AuthState {
  user:     User | null;
  memberId: MiembroId | null;
  loading:  boolean;
}

export const AuthContext = createContext<AuthState>({
  user:     null,
  memberId: null,
  loading:  true,
});
