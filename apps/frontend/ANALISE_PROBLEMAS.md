# 🔍 Análise de Problemas — Revisa Aula

> **Data:** 08/07/2026 (Revisão pós-limpeza)
> **Escopo:** Frontend (React 19 + Vite 8 + TypeScript) e Backend (NestJS 11 + Prisma ORM 7 + SQLite)

---

## Sumário

1. [🔴 Problemas Críticos](#1--problemas-críticos)
2. [🟡 Problemas de Qualidade e Manutenibilidade](#2--problemas-de-qualidade-e-manutenibilidade)
3. [🟡 Problemas de UX e UI](#3--problemas-de-ux-e-ui)
4. [🟢 Problemas de Performance](#4--problemas-de-performance)
5. [🟢 Problemas de Configuração e DevEx](#5--problemas-de-configuração-e-devex)
6. [📊 Resumo e Priorização](#6--resumo-e-priorização)

---

## 1. 🔴 Problemas Críticos

### 1.1. IA totalmente mockada (funcionalidade falsa)

**Arquivo:** `server/src/leaves/utils/ai-mock.service.ts`

**Problema:** A geração de resumos e flashcards por IA é completamente simulada com templates fixos. Não há integração com nenhum serviço real (OpenAI, Anthropic, etc.).

**Impacto:** O produto não entrega o valor prometido de "geração inteligente". Isso engana o usuário e torna o core diferencial do app inútil.

**Solução:** Integrar com API real de IA (OpenAI, Anthropic Claude, etc.). Usar o Gravity Index para escolher o provider.

**Esforço:** Alto

---

### 1.2. Sem testes automatizados

**Problema:** O projeto não possui testes unitários, de integração ou E2E. Qualquer refatoração corre alto risco de quebrar funcionalidades.

**Impacto:** Dificuldade de evoluir o código com segurança. Regression bugs frequentes.

**Solução:** Implementar ao menos testes unitários para:
- Algoritmo SM-2 (`flashcards.service.ts`)
- Cálculo de estatísticas (`study.service.ts`)
- Hooks críticos (useAuth, useLeaves)
- Componentes principais (EditorView, StudyView)

**Esforço:** Alto

---

## 2. 🟡 Problemas de Qualidade e Manutenibilidade

### 2.1. NotebookView ainda grande (~210 linhas)

**Arquivo:** `src/modules/notebooks/views/NotebookView.tsx`

**Problema:** NotebookView foi parcialmente refatorado: modais de criação de folha e edição de caderno foram extraídos para componentes separados (`CreateLeafModal.tsx`, `EditNotebookModal.tsx`), reduzindo de ~385 para ~210 linhas.

**Pendente:** O modal de criação manual de flashcard ainda está inline e a lógica de CRUD de folhas/flashcards ainda está no componente. Pode ser extraído em hooks ou subcomponentes adicionais.

**Esforço:** Baixo (restante)

---

### 2.2. Import default vs named export inconsistente

**Arquivos:** ~65 arquivos ainda usam `export default`

**Problema:** O projeto mistura `export default` e `export const`/`export function`. Isso causa inconsistência nas importações e dificulta refatorações.

**Solução:** Remover todos os `export default` e usar apenas named exports. Pode ser feito gradualmente.

**Esforço:** Médio (gradual)

---

### 2.3. Sem `lastReviewedAt` no modelo Flashcard

**Arquivo:** `server/prisma/schema.prisma`

**Problema:** O cálculo de `reviewedToday` usa `updatedAt` como proxy de "última revisão", mas `updatedAt` muda também na criação do card. A verificação atual (`repetitions > 0 || interval > 0 || easeFactor != 2.5`) é uma heurística, não uma verdade absoluta.

**Solução:** Adicionar coluna `lastReviewedAt` no modelo `Flashcard` e atualizar o cálculo de stats para usá-la.

**Esforço:** Baixo

---

### 2.4. `console.error` sem toasts em hooks

**Arquivos:** `src/modules/leaves/hooks/useEditorActions.ts` (archive, delete, IA generation)

**Problema:** Os `catch` blocks usam `console.error` em vez de exibir toasts para o usuário, silenciando erros importantes.

**Solução:** Substituir `console.error` por `useToastStore.getState().addToast(...)`.

**Esforço:** Baixo

---

## 3. 🟡 Problemas de UX e UI

### 3.1. Skeleton exibido mesmo com dados em cache (parcial)

**Arquivo:** `src/modules/leaves/views/EditorView.tsx`

**Problema:** A condição `if (!leaf && isLoadingLeaf)` exibe o `EditorSkeleton` mesmo quando a leaf já está no cache da query. Isso causa um falso carregamento em navegações rápidas.

**Solução:** Usar `isFetching && !isStale` em vez de `isLoading`, ou usar `placeholderData` do TanStack Query para manter dados em cache.

**Esforço:** Baixo

---

## 4. 🟢 Problemas de Performance

### 4.1. `editorStatus.setSaveStatus('saving')` chamado a cada tecla no título

**Arquivo:** `src/modules/leaves/views/EditorView.tsx` (linha 68-70)

**Problema:** O `onChange` do título chama `editorStatus.setSaveStatus("saving")` a cada caractere digitado, mesmo sem debounce no status de salvamento. O conteúdo do editor é debounced via `useEditorContent`, mas o título não — ele tem debounce separado.

**Impacto:** Mínimo, pois a store é leve, mas causa chamadas extras desnecessárias no Zustand.

**Solução:** Remover `editorStatus.setSaveStatus("saving")` do `onChange` do título e deixar o debounce do auto-save gerenciar o status.

**Esforço:** Muito Baixo

---

## 5. 🟢 Problemas de Configuração e DevEx

### 5.1. Sem pre-commit hooks (Husky + lint-staged)

**Problema:** Não há Husky ou lint-staged configurados para rodar ESLint e TypeScript check antes de commits.

**Solução:** Configurar Husky + lint-staged.

**Esforço:** Baixo

---

### 5.2. Validação de env apenas parcial no startup

**Arquivo:** `server/src/main.ts`

**Problema:** Apenas `FRONTEND_URL` é validada no startup (em produção). `JWT_SECRET` e `DATABASE_URL` têm fallbacks hardcoded que funcionam em dev, mas podem passar despercebidos em produção.

**Solução:** Adicionar validação com `class-validator` ou `joi` no bootstrap para todas as variáveis obrigatórias.

**Esforço:** Baixo

---

## 6. 📊 Resumo e Priorização

| Prioridade | Categoria | Problema | Esforço |
|------------|-----------|----------|---------|
| 🔴 Crítico | Funcionalidade | IA mockada (funcionalidade falsa) | Alto |
| 🔴 Crítico | Qualidade | Sem testes automatizados | Alto |
| 🟡 Alto | Manutenibilidade | NotebookView God Component (~400 linhas) | Médio |
| 🟡 Alto | Qualidade | Import default vs named export inconsistente | Médio |
| 🟡 Médio | Backend | Sem `lastReviewedAt` no Flashcard | Baixo |
| 🟡 Médio | UX | `console.error` sem toasts em hooks | Baixo |
| 🟡 Médio | UX | Skeleton exibido mesmo com cache | Baixo |
| 🟢 Baixo | Performance | setSaveStatus chamado a cada tecla | Muito Baixo |
| 🟢 Baixo | Config | Sem pre-commit hooks | Baixo |
| 🟢 Baixo | Config | Validação de env parcial | Baixo |

---

## Problemas resolvidos desde a última análise

| Problema | Data |
|----------|------|
| console.log do token JWT no client.ts | Sessão anterior |
| CORS com origin: true sem fallback | Sessão anterior |
| ESLint no-restricted-imports configurado ao contrário | Sessão anterior |
| Link "Esqueceu a senha?" quebrado | Sessão anterior |
| Brand name inconsistente (Flash vs AI) | Sessão anterior |
| Sem sistema de toasts/notificações | 08/07/2026 |
| Indicador de salvamento pouco visível | Sessão anterior |
| EditorView God Component (~550 linhas) | 08/07/2026 |
| Form aninhado no modal de criação | Sessão anterior (padrão HTML5 válido) |
| db.json.backup não utilizado | Sessão anterior |
| AnnotationSidebar DOMParser sem memo | Sessão anterior (hash comparison) |
| Sem `.env.example` (raiz e server) | 08/07/2026 |
| **Loop infinito 429 no auto-save** (editorStatus em deps) | 09/07/2026 |
| **EditHistoryController órfão** removido (service mantido — usado por NotebooksService) | 09/07/2026 |
| **`server/_express_backup/`** (legado Express, 64KB) | 09/07/2026 |
| **`src/modules/history/`** (historyService.ts órfão) | 09/07/2026 |
| **`console.warn` em usePlanningNotifications** (4 ocorrências) | 09/07/2026 |
| **`import { FieldErrors }` → `import type { FieldErrors }`** (Vite [MISSING_EXPORT]) | 09/07/2026 |
| **EditHistoryService restaurado** no trash.module.ts (quebrou NotebooksService) | 09/07/2026 |

---

*Documento atualizado em 09/07/2026 — Adicionados itens resolvidos na refatoração e testes.*
