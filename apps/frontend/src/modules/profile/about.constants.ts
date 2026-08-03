/**
 * 📌 Constantes da área "Sobre" / "Atualizações" do perfil.
 *
 * Extraídas de AboutTab.tsx para compartilhamento entre:
 *  - AboutTab (card clicável "Versões Propostas")
 *  - VersoesModal (conteúdo completo das versões)
 *  - UpdatesTab (notas de atualização — versão + conteúdo, sem data)
 *
 * ⚠️ Mantenha VERSIONS e RELEASE_NOTES em sincronia com o ROADMAP.md.
 */

export interface VersionInfo {
  tag: string;
  name: string;
  status: string;
  items: string[];
}

export const VERSIONS: VersionInfo[] = [
  {
    tag: 'v1.0',
    name: 'Fundação',
    status: 'Atual',
    items: [
      'Cadernos e folhas de anotação com editor rich text (TipTap)',
      'Flashcards com repetição espaçada (SM-2)',
      'Questões, simulados e revisões',
      'Planejamento de estudos: agenda, cronograma, metas e pomodoro',
      'Autenticação, perfil, avatares e histórico de cópia',
      'Tema Claro/Escuro/Automático sincronizado na conta entre dispositivos',
    ],
  },
  {
    tag: 'v1.5',
    name: 'Colaboração',
    status: 'Proposto',
    items: [
      'Compartilhamento de cadernos entre usuários',
      'Sincronização em tempo real do editor',
      'IA generativa para resumos e questões (via API)',
    ],
  },
  {
    tag: 'v2.0',
    name: 'Inteligência & Insights',
    status: 'Planejado',
    items: [
      'Dashboard avançado de desempenho e previsão de revisão',
      'Análise de lacunas de conhecimento por matéria',
      'Aplicativos nativos (Android/iOS) e modo offline',
    ],
  },
];

export interface ReleaseNote {
  version: string;
  latest?: boolean;
  highlights: string[];
}

export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: 'Julho 2026',
    latest: true,
    highlights: [
      'Tema Claro/Escuro/Automático com sincronização na conta entre dispositivos',
      'Toasts de feedback ao salvar o tema (sucesso/erro)',
      'Seletor de categorias de avatares colapsável no topo da aba Avatares',
      'Barra de ferramentas do editor com linha extra colapsável (como o BubbleMenu)',
      'Melhorias de leitura de texto nos cards no mobile',
      'Responsividade mobile completa: modais, perfil, configurações e abas',
      'Menu combinado de notificações + histórico de cópia no mobile',
      'CI com lint obrigatório (0 warnings) no GitHub Actions',
      'Melhorias de desempenho e tipagem em todo o monorepo',
    ],
  },
  {
    version: 'Julho 2026',
    highlights: [
      'Módulo de planejamento com agenda, calendário, metas e pomodoro',
      'Registro de revisões e histórico de estudos (Review Log)',
      'Flyout de planejamento no menu lateral para mobile',
      'Estilização avançada do editor (links, listas e tooltips)',
    ],
  },
  {
    version: 'Julho 2026',
    highlights: [
      'Lançamento do Arandu — plataforma de estudos inteligente',
      'Cadernos, folhas, tags, favoritos e lixeira',
      'Flashcards, questões, simulados e modo de estudo',
      'Autenticação com e-mail, verificação, termos de uso e exclusão de conta',
    ],
  },
];
