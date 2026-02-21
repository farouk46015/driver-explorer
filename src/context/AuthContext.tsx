import { createContext, useContext, useState } from 'react';
import userManager from '@/db/user';

interface AuthContextType {
  loading: boolean;
  user: { id: string; name: string; email: string } | null;
  isAuthenticated: () => Promise<boolean>;
  onLogout: () => void;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(() => {
    const userJson = localStorage.getItem('user');
    return userJson ? (JSON.parse(userJson) as { id: string; name: string; email: string }) : null;
  });

  return (
    <AuthContext.Provider
      value={{
        loading: false,
        user,
        isAuthenticated: async () => {
          return await userManager.isAuthenticated(user?.id ?? '');
        },
        onLogout: () => {
          setUser(null);
          localStorage.removeItem('user');
        },
        signIn: async (email, password) => {
          const result = await userManager.verifyCredentials(email, password);

          if (!result.success) {
            if (result.error === 'user_not_found') {
              return { success: false, error: 'User does not exist' };
            } else if (result.error === 'invalid_password') {
              return { success: false, error: 'Invalid credentials' };
            }
          }

          const foundUser = await userManager.getByEmail(email);
          if (foundUser) {
            setUser({
              id: foundUser.id,
              name: foundUser.name,
              email: foundUser.email,
            });
            localStorage.setItem('user', JSON.stringify(foundUser));
          }

          return { success: true };
        },
        signUp: async (email, password) => {
          const userId = await userManager.create(email, password);
          if (userId) {
            const foundUser = await userManager.getById(userId);
            if (foundUser) {
              setUser({
                id: foundUser.id,
                name: foundUser.name,
                email: foundUser.email,
              });
              localStorage.setItem('user', JSON.stringify(foundUser));
            }
          }
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
