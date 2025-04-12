import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

// Define types for the AuthProvider props
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component that wraps the application with SessionProvider
 * to provide authentication context throughout the app
 */
export function AuthProvider({ children }: AuthProviderProps) {
  return <SessionProvider>{children}</SessionProvider>;
}
