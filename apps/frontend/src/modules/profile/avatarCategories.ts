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
  'Ash', 'Bella', 'Cole', 'Dolly', 'Edge',
  'Faye', 'Glen', 'Hope', 'Jack', 'Kira',
  'Liam', 'Mona', 'Nash', 'Oona', 'Paul',
  'Quinn', 'Rhea', 'Sage', 'Troy', 'Una',
  'Vince', 'Wade', 'Xena', 'Yves', 'Zack',
  'Ace', 'Blue', 'Calm', 'Dusk', 'Echo',
  'Fern', 'Gold', 'Haze', 'Jade', 'King',
  'Lake', 'Moss', 'Neon', 'Onyx', 'Pearl',
];

const CATEGORY_SEEDS = {
  adventurer: SEEDS.slice(0, 24),
  avataaars: SEEDS.slice(2, 26),
  'big-smile': SEEDS.slice(4, 28),
  lorelei: SEEDS.slice(6, 30),
  bottts: SEEDS.slice(8, 32),
  personas: SEEDS.slice(10, 34),
  'pixel-art': SEEDS.slice(12, 36),
  identicon: SEEDS.slice(14, 38),
  micah: SEEDS.slice(16, 40),
  'open-peeps': SEEDS.slice(18, 42),
  'fun-emoji': SEEDS.slice(24, 48),
  notionists: SEEDS.slice(26, 50),
  'adventurer-neutral': SEEDS.slice(28, 52),
  croodles: SEEDS.slice(30, 54),
  initials: SEEDS.slice(32, 56),
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
  {
    id: 'fun-emoji',
    name: 'Emojis',
    icon: '🎭',
    style: 'fun-emoji',
    variants: CATEGORY_SEEDS['fun-emoji'].map((seed) => ({ id: `emoji-${seed.toLowerCase()}`, seed })),
  },
  {
    id: 'notionists',
    name: 'Modernos',
    icon: '🎯',
    style: 'notionists',
    variants: CATEGORY_SEEDS.notionists.map((seed) => ({ id: `mod-${seed.toLowerCase()}`, seed })),
  },
  {
    id: 'adventurer-neutral',
    name: 'Neutros',
    icon: '😌',
    style: 'adventurer-neutral',
    variants: CATEGORY_SEEDS['adventurer-neutral'].map((seed) => ({ id: `neut-${seed.toLowerCase()}`, seed })),
  },
  {
    id: 'croodles',
    name: 'Rabiscos',
    icon: '✏️',
    style: 'croodles',
    variants: CATEGORY_SEEDS.croodles.map((seed) => ({ id: `rab-${seed.toLowerCase()}`, seed })),
  },
  {
    id: 'initials',
    name: 'Iniciais',
    icon: '📝',
    style: 'initials',
    variants: CATEGORY_SEEDS.initials.map((seed) => ({ id: `init-${seed.toLowerCase()}`, seed })),
  },
];

export const AVATAR_BASE_URL = 'https://api.dicebear.com/7.x';

export function getAvatarUrl(style: string, seed: string): string {
  return `${AVATAR_BASE_URL}/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

