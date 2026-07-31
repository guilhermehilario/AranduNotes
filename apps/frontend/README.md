# 🎨 Arandu — Frontend

Plataforma inteligente de anotações e estudos — módulo frontend (SPA React).

---

## 📖 Visão Geral

O **Arandu** (que significa "saber" em Tupi Antigo) é uma plataforma completa para criação, organização e revisão de conteúdo de estudos. Este é o frontend da aplicação, uma SPA construída com React 19 + Vite.

---

## 🛠️ Stack

| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| React | 19 | UI Library |
| Vite | 8 | Build tool |
| TypeScript | ~5.9.3 | Linguagem (alinhado com a raiz do monorepo) **(Novo)** |
| Tailwind CSS | 4 | Estilos utilitários |
| Zustand | 5 | Estado global (persist + middleware) |
| TanStack React Query | 5 | Server state & cache |
| React Router DOM | 7 | Roteamento SPA |
| React Hook Form + Zod | v4 | Formulários + validação |
| TipTap | 3 | Editor rich text |
| @dnd-kit | v6/core, v10/sortable | Drag & drop |
| Lucide React | v1 | Ícones |
| Axios | v1 | HTTP client |
| Vitest | v4 | Test runner |
| Testing Library | — | Testes de componentes |

---

## 📁 Estrutura

```
apps/frontend/
├── public/
│   ├── _redirects          # Fallback SPA (Netlify/Render)
│   └── 404.html
├── src/
│   ├── components/
│   │   ├── core/
│   │   │   └── api/         # Axios client + interceptors
│   │   ├── layout/          # AppLayout, Sidebar, AppHeader, Breadcrumb
│   │   │   ├── sidebar/         # Sidebar com PlanningFlyout, hooks
│   │   │   └── app-header/     # HeaderTitle, HeaderActions, hooks
│   │   └── ui/              # Button, Card, Modal, Input, Toast, Skeleton, etc.
│   ├── hooks/               # Hooks globais (useDebounce)
│   ├── modules/             # Módulos funcionais
│   │   ├── auth/            # Login, registro, recuperação de senha
│   │   ├── bookmarks/       # Gerenciamento de favoritos
│   │   ├── leaves/          # Editor TipTap + IA (resumo, flashcards)
│   │   ├── notebooks/       # Dashboard + CRUD de cadernos
│   │   ├── planning/        # Agenda, calendário, cronograma, metas, pomodoro
│   │   ├── profile/         # Perfil, avatar personalizável, configurações
│   │   ├── questions/       # Questões de estudo
│   │   ├── mock-exams/      # Simulados
│   │   ├── study/           # Flashcards SM-2, revisões, histórico, estatísticas
│   │   ├── tags/            # Tags para classificação
│   │   ├── todos/           # Lista de tarefas
│   │   └── trash/           # Lixeira + arquivados
│   ├── routes/              # React Router v7 + guards (PrivateRoute, PublicRoute)
│   ├── store/               # Zustand stores (ui, editor, toast, notification, pomodoro, clipboard, planning)
│   ├── styles/              # CSS do editor Tiptap, annotations, base, components
│   ├── utils/               # api-errors, parse-options
│   ├── test/                # Setup de testes
│   ├── App.tsx              # Componente raiz
│   ├── index.css            # Tailwind + tema (claro/escuro)
│   └── main.tsx             # Entry point
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
└── package.json
```

---

## ⚙️ Funcionalidades

### 📝 Editor de Texto (TipTap)
- Toolbar multi-linha com formatação completa (negrito, itálico, headings, listas, blocos de código, tasks)
- Pincel de formatação
- Anotações coloridas
- Autosave com debounce (1.5s)
- Suporte a links com tooltip
- Bubble menu para formatação rápida

### 🗂️ Cadernos e Folhas
- Dashboard em grid com cards coloridos
- CRUD completo com soft-delete
- Folhas hierárquicas com drag & drop (`@dnd-kit`)
- Sub-folhas em árvore
- Reordenação por posição

### 🃏 Flashcards (SM-2)
- Repetição espaçada (algoritmo SM-2)
- Scores 0-5 (esqueci → perfeito)
- Geração automática por IA
- Criação manual
- Cache de 365 dias
- Revisão com progresso persistente
- **Histórico de revisões** com timeline diária

### 🧠 Estudos
- Modos: Flashcards, Questões, Simulados, Revisões
- Sessão persistente (salva no backend)
- Estatísticas de progresso (total, revisados hoje, pendentes, taxa de acerto)
- Breakdown por caderno
- **Histórico de 30 dias** com médias e timeline expansível

