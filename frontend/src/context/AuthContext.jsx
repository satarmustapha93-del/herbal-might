import { createContext, useContext, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); setLoading(false); });
    return () => listener.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    let active = true;
    if (!session?.user) { setProfile(null); return; }
    supabase.from('profiles').select('id,email,role').eq('id', session.user.id).single()
     .then(({ data }) => { if (active) setProfile(data); });
    return () => { active = false; };
  }, [session]);
  const value = { session, user: session?.user?? null, profile, isAdmin: profile?.role === 'admin', loading,
    configured: isSupabaseConfigured,
    signOut: () => supabase?.auth.signOut(),
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signUp: (email, password) => supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } }),
    signInWithGoogle: () => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } }),
    signInWithFacebook: () => supabase.auth.signInWithOAuth({ provider: 'facebook', options: { redirectTo: window.location.origin } }),
    signInWithPhone: (phone) => supabase.auth.signInWithOtp({ phone }),
    verifyPhoneOtp: (phone, token) => supabase.auth.verifyOtp({ phone, token, type: 'sms' }),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);