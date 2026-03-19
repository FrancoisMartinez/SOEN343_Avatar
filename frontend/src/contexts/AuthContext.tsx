import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { loginUser, registerUser, type LoginPayload, type RegisterPayload } from '../services/authService';

interface AuthState {
  token: string | null;
  userId: number | null;
  role: string | null;
}

interface AuthContextType extends AuthState {
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() => {
    const token = sessionStorage.getItem('token');
    const userId = sessionStorage.getItem('userId');
    const role = sessionStorage.getItem('role');
    return {
      token,
      userId: userId ? Number(userId) : null,
      role,
    };
  });

  useEffect(() => {
    if (auth.token) {
      sessionStorage.setItem('token', auth.token);
      sessionStorage.setItem('userId', String(auth.userId));
      sessionStorage.setItem('role', auth.role ?? '');
    } else {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('userId');
      sessionStorage.removeItem('role');
    }
  }, [auth]);

  const login = async (payload: LoginPayload) => {
    const data = await loginUser(payload);
    setAuth({ token: data.token, userId: data.userId, role: data.role });
  };

  const register = async (payload: RegisterPayload) => {
    const data = await registerUser(payload);
    setAuth({ token: data.token, userId: data.userId, role: data.role });
  };

  const logout = () => {
    setAuth({ token: null, userId: null, role: null });
  };

  return (
    <AuthContext.Provider
      value={{
        ...auth,
        isAuthenticated: !!auth.token,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
