// Sistema de anotações por perfil
// Cada perfil pode ter suas próprias anotações para cada serviço

export interface ProfileNote {
  servicoId: string;
  profileType: string; // Tipo do perfil (Pintor, Preparador, etc.)
  nota: string;
  categorias: string[]; // Múltiplas categorias
  dataAtualizacao: string;
}

const STORAGE_KEY = 'carpintura_profile_notes';

// Obter todas as anotações
export const getAllProfileNotes = (): ProfileNote[] => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const notes: ProfileNote[] = stored ? JSON.parse(stored) : [];
    // Garantir compatibilidade com notas antigas que não têm categorias
    return notes.map(n => ({ ...n, categorias: n.categorias ?? [] }));
  } catch (error) {
    console.error('Erro ao carregar anotações do perfil:', error);
    return [];
  }
};

// Salvar todas as anotações
const saveAllProfileNotes = (notes: ProfileNote[]): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (error) {
    console.error('Erro ao salvar anotações do perfil:', error);
  }
};

// Obter anotação de um serviço para um perfil específico
export const getProfileNote = (servicoId: string, profileType: string): string => {
  const allNotes = getAllProfileNotes();
  const note = allNotes.find(
    n => n.servicoId === servicoId && n.profileType === profileType
  );
  return note?.nota || '';
};

// Obter anotação completa (com categorias)
export const getProfileNoteData = (servicoId: string, profileType: string): ProfileNote | null => {
  const allNotes = getAllProfileNotes();
  return allNotes.find(n => n.servicoId === servicoId && n.profileType === profileType) || null;
};

// Salvar ou atualizar anotação com categorias
export const saveProfileNote = (
  servicoId: string,
  profileType: string,
  nota: string,
  categorias: string[] = []
): void => {
  const allNotes = getAllProfileNotes();
  const existingIndex = allNotes.findIndex(
    n => n.servicoId === servicoId && n.profileType === profileType
  );

  const newNote: ProfileNote = {
    servicoId,
    profileType,
    nota,
    categorias,
    dataAtualizacao: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    allNotes[existingIndex] = newNote;
  } else {
    allNotes.push(newNote);
  }

  saveAllProfileNotes(allNotes);

  // Dispara evento para que componentes na mesma aba possam re-carregar
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('profileNotesUpdated', { detail: { servicoId } }));
  }
};

// Remover anotação de um serviço para um perfil específico
export const deleteProfileNote = (servicoId: string, profileType: string): void => {
  const allNotes = getAllProfileNotes();
  const filteredNotes = allNotes.filter(
    n => !(n.servicoId === servicoId && n.profileType === profileType)
  );
  saveAllProfileNotes(filteredNotes);
};

// Remover todas as anotações de um serviço (quando o serviço é excluído)
export const deleteAllNotesForService = (servicoId: string): void => {
  const allNotes = getAllProfileNotes();
  const filteredNotes = allNotes.filter(n => n.servicoId !== servicoId);
  saveAllProfileNotes(filteredNotes);
};

// Obter todas as anotações de um perfil específico
export const getAllNotesForProfile = (profileType: string): ProfileNote[] => {
  const allNotes = getAllProfileNotes();
  return allNotes.filter(n => n.profileType === profileType);
};
