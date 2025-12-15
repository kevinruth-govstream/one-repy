import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { store } from '@/lib/store';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log(`🔐 Auth state change: ${event}, User: ${session?.user?.email || 'none'}`);
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Update store with proper session context
        store.setUser(session?.user ?? null);
        
        // Handle auth events
        if (event === 'SIGNED_IN' && session?.user) {
          // Wait a moment for auth context to fully establish
          setTimeout(async () => {
            try {
              console.log('🔄 Loading data after sign in...');
              const { loadStoreFromDatabase } = await import('@/lib/storeLoader');
              await loadStoreFromDatabase();
              console.log('✅ Data synced after sign in');
            } catch (error) {
              console.warn('⚠️ Failed to sync data after sign in:', error);
            }
          }, 100);
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out, using localStorage only');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      console.log(`🔍 Initial session check: ${session?.user?.email || 'none'}`);
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Update store with initial auth state
      store.setUser(session?.user ?? null);
      
      // If user exists, try to load data
      if (session?.user) {
        setTimeout(async () => {
          try {
            console.log('🔄 Loading data from initial session...');
            const { loadStoreFromDatabase } = await import('@/lib/storeLoader');
            await loadStoreFromDatabase();
            console.log('✅ Initial data sync completed');
          } catch (error) {
            console.warn('⚠️ Failed initial data sync:', error);
          }
        }, 100);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};