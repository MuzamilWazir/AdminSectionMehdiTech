import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { AuthUser } from "../types/auth";

interface Tokens {
  access: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: AuthUser | null;
  tokens: Tokens | null;
  loading: boolean; // Added to track initial storage check
  login: (user: AuthUser, tokens: Tokens) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load auth state from localStorage on refresh
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem("user");
        const storedTokens = localStorage.getItem("tokens");

        if (storedUser && storedTokens) {
          setUser(JSON.parse(storedUser));
          setTokens(JSON.parse(storedTokens));
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error("Failed to parse auth data", error);
        localStorage.removeItem("user");
        localStorage.removeItem("tokens");
      } finally {
        // This ensures the app doesn't stay in a loading state forever
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (userData: AuthUser, tokenData: Tokens) => {
    setUser(userData);
    setTokens(tokenData);
    setIsLoggedIn(true);

    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("tokens", JSON.stringify(tokenData));
  };

  const logout = () => {
    setUser(null);
    setTokens(null);
    setIsLoggedIn(false);

    localStorage.removeItem("user");
    localStorage.removeItem("tokens");
  };

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, user, tokens, login, logout, loading }}
    >
      {/* Crucial: We don't render children until the loading check is done. 
          This prevents the router from seeing isLoggedIn=false during the split-second 
          it takes to read from localStorage.
      */}
      {!loading ? (
        children
      ) : (
        <div className="flex h-screen w-full items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
