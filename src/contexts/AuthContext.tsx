"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  nome: string;
  email: string;
  tipo_perfil: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, nome: string, tipoPerfil: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (nome: string, tipoPerfil: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      // Primeiro, verificar se a tabela perfis existe
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // Se o erro não for "row not found", criar o perfil a partir do localStorage
        const localProfile = localStorage.getItem('userProfile');
        if (localProfile) {
          const parsedProfile = JSON.parse(localProfile);
          const newProfile: UserProfile = {
            id: userId,
            nome: parsedProfile.nomeUsuario || 'Usuário',
            email: user?.email || '',
            tipo_perfil: parsedProfile.tipoPerfil || 'Pintor'
          };
          setProfile(newProfile);
        }
      } else if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, nome: string, tipoPerfil: string) => {
    try {
      // Salvar no localStorage primeiro (fallback)
      localStorage.setItem('userProfile', JSON.stringify({
        nomeUsuario: nome,
        tipoPerfil: tipoPerfil,
        onboardingConcluido: true
      }));

      // Criar usuário no Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome,
            tipo_perfil: tipoPerfil,
          },
          emailRedirectTo: undefined,
        }
      });

      if (authError) {
        // Tratar erros específicos
        if (authError.message?.includes('already registered') || authError.message?.includes('User already registered')) {
          return {
            error: {
              ...authError,
              message: 'Este e-mail já está cadastrado. Faça login.'
            }
          };
        }
        if (authError.message?.includes('email rate limit') ||
            authError.message?.includes('Email rate limit exceeded')) {
          return {
            error: {
              ...authError,
              message: 'Muitas tentativas de cadastro. Por favor, aguarde alguns minutos e tente novamente, ou faça login se já tem uma conta.'
            }
          };
        }
        return { error: authError };
      }

      if (!authData.user) {
        return { error: new Error('Falha ao criar usuário') };
      }

      // Criar perfil no banco de dados
      try {
        await supabase
          .from('perfis')
          .upsert(
            {
              id: authData.user.id,
              nome,
              email,
              tipo_perfil: tipoPerfil,
            },
            { onConflict: 'id' }
          );
      } catch (profileError) {
        console.warn('Aviso: perfil não foi salvo no banco:', profileError);
      }

      // Se já houver sessão, usuário está pronto
      if (authData.session) {
        setSession(authData.session);
        setUser(authData.user);
        setProfile({
          id: authData.user.id,
          nome,
          email,
          tipo_perfil: tipoPerfil
        });
        return { error: null };
      }

      // Caso contrário, tentar fazer login (Supabase pode criar usuário mas não sessão)
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!loginError && loginData.session) {
        setSession(loginData.session);
        setUser(loginData.user);
        setProfile({
          id: loginData.user.id,
          nome,
          email,
          tipo_perfil: tipoPerfil
        });
        return { error: null };
      }

      // Se chegou aqui, o usuário foi criado mas não consegue logar ainda
      // Pode ser que precise confirmação de email
      return {
        error: new Error('Conta criada! Verifique seu e-mail para confirmar ou tente fazer login.')
      };

    } catch (error: any) {
      console.error('Erro no signUp:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const updateProfile = async (nome: string, tipoPerfil: string) => {
    if (!user) return { error: new Error('Usuário não autenticado') };

    try {
      const { error } = await supabase
        .from('perfis')
        .update({ nome, tipo_perfil: tipoPerfil })
        .eq('id', user.id);

      if (error && error.code === '42P01') {
        // Tabela não existe, salvar no localStorage
        localStorage.setItem('userProfile', JSON.stringify({
          nomeUsuario: nome,
          tipoPerfil: tipoPerfil,
          onboardingConcluido: true
        }));

        setProfile({
          id: user.id,
          nome,
          email: user.email || '',
          tipo_perfil: tipoPerfil
        });

        return { error: null };
      }

      if (!error) {
        await loadProfile(user.id);
      }

      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
