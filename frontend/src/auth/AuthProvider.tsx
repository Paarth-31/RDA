// import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
// import { authApi, setTokens, clearTokens, getToken, isLoggedIn } from '../services/api';

// // ── Types ─────────────────────────────────────────────────────────────────

// export interface AuthUser {
//   id: string;
//   email: string;
//   display_name: string;
//   avatar_url: string | null;
//   role: string;
//   is_verified: boolean;
//   two_fa_enabled: boolean;
//   created_at: string;
// }

// interface AuthContextType {
//   isAuthenticated: boolean;
//   isLoading: boolean;
//   user: AuthUser | null;
//   login: (email: string, password: string) => Promise<void>;
//   register: (email: string, password: string, displayName: string) => Promise<void>;
//   logout: () => void;
//   getToken: () => string | null;
//   error: string | null;
//   clearError: () => void;
// }

// // ── Context ───────────────────────────────────────────────────────────────

// const AuthContext = createContext<AuthContextType>({
//   isAuthenticated: false,
//   isLoading: true,
//   user: null,
//   login: async () => {},
//   register: async () => {},
//   logout: () => {},
//   getToken: () => null,
//   error: null,
//   clearError: () => {},
// });

// // ── Provider ──────────────────────────────────────────────────────────────

// interface AuthProviderProps {
//   children: React.ReactNode;
// }

// export function AuthProvider({ children }: AuthProviderProps) {
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [isLoading, setIsLoading]             = useState(true);
//   const [user, setUser]                       = useState<AuthUser | null>(null);
//   const [error, setError]                     = useState<string | null>(null);
//   const refreshTimerRef                       = useRef<ReturnType<typeof setInterval> | null>(null);

//   // On mount: check if we already have a valid token
//   useEffect(() => {
//     if (isLoggedIn()) {
//       authApi.me()
//         .then((u) => {
//           setUser(u as AuthUser);
//           setIsAuthenticated(true);
//         })
//         .catch(() => {
//           // Token expired / invalid — try refresh
//           const rt = localStorage.getItem('rda_refresh_token');
//           if (rt) {
//             authApi.refresh(rt)
//               .then(({ accessToken }) => {
//                 setTokens(accessToken, rt);
//                 return authApi.me();
//               })
//               .then((u) => {
//                 setUser(u as AuthUser);
//                 setIsAuthenticated(true);
//               })
//               .catch(() => {
//                 clearTokens();
//               })
//               .finally(() => setIsLoading(false));
//             return;
//           }
//           clearTokens();
//           setIsLoading(false);
//         })
//         .finally(() => setIsLoading(false));
//     } else {
//       setIsLoading(false);
//     }
//   }, []);

//   // Auto-refresh token every 10 minutes
//   useEffect(() => {
//     if (!isAuthenticated) return;
//     refreshTimerRef.current = setInterval(async () => {
//       const rt = localStorage.getItem('rda_refresh_token');
//       if (!rt) return;
//       try {
//         const { accessToken } = await authApi.refresh(rt);
//         setTokens(accessToken, rt);
//       } catch {
//         logout();
//       }
//     }, 10 * 60 * 1000);
//     return () => {
//       if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
//     };
//   }, [isAuthenticated]);

//   const login = async (email: string, password: string) => {
//     setError(null);
//     try {
//       const res = await authApi.login(email, password);
//       setTokens(res.accessToken, res.refreshToken);
//       setUser(res.user as AuthUser);
//       setIsAuthenticated(true);
//     } catch (e: any) {
//       setError(e.message ?? 'Login failed');
//       throw e;
//     }
//   };

//   const register = async (email: string, password: string, displayName: string) => {
//     setError(null);
//     try {
//       const res = await authApi.register(email, password, displayName);
//       setTokens(res.accessToken, res.refreshToken);
//       setUser(res.user as AuthUser);
//       setIsAuthenticated(true);
//     } catch (e: any) {
//       setError(e.message ?? 'Registration failed');
//       throw e;
//     }
//   };

//   const logout = () => {
//     const rt = localStorage.getItem('rda_refresh_token');
//     if (rt) authApi.logout(rt).catch(() => {});
//     clearTokens();
//     setUser(null);
//     setIsAuthenticated(false);
//   };

//   const clearError = () => setError(null);

//   return (
//     <AuthContext.Provider value={{
//       isAuthenticated, isLoading, user,
//       login, register, logout,
//       getToken, error, clearError,
//     }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   return useContext(AuthContext);
// }


import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import Keycloak from 'keycloak-js';

// ── Types ─────────────────────────────────────────────────────────────────

export interface AuthUser {
  name: string;
  email: string;
  username: string;
  token: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  logout: () => void;
  getToken: () => string | undefined;
}

// ── Keycloak instance — created once outside component ────────────────────

const keycloakInstance = new Keycloak({
  url: 'http://localhost:8180',
  realm: 'rda',
  clientId: 'rda-desktop',
});

// ── Context ───────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  logout: () => {},
  getToken: () => undefined,
});

// ── Provider ──────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading]             = useState(true);
  const [user, setUser]                       = useState<AuthUser | null>(null);
  const initializedRef                        = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    keycloakInstance
      .init({
        onLoad: 'login-required',
        checkLoginIframe: false,
        pkceMethod: 'S256',
        redirectUri: 'http://localhost:5173',
      })
      .then((authenticated: boolean) => {
        if (authenticated) {
          const parsed = keycloakInstance.tokenParsed;
          setIsAuthenticated(true);
          setUser({
            name:     parsed?.name || parsed?.preferred_username || 'User',
            email:    parsed?.email    ?? '',
            username: parsed?.preferred_username ?? '',
            token:    keycloakInstance.token ?? '',
          });
          (window as any).__keycloak_token = keycloakInstance.token;

        } else {
          keycloakInstance.login();
        }
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        console.error('Keycloak init error:', err);
        setIsLoading(false);
      });

    const refreshTimer = setInterval(() => {
      keycloakInstance
        .updateToken(70)
        .then((refreshed: boolean) => {
            if (refreshed && keycloakInstance.token) {
              (window as any).__keycloak_token = keycloakInstance.token; // ← add this
              setUser(prev =>
                prev ? { ...prev, token: keycloakInstance.token! } : prev
              );
            }
          })
        .catch(() => keycloakInstance.logout());
    }, 30_000);

    return () => clearInterval(refreshTimer);
  }, []);

  const logout = () =>
    keycloakInstance.logout({ redirectUri: 'http://localhost:5173' });

  const getToken = () => keycloakInstance.token;

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}