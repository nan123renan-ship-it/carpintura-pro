"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

interface UserProfile {
  id: string;
  user_id: string;
  profile_type: string;
  created_at: string;
  updated_at: string;
}

interface ProfileContextType {
  currentProfile: UserProfile | null;
  profiles: UserProfile[];
  loading: boolean;
  selectProfile: (profileId: string) => void;
  createProfile: (profileType: string) => Promise<void>;
  refreshProfiles: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar perfis do usuário
  const loadProfiles = async () => {
    if (!user) {
      setProfiles([]);
      setCurrentProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setProfiles(data || []);

      // Se não há perfil selecionado mas há perfis disponíveis, selecionar o primeiro
      if (!currentProfile && data && data.length > 0) {
        const savedProfileId = localStorage.getItem('currentProfileId');
        const profileToSelect = savedProfileId 
          ? data.find((p: UserProfile) => p.id === savedProfileId) || data[0]
          : data[0];
        setCurrentProfile(profileToSelect);
        localStorage.setItem('currentProfileId', profileToSelect.id);
      }
    } catch (error) {
      console.error('Erro ao carregar perfis:', error);
    } finally {
      setLoading(false);
    }
  };

  // Criar novo perfil
  const createProfile = async (profileType: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          profile_type: profileType
        })
        .select()
        .single();

      if (error) throw error;

      setProfiles(prev => [...prev, data]);
      setCurrentProfile(data);
      localStorage.setItem('currentProfileId', data.id);
    } catch (error) {
      console.error('Erro ao criar perfil:', error);
      throw error;
    }
  };

  // Selecionar perfil
  const selectProfile = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      setCurrentProfile(profile);
      localStorage.setItem('currentProfileId', profileId);
      
      // Disparar evento para outras partes do app
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('profileChanged', { detail: profile }));
      }
    }
  };

  // Recarregar perfis
  const refreshProfiles = async () => {
    await loadProfiles();
  };

  // Carregar perfis quando o usuário mudar
  useEffect(() => {
    loadProfiles();
  }, [user]);

  return (
    <ProfileContext.Provider
      value={{
        currentProfile,
        profiles,
        loading,
        selectProfile,
        createProfile,
        refreshProfiles
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile deve ser usado dentro de ProfileProvider');
  }
  return context;
}
