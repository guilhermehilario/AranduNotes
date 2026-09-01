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
/** 🔐 BAIXO-36: Limita tamanho de cada item (evita senhas/dados sensíveis grandes) */
const MAX_ITEM_LENGTH = 500;

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

          // 🔐 BAIXO-36: Truncar texto longo
          const truncated = trimmed.length > MAX_ITEM_LENGTH
            ? trimmed.slice(0, MAX_ITEM_LENGTH) + "…"
            : trimmed;

          // Don't add duplicate consecutive texts
          if (state.items.length > 0 && state.items[0].text === truncated) {
            return state;
          }

          const newItem: ClipboardItem = {
            id: crypto.randomUUID(),
            text: truncated,
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
        set((state) => {
          const truncated = text.length > MAX_ITEM_LENGTH
            ? text.slice(0, MAX_ITEM_LENGTH) + "…"
            : text;
          return {
            items: state.items.map((item) =>
              item.id === id ? { ...item, text: truncated } : item
            ),
          };
        }),

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
