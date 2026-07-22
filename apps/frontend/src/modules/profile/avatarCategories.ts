export interface AvatarCategory {
  id: string;
  name: string;
  icon: string;
  style: string;
  variants: AvatarVariant[];
}

export interface AvatarVariant {
  id: string;
  seed: string;
}

const SEEDS = [
  'Luna', 'Oliver', 'Aria', 'Leo', 'Nina',
  'Max', 'Zara', 'Felix', 'Ivy', 'Theo',
  'Mila', 'Finn', 'Nova', 'Kai', 'Rosa',
  'Hugo', 'Lila', 'Dante', 'Skye', 'Yuna',
  'Eli', 'Zoe', 'Asher', 'Lena', 'Otis',
  'Maya', 'Rex', 'Vera', 'Juno', 'Wren',
  'Iris', 'Axel', 'Lara', 'Odin', 'Nala',
  'Remy', 'Saga', 'Boris', 'Tara', 'Coco',
];

const CATEGORY_SEEDS = {
  adventurer: SEEDS.slice(0, 20),
  avataaars: SEEDS.slice(2, 22),
  'big-smile': SEEDS.slice(4, 24),
  lorelei: SEEDS.slice(6, 26),
  bottts: SEEDS.slice(8, 28),
  personas: SEEDS.slice(10, 30),
  'pixel-art': SEEDS.slice(12, 32),
  identicon: SEEDS.slice(14, 34),
  micah: SEEDS.slice(16, 36),
  'open-peeps': SEEDS.slice(18, 38),
};

export const AVATAR_CATEGORIES: AvatarCategory[] = [
  {
    id: 'adventurer',
    name: 'Aventureiros',
    icon: '🏔️',
    style: 'adventurer',
    variants: CATEGORY_SEEDS.adventurer.map((seed) => ({ id: `adv-${seed.toLowerCase()}`, seed })),
  },
  {
    id: 'avataaars',
    name: 'Avatares',
    icon: '👤',
    style: 'avataaars',
    variants: CATEGORY_SEEDS.avataaars.map((seed) => ({ id: `avt-${seed.toLowerCase()}`, seed })),
  },
  {
    id: 'big-smile',
    name: 'Expressões',
    icon: '😊',
    style: 'big-smile',
    variants: CATEGORY_SEEDS['big-smile'].map((seed) => ({ id: `smile-${seed.toLowerCase()}`, seed })),
  },
  {
    id: 'lorelei',
    name: 'Arte Digital',
    icon: '🎨',
    style: 'lorelei',
    variants: CATEGORY_SEEDS.lorelei.map((seed) => ({ id: `lor-${seed.toLowerCase()}`, seed })),
  },
  {
    id: 'bottts',
    name: 'Robôs',
    icon: '🤖',
    style: 'bottts',
    variants: CATEGORY_SEEDS.bottts.map((seed) => ({ id: `bot-${seed.toLowerCase()}`, seed })),
  },
  {
    id: 'personas',
    name: 'Pessoas',
    icon: '👥',
    style: 'personas',
    variants: CATEGORY_SEEDS.personas.map((seed) => ({ id: `per-${seed.toLowerCase()}`, seed })),
  },
  {
    id: 'pixel-art',
    name: 'Pixel Art',
    icon: '🟦',
    style: 'pixel-art',
    variants: CATEGORY_SEEDS['pixel-art'].map((seed) => ({ id: `pix-${seed.toLowerCase()}`, seed })),
  },
  {
    id: 'identicon',
    name: 'Geométricos',
    icon: '🔷',
    style: 'identicon',
    variants: CATEGORY_SEEDS.identicon.map((seed) => ({ id: `id-${seed.toLowerCase()}`, seed })),
  },
  {
    id: 'micah',
    name: 'Ilustrações',
    icon: '✏️',
    style: 'micah',
    variants: CATEGORY_SEEDS.micah.map((seed) => ({ id: `mic-${seed.toLowerCase()}`, seed })),
  },
  {
    id: 'open-peeps',
    name: 'Personagens',
    icon: '🧩',
    style: 'open-peeps',
    variants: CATEGORY_SEEDS['open-peeps'].map((seed) => ({ id: `peep-${seed.toLowerCase()}`, seed })),
  },
];

export const AVATAR_BASE_URL = 'https://api.dicebear.com/7.x';

export function getAvatarUrl(style: string, seed: string): string {
  return `${AVATAR_BASE_URL}/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

