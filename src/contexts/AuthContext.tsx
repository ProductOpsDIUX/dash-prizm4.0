// @ts-nocheck
import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'user_di' | 'uxsc' | 'superadmin' | 'user_non_di' | 'dsta_user' | 'user_iwf' | 'user_vendor' | 'mc';

interface AuthContextType {
  isAuthenticated: boolean;
  role: UserRole;
  activeRole: UserRole;
  allRoles: UserRole[];
  canToggleRole: boolean;
  setActiveRole: (role: UserRole) => void;
  isUXSC: boolean;
  isSuperAdmin: boolean;
  isMC: boolean;
  canEdit: boolean;
  isOnboarded: boolean;
  isEmailVerified: boolean;
  isLoading: boolean;
  supabaseUser: any;
  loginWithOAuth: (provider: 'google' | 'azure') => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined); // v2

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // One-time cleanup of stale legacy auth keys from previous versions of the app.
  // These were insecure (any user could set them in DevTools to impersonate roles).
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('dashAuthenticated');
      localStorage.removeItem('dashRole');
    } catch {
      // ignore
    }
  }

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [role, setRole] = useState<UserRole>('user_di');
  const [activeRole, setActiveRoleState] = useState<UserRole>('user_di');
  const [allRoles, setAllRoles] = useState<UserRole[]>(['user_di']);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const [sessionUser, setSessionUser] = useState<any | null | undefined>(undefined);

  const fetchUserRoles = async (userId: string): Promise<{ highest: UserRole; all: UserRole[] }> => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    const roles: UserRole[] = data && data.length > 0
      ? data.map((r: any) => r.role as UserRole)
      : ['user_di'];

    // Ensure 'user_di' is always included
    if (!roles.includes('user_di')) roles.push('user_di');

    let highest: UserRole = 'user_di';
    if (roles.includes('superadmin')) highest = 'superadmin';
    else if (roles.includes('uxsc')) highest = 'uxsc';
    else if (roles.includes('user_non_di')) highest = 'user_non_di';
    else if (roles.includes('dsta_user')) highest = 'dsta_user';
    else if (roles.includes('user_iwf')) highest = 'user_iwf';
    else if (roles.includes('user_vendor')) highest = 'user_vendor';
    else if (roles.includes('mc')) highest = 'mc';

    return { highest, all: roles };
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('onboarding_completed, email_verified, user_type')
      .eq('id', userId)
      .maybeSingle();

    return data;
  };

  const resetAuthState = () => {
    setSupabaseUser(null);
    setIsAuthenticated(false);
    setRole('user_di');
    setActiveRoleState('user_di');
    setAllRoles(['user_di']);
    setIsOnboarded(false);
    setIsEmailVerified(false);
  };

  const syncSupabaseUser = async (user: any, isCancelled: () => boolean) => {
    if (isCancelled()) return;

    // Only reset state if this is a NEW user (not a tab-switch re-trigger)
    const isNewUser = supabaseUser?.id !== user.id;

    setSupabaseUser(user);
    setIsAuthenticated(true);

    if (isNewUser) {
      setRole('user_di');
      setActiveRoleState('user_di');
      setAllRoles(['user_di']);
      setIsOnboarded(false);
      setIsEmailVerified(false);
    }

    const profile = await fetchProfile(user.id);
    if (isCancelled()) return;

    const onboarded = profile?.onboarding_completed ?? false;
    const emailVerified = profile?.email_verified ?? false;

    setIsOnboarded(onboarded);
    setIsEmailVerified(emailVerified);

    // Always fetch roles regardless of onboarding status
    const { highest, all } = await fetchUserRoles(user.id);
    if (isCancelled()) return;
    setRole(highest);

    // Restore persisted activeRole if valid, otherwise use highest
    const savedActiveRole = sessionStorage.getItem('dashActiveRole') as UserRole | null;
    const availableRoles = highest === 'superadmin' ? ['superadmin', 'uxsc', 'user_di', 'mc'] : all;

    if (!isNewUser && savedActiveRole && availableRoles.includes(savedActiveRole)) {
      setActiveRoleState(savedActiveRole);
    } else {
      // Always fall back to highest role (covers both new users and race conditions
      // where the first sync was cancelled before saving to sessionStorage)
      setActiveRoleState(highest);
      sessionStorage.setItem('dashActiveRole', highest);
    }

    if (highest === 'superadmin') {
      setAllRoles(['superadmin', 'uxsc', 'user_di', 'mc']);
    } else {
      setAllRoles(all);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      const newUser = session?.user ?? null;
      // Skip redundant updates (e.g. TOKEN_REFRESHED on tab switch) to avoid page resets
      setSessionUser((prev: any) => {
        if (prev?.id && newUser?.id && prev.id === newUser.id) return prev;
        return newUser;
      });
    });

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!isMounted) return;
        setSessionUser(session?.user ?? null);
      })
      .catch((error) => {
        console.error('Failed to restore Supabase session', error);
        if (!isMounted) return;
        setSessionUser(null);
      });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (sessionUser === undefined) return;

    let cancelled = false;
    const isCancelled = () => cancelled;

    const resolveAuthState = async () => {
      setIsLoading(true);

      if (sessionUser) {
        try {
          await syncSupabaseUser(sessionUser, isCancelled);
        } catch (error) {
          console.error('Failed to sync Supabase session', error);
          if (!isCancelled()) {
            resetAuthState();
          }
        } finally {
          if (!isCancelled()) {
            setIsLoading(false);
          }
        }
        return;
      }

      // No Supabase session → user is unauthenticated.
      resetAuthState();

      if (!isCancelled()) {
        setIsLoading(false);
      }
    };

    void resolveAuthState();

    return () => {
      cancelled = true;
    };
  }, [sessionUser]);

  const loginWithOAuth = async (provider: 'google' | 'azure') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      toast.error(`Login failed: ${error.message}`);
    }
  };

  const logout = async () => {
    sessionStorage.removeItem('dashActiveRole');

    // Reset state synchronously BEFORE signOut so components
    // (like Landing) see isAuthenticated=false immediately,
    // preventing a race-condition redirect back to '/'.
    resetAuthState();

    if (supabaseUser) {
      await supabase.auth.signOut();
    }

    toast.success('Successfully logged out!');
  };

  const canToggleRole = role === 'superadmin' || role === 'uxsc';
  const setActiveRole = (newRole: UserRole) => {
    if (canToggleRole) {
      setActiveRoleState(newRole);
      sessionStorage.setItem('dashActiveRole', newRole);
    }
  };

  const isUXSC = activeRole === 'uxsc' || activeRole === 'superadmin' || activeRole === 'mc';
  const isSuperAdmin = activeRole === 'superadmin';
  const isMC = activeRole === 'mc';
  // MC has UXSC-like read access but no edit/add/delete rights (except surveys & test results)
  const canEdit = !isMC;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        role,
        activeRole,
        allRoles,
        canToggleRole,
        setActiveRole,
        isUXSC,
        isSuperAdmin,
        isMC,
        canEdit,
        isOnboarded,
        isEmailVerified,
        isLoading,
        supabaseUser,
        loginWithOAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
