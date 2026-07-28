import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ClipboardItem {
  id: string;
  text: string;
  createdAt: number;
  favorited: boolean;
}

interface ClipboardState {
  items: ClipboardItem[];
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  addItem: (text: string) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, text: string) => void;
  toggleFavorite: (id: string) => void;
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
            favorited: false,
          };

          return {
            items: [newItem, ...state.items]
              .sort((a, b) => {
                if (a.favorited !== b.favorited) return a.favorited ? -1 : 1;
                return b.createdAt - a.createdAt;
              })
              .slice(0, MAX_ITEMS),
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

      toggleFavorite: (id) =>
        set((state) => {
          const updatedItems = state.items.map((item) =>
            item.id === id ? { ...item, favorited: !item.favorited } : item
          );
          // Sort: favorited items first, then by creation date descending
          return {
            items: updatedItems.sort((a, b) => {
              if (a.favorited !== b.favorited) return a.favorited ? -1 : 1;
              return b.createdAt - a.createdAt;
            }),
          };
        }),

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
