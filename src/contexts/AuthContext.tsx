import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: number;
  access_pages: string[];
}

interface Tokens {
  access: string;
  refresh: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  tokens: Tokens | null;
  login: (user: User, tokens: Tokens) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      const storedTokens = localStorage.getItem('tokens');
      return !!(storedUser && storedTokens && JSON.parse(storedUser) && JSON.parse(storedTokens));
    } catch {
      return false;
    }
  });
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<Tokens | null>(null);

  useEffect(() => {
    console.log('AuthContext useEffect running...');
    const storedUser = localStorage.getItem('user');
    const storedTokens = localStorage.getItem('tokens');
    console.log('Raw localStorage values:', { storedUser, storedTokens });
    
    let userParsed = false;
    let tokensParsed = false;
    
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        console.log('Parsed user data:', userData);
        setUser(userData);
        userParsed = true;
      } catch (error) {
        console.error('Failed to parse user data from localStorage:', error);
        localStorage.removeItem('user');
      }
    }
    
    if (storedTokens) {
      try {
        const tokenData = JSON.parse(storedTokens);
        console.log('Parsed token data:', tokenData);
        setTokens(tokenData);
        tokensParsed = true;
      } catch (error) {
        console.error('Failed to parse tokens from localStorage:', error);
        localStorage.removeItem('tokens');
      }
    }
    
    console.log('Parse results:', { userParsed, tokensParsed });
    // Only set isLoggedIn to false if both failed to parse
    if (!userParsed || !tokensParsed) {
      console.log('Setting isLoggedIn to false');
      setIsLoggedIn(false);
    }
  }, []);

  const login = (userData: User, tokenData: Tokens) => {
    console.log('AuthContext login called with:', { userData, tokenData });
    setUser(userData);
    setTokens(tokenData);
    setIsLoggedIn(true);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('tokens', JSON.stringify(tokenData));
    console.log('Stored in localStorage:', {
      user: localStorage.getItem('user'),
      tokens: localStorage.getItem('tokens')
    });
  };

  const logout = () => {
    setUser(null);
    setTokens(null);
    setIsLoggedIn(false);
    localStorage.removeItem('user');
    localStorage.removeItem('tokens');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, tokens, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};