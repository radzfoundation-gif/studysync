"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

    const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // PGRST116 means "0 rows returned" for .single()
        // This can happen if the trigger hasn't finished or the profile was deleted
        if (error.code === 'PGRST116') {
          console.warn('Profile not found for user:', userId);
          // Create missing profile with role from metadata if available, else default student
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) {
            console.error('Session error:', sessionError);
            setProfile(null);
            return;
          }
          const session = sessionData?.session;
          const userMeta = session?.user?.user_metadata ?? {};
          const roleFromMeta = userMeta?.role as 'student' | 'teacher' | 'staff' | 'admin' ?? 'student';
          // Do not overwrite existing role; only insert if missing
          const { error: insertError } = await supabase.from('profiles').insert({
            id: userId,
            email: session?.user?.email ?? '',
            full_name: userMeta?.full_name ?? 'User',
            role: roleFromMeta,
          });
          if (insertError) {
            console.error('Failed to create missing profile:', insertError);
          } else {
            // Refetch after insert
            const { data: newData, error: fetchError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .single();
            if (!fetchError && newData) {
              setProfile(newData);
            }
          }
        } else {
          console.error('Error fetching profile:', error.message || error);
        }
      } else {
        setProfile(data);
      }
    } catch (error: any) {
      console.error('Unexpected error fetching profile:', error.message || error);
      setProfile(null);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
