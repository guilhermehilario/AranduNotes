# 📋 Próximas Tarefas — Revisa Aula

> Prioridades definidas com base no impacto e esforço estimado.

---

## 🔴 Crítico (Prioridade Máxima)

### 1. Integrar IA real (OpenAI / Anthropic)
- **Arquivo:** `server/src/leaves/utils/ai-mock.service.ts`
- **Descrição:** Substituir o mock de IA por API real. Usar Gravity Index para escolher o provider.
- **Por quê:** O core diferencial do app não funciona (resumos e flashcards são templates fixos).
- **Esforço:** Alto

### 2. Implementar testes automatizados
- **Alvos prioritários:** Algoritmo SM-2 (`flashcards.service.ts`), hooks do planning, cálculo de stats (`study.service.ts`)
- **Por quê:** Novas funcionalidades de planejamento aumentaram a superfície de possíveis bugs.
- **Esforço:** Alto

### 3. Validar `FRONTEND_URL` em produção
- **Arquivo:** `server/src/main.ts`
- **Descrição:** Sem `FRONTEND_URL` configurada em produção, o CORS bloqueia tudo.
- **Esforço:** Baixo

---

## 🟡 Alta Prioridade

### 4. Refatorar NotebookView (restante)
- **Descrição:** Modal de criação manual de flashcard ainda inline. Lógica de CRUD de folhas/flashcards ainda no componente.
- **Status:** Parcial — modais de criação de folha e edição de caderno extraídos (~385 → ~210 linhas).
- **Próximo passo:** Extrair o modal de flashcard e considerar hooks para lógica de listagem.
- **Esforço:** Baixo (restante)

### 5. Aplicar cor de destaque do Planning na UI
- **Arquivo:** `src/store/planningSettingsStore.ts`, componentes do planning
- **Descrição:** `accentColor` é salvo nas settings mas não é aplicado visualmente nos componentes.
- **Solução:** Usar `accentColor` para classes dinâmicas nos ícones e botões do planning.
- **Esforço:** Médio

### 6. Corrigir ESLint configurado incorretamente
- **Arquivo:** `eslint.config.js`
- **Descrição:** Regra `no-restricted-imports` ao contrário.
- **Esforço:** Baixo

### 7. Adicionar toasts de sucesso nas operações
- **Descrição:** Hoje só temos toasts de erro. Adicionar feedback positivo: "Caderno criado", "Meta atualizada", etc.
- **Esforço:** Médio

### 8. Remover `studiesService.ts` (frontend) — código morto
- **Arquivo:** `src/modules/study/services/studiesService.ts`
- **Descrição:** Após a mesclagem com `studyService`, nenhum arquivo frontend importa mais `studiesService`. O arquivo pode ser removido.
- **Esforço:** Muito Baixo

---

## 🟡 Média Prioridade

### 9. Unificar named exports (remover export default)
- **Esforço:** Baixo

### 10. Extrair classes Tailwind massivas para CSS
- **Arquivo:** `EditorView.tsx`
- **Esforço:** Médio

### 11. Skeleton exibido mesmo com cache
- **Arquivo:** `EditorView.tsx`
- **Solução:** Usar `isFetching` + `isStale`.
- **Esforço:** Baixo

### 12. Adicionar notificações push (Service Worker)
- **Descrição:** Notificações mesmo com o app fechado, usando Web Push API.
- **Esforço:** Alto

---

## 🟢 Baixa Prioridade

### 13. Criar `.env.example`
- **Esforço:** Baixo

### 14. Configurar Husky + lint-staged
- **Esforço:** Baixo

### 15. Validação de env no startup do backend
- **Esforço:** Baixo

### 16. Atalhos de teclado para o Pomodoro
- **Descrição:** Espaço para pausar/continuar, Esc para parar.
- **Esforço:** Baixo

### 17. Gráfico semanal de pomodoros no Dashboard
- **Descrição:** Mini gráfico de barras por dia da semana no card de Pomodoro do resumo semanal.
- **Esforço:** Médio

---

## ✅ Concluído na Sessão 09/07/2026 (Refatoração)

- [x] **Loop 429 no auto-save corrigido** — `editorStatus` removido das deps; uso de `getState()`
- [x] **EditHistoryController removido** do `trash.module.ts` (controller órfão; service mantido)
- [x] **EditHistoryService restaurado** — quebrou `NotebooksService` ao ser removido
- [x] **`server/_express_backup/` deletado** (legado Express, 9 arquivos, 64KB)
- [x] **`studiesService` mesclado em `studyService`** — `getContent()` e `getDashboardStats()` unificados
- [x] **`console.warn` removido** do `usePlanningNotifications.ts` (4 ocorrências)
- [x] **`src/modules/history/` deletado** (historyService.ts órfão)
- [x] **Modais do NotebookView extraídos** — `CreateLeafModal.tsx` + `EditNotebookModal.tsx`
- [x] **`FieldErrors` import corrigido** — `import type` em vez de `import` (Vite [MISSING_EXPORT])
- [x] **Bateria completa de testes** — 15 endpoints, typecheck frontend/backend, build Vite
- [x] **Guia de padronização criado** — `PADROES.md`
- [x] **Documentação atualizada** — AGENTS.md, README.md, ANALISE_PROBLEMAS.md, TASKS.md

---

## ✅ Concluído na Sessão 08/07/2026 (Planejamento)

- [x] Módulo de Planejamento (Agenda, Calendário, Cronograma, Metas, Pomodoro) com CRUD via API
- [x] Sidebar com sub-menu expansível para Planejamento
- [x] Mini timer flutuante do Pomodoro (canto inferior direito, visível em todas as páginas)
- [x] Sistema de notificações (navegador + in-app) para eventos, metas e pomodoro
- [x] Configurações do Planejamento (cores, durações, toggles de notificação)
- [x] Resumo semanal no Dashboard
- [x] Documentação da sessão

---

## 📊 Resumo

| Prioridade | Qtd | Principais |
|------------|-----|------------|
| 🔴 Crítico | 2 | IA real, testes automatizados |
| 🟡 Alta | 5 | NotebookView (restante), cor destaque, ESLint, toasts sucesso, remover studiesService morto |
| 🟡 Média | 4 | named exports, Tailwind CSS, skeleton, push notifications |
| 🟢 Baixa | 5 | env.example, Husky, validação env, atalhos teclado, gráfico |

---

*Gerado em 09/07/2026 — Sessão de refatoração de código morto e extração de componentes.*