### 📅 Planejamento
- **Agenda:** Eventos diários com toggle de conclusão
- **Calendário:** Visão mensal com indicadores de eventos
- **Cronograma:** Timeline com marcos importantes
- **Metas:** Metas de estudo com barra de progresso
- **Pomodoro:** Timer foco/descanso com histórico e timer flutuante
- **Resumo Semanal:** Cards no Dashboard

### 👤 Perfil
- Nome, email, avatar
- **Avatar personalizável** com múltiplas categorias (DiceBear)
- Alteração de senha
- Exclusão de conta com confirmação por código
- Preferências do sistema (tema, notificações)
- **Aba "Sobre"** com descrição do projeto, roadmap de versões, apoio coletivo (chave PIX em breve) e notas de atualização **(Novo)**

### 📱 Responsividade Mobile **(Novo)**
- Modais com `dvh` + `overscroll-contain` + grids empilhados (padrão aplicado a todos os modais do app)
- Menu combinado de notificações + clipboard no header mobile
- Abas de perfil e configurações com scroll horizontal e containers responsivos
- Auditoria de grids 2-3 colunas: `StudyHistory` corrigido para empilhar em telas estreitas

### 🔧 Outras
- Autenticação JWT + refresh token em cookie HttpOnly
- Tags e bookmarks
- Lixeira com soft-delete (15 dias)
- Lista de tarefas
- Gestor de clipboard com busca e favoritos
- Notificações in-app e nativas (Browser API)
- Tema claro/escuro
- Responsivo

---

## 🚀 Como Rodar

```bash
# A partir da raiz do monorepo
yarn install

# Configure as envs (veja README.md raiz)
# apps/frontend/.env:
# VITE_API_URL=http://localhost:3000/api

# Inicie o frontend em modo dev
yarn workspace frontend dev
# ou (da raiz):
yarn dev
```

Acesse: [http://localhost:5173](http://localhost:5173)

### Scripts úteis

| Comando | Descrição |
|---------|-----------|
| `yarn dev` | Dev server (Vite) |
| `yarn build` | Build de produção |
| `yarn lint` | ESLint |
| `npx tsc --noEmit` | Typecheck |

---

## 🧪 Testes

```bash
# Unitários (Vitest)
yarn workspace frontend test

# Com cobertura
yarn workspace frontend test --coverage

# Typecheck
cd apps/frontend && npx tsc --noEmit
```

---

## 📐 Padrões de Código

### Estrutura de arquivos e nomenclatura

- Arquivos de componentes usam **PascalCase**: `MeuComponente.tsx`
- Arquivos de hooks usam **camelCase** prefixados com `use`: `useMeuHook.ts`
- Arquivos de serviço/API usam **camelCase**: `meuService.ts`
- Constantes e tipos em **PascalCase** para types/interfaces, **camelCase** para constantes

### Regras de imports

- Use **type-only imports** para tipos: `import type { MeuTipo } from './types'`
- Sempre inclua a extensão `.ts` ou `.tsx` nos imports relativos (ex: `'./Componente.tsx'`)
- Prefira imports absolutos com `@/` quando configurado, ou caminhos relativos

### Componentes React e hooks

- Componentes funcionais com TypeScript, tipando `props` explicitamente
- Extraia hooks customizados para lógica reutilizável
- Prefira composição sobre herança

### Zustand stores (regra do `getState()`)

- Use `get()` dentro de actions para ler estado atual
- Use `getState()` fora do componente para acessar estado sem re-renderizar
- Prefira `persist` middleware para dados que devem sobreviver ao refresh
- `partialize` para controlar o que é persistido

### React Query (mutations otimistas)

- Use `useMutation` com `onMutate` para atualizações otimistas
- Faça `queryClient.setQueryData` antes de confirmar no servidor
- Use `onError` para reverter o cache em caso de falha
- Use `onSettled` para invalidar queries e sincronizar

### Tratamento de erros

- Use o `ApiErrorAlert` para exibir erros da API no UI
- Erros inesperados devem ser logados e mostrar toast de erro
- Prefira tratamento local a propagar exceções sem contexto

### Anti-padrões conhecidos

- ❌ Mutar estado do Zustand diretamente fora de actions
- ❌ Usar `useEffect` para sincronizar estado que pode ser derivado
- ❌ Importar tipos sem `type` (gera bundle maior)
- ❌ Espalhar lógica de API em componentes (use services separados)

### Checklist de code review

- [ ] TypeScript compila sem erros (`npx tsc --noEmit`)
- [ ] Testes passam (`vitest run`)
- [ ] ESLint limpo
- [ ] Mutations têm tratamento de erro
- [ ] Stores não vazam para fora do seu escopo
- [ ] Imports têm extensão `.ts`/`.tsx`
- [ ] Tipos são type-only imports
