import { create } from 'zustand';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface EditorStatusState {
  saveStatus: SaveStatus;
  lastUpdate: string | null; // ISO timestamp
  visible: boolean; // se deve mostrar na barra (true quando estiver no editor/caderno)
  setSaveStatus: (status: SaveStatus) => void;
  setLastUpdate: (timestamp: string | null) => void;
  show: () => void;
  hide: () => void;
}

export const useEditorStatusStore = create<EditorStatusState>((set) => ({
  saveStatus: 'idle',
  lastUpdate: null,
  visible: false,
  setSaveStatus: (saveStatus) => set({ saveStatus }),
  setLastUpdate: (lastUpdate) => set({ lastUpdate }),
  show: () => set({ visible: true }),
  hide: () => set({ visible: false, saveStatus: 'idle' }),
}));
