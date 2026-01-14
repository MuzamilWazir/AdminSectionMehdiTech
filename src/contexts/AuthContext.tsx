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
  login: (user: AuthUser, tokens: Tokens) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Load auth state from localStorage on refresh
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      const storedTokens = localStorage.getItem("tokens");

      if (storedUser && storedTokens) {
        setUser(JSON.parse(storedUser));
        setTokens(JSON.parse(storedTokens));
        setIsLoggedIn(true);
      }
    } catch {
      localStorage.removeItem("user");
      localStorage.removeItem("tokens");
      setIsLoggedIn(false);
    }
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
    <AuthContext.Provider value={{ isLoggedIn, user, tokens, login, logout }}>
      {children}
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
