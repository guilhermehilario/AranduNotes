# 🗺️ ROADMAP — Arandu

> **Propósito:** Consolidar o roadmap de versões do projeto Arandu — o mesmo conteúdo
> exibido na aba **"Sobre"** do modal de perfil (`AboutTab.tsx`), agora em formato
> completo e versionado na raiz do repositório.
>
> **Última atualização:** 31/07/2026

---

## 📍 Status Atual

| Versão | Nome | Status |
|--------|------|--------|
| **v1.0** | Fundação | ✅ **Atual** — em produção |
| **v1.5** | Colaboração | 💡 **Proposto** — próxima iteração |
| **v2.0** | Inteligência & Insights | 🔭 **Planejado** — visão de longo prazo |

---

## ✅ v1.0 — Fundação *(Atual)*

A versão atual do Arandu, disponível em produção, cobre o ciclo completo de
estudo individual: criar, organizar, revisar e acompanhar o progresso.

### O que já está implementado

- 📝 **Cadernos e folhas de anotação** com editor rich text (TipTap)
  - Toolbar multi-linha com pincel de formatação, blocos de código, listas de tarefas
  - Folhas hierárquicas com drag & drop e sub-folhas
  - Anotações coloridas, autosave com debounce e histórico de edições
- 🃏 **Flashcards com repetição espaçada (algoritmo SM-2)**
  - Criação manual e por IA
  - Histórico de revisões com timeline diária, médias e breakdown por matéria (Review Log)
- ❓ **Questões e simulados**
  - Questões de múltipla escolha, verdadeiro/falso e resposta curta
  - Simulados personalizáveis com limite de tempo
- 📅 **Planejamento de estudos**
  - Agenda, calendário, cronograma e metas
  - Pomodoro com timer flutuante e histórico
  - Resumo semanal no dashboard
- 🔐 **Autenticação e perfil**
  - JWT com refresh tokens, verificação de e-mail e recuperação de senha
  - Perfil, avatares personalizáveis (DiceBear) e preferências do sistema
  - Aba **"Sobre"** no perfil (descrição, versões, apoio coletivo e notas de atualização)
- 🧰 **Ferramentas de organização**
  - Tags, bookmarks, lista de tarefas e histórico de cópia/cola
  - Lixeira com soft-delete e restauração
- 📱 **Responsividade mobile completa**
  - Modais com `dvh` + `overscroll-contain` + grids empilhados
  - Menu combinado de notificações + clipboard no header mobile
- 🚀 **Infraestrutura**
  - Deploy da API no Fly.io (Docker multi-stage + Litestream) e frontend no Render
  - CI com lint obrigatório (0 warnings) no GitHub Actions
  - TypeScript `~5.9.3` unificado no monorepo

---

## 💡 v1.5 — Colaboração *(Proposto)*

A próxima iteração do Arandu foca em tornar o estudo **compartilhado e mais
inteligente**, conectando estudantes e aproveitando IA generativa.

### Funcionalidades propostas

- 🔗 **Compartilhamento de cadernos entre usuários**
  - Convites por e-mail, permissões de leitura/edição
  - Cadernos públicos vs. privados
- ⚡ **Sincronização em tempo real do editor**
  - Colaboração simultânea (presença, cursores compartilhados)
  - Resolução de conflitos e histórico de colaboradores
- 🤖 **IA generativa para resumos e questões (via API)**
  - Resumos automáticos aprimorados com modelos externos
  - Geração de questões contextualizadas por caderno/folha

### Critérios de priorização

1. Compartilhamento simples (somente leitura) antes de edição colaborativa
2. IA via API externa com fallback para o mock atual (sem custo de infra)
3. Preservar o modelo de dados atual (`Notebook`/`Leaf`) com migrações compatíveis

---

## 🔭 v2.0 — Inteligência & Insights *(Planejado)*

Visão de longo prazo: transformar o Arandu em um **assistente de estudo
inteligente**, com análise de dados avançada e presença em todas as plataformas.

### Funcionalidades planejadas

- 📊 **Dashboard avançado de desempenho**
  - Gráficos de evolução por matéria, previsão de revisão (SM-2)
  - Estimativa de tempo de estudo para metas
- 🧠 **Análise de lacunas de conhecimento**
  - Identificação automática de conteúdos fracos a partir do desempenho em
    flashcards, questões e simulados
  - Sugestões de revisão direcionadas
- 📱 **Aplicativos nativos (Android/iOS) e modo offline**
  - Sincronização offline-first com reconciliação ao reconectar
  - Notificações push para revisões e metas

---

## 🧭 Visão Geral

```
v1.0 (Atual) ───────► v1.5 (Proposto) ───────► v2.0 (Planejado)
  Fundação              Colaboração               Inteligência
  ✅ Produção            💡 Próxima iteração        🔭 Longo prazo
```

---

## 🤝 Como contribuir com o roadmap

1. **Abra uma issue** descrevendo a funcionalidade desejada e o valor que ela traz
2. **Discuta** a proposta na issue antes de implementar
3. **Mantenha o `AboutTab.tsx` sincronizado** — o conteúdo exibido no perfil
   (arrays `VERSIONS` e `RELEASE_NOTES`) deve refletir este arquivo
4. Acompanhe as **notas de atualização** na aba "Sobre" do perfil e no arquivo `CHANGELOG.md` (local, fora do versionamento)

> ⚠️ **Nota:** As versões v1.5 e v2.0 são **propostas** e podem mudar com base no
> feedback dos usuários e nas prioridades de desenvolvimento. Datas ainda não definidas.

---

## 📚 Documentação relacionada

- [`README.md`](./README.md) — visão geral do projeto e guia de uso
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — guia de contribuição
