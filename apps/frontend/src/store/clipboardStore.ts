import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ClipboardItem {
  id: string;
  text: string;
  createdAt: number;
}

interface ClipboardState {
  items: ClipboardItem[];
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  addItem: (text: string) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, text: string) => void;
  clearAll: () => void;
}

const MAX_ITEMS = 50;

export const useClipboardStore = create<ClipboardState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,

      setOpen: (open) => set({ isOpen: open }),

      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),

      addItem: (text) =>
        set((state) => {
          const trimmed = text.trim();
          if (!trimmed) return state;

          // Don't add duplicate consecutive texts
          if (state.items.length > 0 && state.items[0].text === trimmed) {
            return state;
          }

          const newItem: ClipboardItem = {
            id: crypto.randomUUID(),
            text: trimmed,
            createdAt: Date.now(),
          };

          return {
            items: [newItem, ...state.items].slice(0, MAX_ITEMS),
          };
        }),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      updateItem: (id, text) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, text } : item
          ),
        })),

      clearAll: () => set({ items: [] }),
    }),
    {
      name: 'arandu-clipboard',
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);
