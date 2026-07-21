import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@workspace/api-client-react';

const STORAGE_KEY = 'vas.rememberedUser';

interface UserContextValue {
  currentUser: User | null;
  isLoaded: boolean;
  selectUser: (user: User, remember: boolean) => Promise<void>;
  clearUser: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (raw) {
          const parsed = JSON.parse(raw) as User;
          if (parsed && typeof parsed.id === 'number' && parsed.name) {
            setCurrentUser(parsed);
          }
        }
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true));
  }, []);

  const selectUser = useCallback(async (user: User, remember: boolean) => {
    setCurrentUser(user);
    try {
      if (remember) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // non-fatal
    }
  }, []);

  const clearUser = useCallback(async () => {
    setCurrentUser(null);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // non-fatal
    }
  }, []);

  return (
    <UserContext.Provider
      value={{ currentUser, isLoaded, selectUser, clearUser }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
