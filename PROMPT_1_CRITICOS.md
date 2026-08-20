# PROMPT 1 — CORREÇÕES CRÍTICAS + PREPARAÇÃO ESTRUTURAL

**Objetivo:** Corrigir as 5 vulnerabilidades CRÍTICAS e preparar infraestrutura compartilhada necessária para os prompts 2 e 3.

**Branch de trabalho:** `development` (SQLite local) para implementação, com cherry-pick posterior para `main` e `homologacao` quando aplicável.

---

## 1. CONTEXTO

### 1.1 Arquitetura do Projeto

- **Monorepo** com Yarn workspaces + Turborepo
- **API:** NestJS + Prisma ORM + SQLite (dev) / PostgreSQL (prod via Supabase)
- **Frontend:** React + Vite + TypeScript
- **Deploy:** Fly.io (API) + Render (Frontend)
- **Auth:** JWT (access token 24h em memória + refresh token httpOnly cookie com rotação)
- **Branches:** `main` (produção/Supabase), `development` (SQLite local), `homologacao` (Supabase staging)

### 1.2 Regras Fundamentais

1. O agente NÃO deve assumir que qualquer item é vulnerabilidade apenas porque foi listado
2. Antes de corrigir: localizar, analisar contexto, confirmar existência, identificar impacto, verificar mitigações existentes
3. Toda conclusão deve estar baseada no código real do projeto
4. NUNCA inventar arquivos, endpoints, tabelas, campos ou resultados de teste
5. Preservar funcionalidades existentes — não quebrar APIs, contratos ou fluxos
6. Reforçar ownership: apenas o proprietário acessa seu conteúdo

### 1.3 Ferramentas Disponíveis

- Prisma CLI (`yarn prisma generate`, `yarn prisma db push`, `yarn prisma migrate dev`)
- Node.js crypto module (já disponível)
- class-validator / class-transformer (já instalados)
- Jest (verificar configuração existente)

---

## 2. VULNERABILIDADES A CORRIGIR

### CRIT-1: Tokens de reset de senha e verificação de email em plaintext

**Investigar:**
```
apps/api/src/auth/password.service.ts
apps/api/src/auth/verification.service.ts
apps/api/src/auth/auth-core.service.ts
apps/api/prisma/schema.prisma
```

**Fluxo atual a mapear por completo:**
1. Geração do token (onde, como, que tipo — UUID v4?)
2. Armazenamento no banco (campo, tipo, constraints)
3. Envio por email (link completo, query param)
4. Recebimento pelo usuário (endpoint, extração do token)
5. Validação no banco (query Prisma, comparação)
6. Uso do token (reset ou verificação)
7. Invalidação após uso
8. Expiração (TTL implementado como?)

**Regras de implementação:**
- Hashear tokens com SHA-256 antes de armazenar (mesmo padrão dos refresh tokens)
- O campo no banco armazena o HASH, não o token bruto
- Na validação: hash do token recebido → comparação com hash armazenado
- NÃO usar o hash como link — o link continua usando o token bruto
- Gerar tokens com `crypto.randomBytes(32).toString('hex')` em vez de UUID
- Tokens antigos no banco: não migrar (aceitar que usuários com tokens pendentes precisam gerar novo)
- Verificar se o Prisma schema precisa de alteração (campo pode ter tamanho diferente)
- Verificar se há migration pendente necessária

**Critérios de aceite:**
- [ ] Token gerado via crypto.randomBytes, não UUID
- [ ] Token hasheado com SHA-256 antes de salvar no banco
- [ ] Validação compara hash do token recebido com hash armazenado
- [ ] Tokens de reset e verificação ambos implementados
- [ ] Token antigo no banco (UUID) não causa erro — fallback ou rejeição graciosa
- [ ] Teste: token válido funciona normalmente
- [ ] Teste: token adulterado é rejeitado
- [ ] Teste: token expirado é rejeitado
- [ ] Teste: token já usado é rejeitado

---

### CRIT-2: Reset de senha não invalida sessões existentes

**Investigar:**
```
apps/api/src/auth/password.service.ts
apps/api/src/auth/auth-core.service.ts
apps/api/src/auth/auth.controller.ts
```

**Fluxos a mapear:**
1. `changePassword` — usuário autenticado muda a senha
2. `resetPassword` — usuário com token de email reseta a senha
3. Verificar se `refreshToken` model tem campo `revokedAt`
4. Verificar se já existe lógica de revogação em outro lugar (delete-account?)

**Regras de implementação:**
- Após sucesso em `changePassword`: revogar TODOS os refresh tokens do usuário
- Após sucesso em `resetPassword`: revogar TODOS os refresh tokens do usuário
- A revogação deve ser ativa (setar `revokedAt = new Date()`), não delete
- O access token atual (em memória no frontend) continua válido até expirar — isso é aceitável
- NÃO revogar tokens de OUTROS usuários
- NÃO afetar tokens de usuários excluídos

**Critérios de aceite:**
- [ ] Após changePassword, refresh tokens antigos retornam 401 no refresh endpoint
- [ ] Após resetPassword, refresh tokens antigos retornam 401 no refresh endpoint
- [ ] Novo login após password change funciona normalmente
- [ ] Multi-dispositivo: dispositivo B perde acesso após dispositivo A mudar a senha
- [ ] Teste: refresh token A → changePassword → refresh token A → 401
- [ ] Teste: refresh token A → changePassword → novo login → novo refresh token funciona

---

### CRIT-3: TLS desabilitado na migração Supabase

**Investigar:**
```
apps/api/scripts/migrate-supabase.js
```

**Verificar:**
- Se o script ainda existe e é usado
- Se há referência a ele em CI/CD ou package.json
- Se o `rejectUnauthorized: false` é realmente perigoso ou é mitigado por outro mecanismo
- Se o Supabase connection string já inclui SSL config

**Regras de implementação:**
- NÃO simplesmente remover `rejectUnauthorized: false` sem substituir
- Usar o CA certificate do Supabase (disponível no dashboard)
- OU usar `sslmode=verify-full` na connection string se o driver suportar
- Se o script é apenas para dev/migration local e NUNCA roda em produção com dados reais, documentar como falso positivo
- Verificar se o `pg` driver do Node.js suporta `sslmode` na connection string

**Critérios de aceite:**
- [ ] Script de migração NÃO usa `rejectUnauthorized: false`
- [ ] Conexão TLS com Supabase é verificada corretamente
- [ ] OU: documentação de que o script é apenas para dev e não constitui vulnerabilidade real

---

### CRIT-4: Exclusão de conta não remove dados PII

**Investigar:**
```
apps/api/src/auth/delete-account.service.ts
apps/api/prisma/schema.prisma
```

**Mapear grafo completo de dados do usuário:**
1. User → notebooks (FK: userId)
2. Notebook → leaves (FK: notebookId)
3. Leaf → flashcards (FK: leafId)
4. Leaf → tags (relação many-to-many)
5. Leaf → edit_history (FK: leafId)
6. User → refresh_tokens (FK: userId)
7. User → review_logs (FK: userId)
8. User → study_sessions (FK: userId)
9. User → bookmarks (FK: userId)
10. User → events (FK: userId)
11. User → goals (FK: userId)
12. User → pomodoro (FK: userId)
13. User → todos (FK: userId)
14. User → mock_exams (FK: userId)
15. User → questions (FK: userId)
16. Campos: resetPasswordToken, verificationToken, verificationExpires

**Regras de implementação:**
- Opção recomendada: **anonimização + soft delete com purge agendado**
  - Manter `deletedAt` como soft delete
  - Anonimizar dados PII (name → "Usuário excluído", email → hash + "@deleted.local")
  - Manter dados de conteúdo (notebooks, leaves) por 30 dias para possível reversão
  - Criar service/cron que purge permanentemente após 30 dias
- Opção alternativa: **hard delete com cascade**
  - Mais simples mas irrecuperável
  - Prisma não suporta cascade delete nativo — usar `$transaction` com deletes manuais
- NÃO remover dados sem Ownership check — usuário só deleta seus próprios dados
- Corrigir a mensagem "Conta excluída permanentemente" para refletir o comportamento real

**Critérios de aceite:**
- [ ] Todos os dados PII são anonimizados ou removidos na exclusão
- [ ] Mensagem ao usuário reflete o comportamento real
- [ ] Dados de conteúdo mantidos conforme política (se soft delete)
- [ ] Usuário A não consegue acessar dados do usuário B após exclusão de B
- [ ] Refresh tokens do usuário excluído são revogados
- [ ] Teste: user delete → login com credenciais antigas → 401
- [ ] Teste: user delete → acessar dados via API → 404/403

---

### CRIT-5: Math.random() para código de confirmação de exclusão

**Investigar:**
```
apps/api/src/auth/delete-account.service.ts
apps/api/src/auth/auth.controller.ts
```

**Verificar:**
- Endpoint de confirmação (confirm-deletion)
- Rate limiting existente no endpoint
- TTL do token JWT de confirmação
- Se o código é verificado server-side ou client-side
- Se o código está sujeito a brute force (número de tentativas, lockout)

**Regras de implementação:**
- Substituir `Math.floor(100000 + Math.random() * 900000)` por `crypto.randomInt(100000, 1000000)`
- Adicionar rate limit no endpoint `confirm-deletion` (máx 5 tentativas por 15 minutos)
- Invalidar código após uso bem-sucedido
- Invalidar código quando novo código é solicitado
- Usar comparação constant-time para verificar o código
- NÃO retornar o código no response (apenas enviar por email)

**Critérios de aceite:**
- [ ] Código gerado via crypto.randomInt
- [ ] Rate limit no endpoint de confirmação (5 tentativas / 15min)
- [ ] Código invalidado após uso
- [ ] Código invalidado quando novo é solicitado
- [ ] Comparação é constant-time
- [ ] Brute force de 6 dígitos é inviável dentro do TTL
- [ ] Teste: código correto → sucesso
- [ ] Teste: código incorreto → erro
- [ ] Teste: 6 códigos incorretos → rate limited
- [ ] Teste: código já usado → erro
- [ ] Teste: novo código invalida o anterior

---

## 3. PREPARAÇÃO ESTRUTURAL (não implementar achados ALTO/MÉDIO)

Durante a execução dos CRÍTICOS, o agente deve preparar:

### 3.1 Infraestrutura de hashing
- Criar utility compartilhada para SHA-256 de tokens (se não existir)
- Localizar: `apps/api/src/auth/auth.utils.ts` ou criar novo arquivo `apps/api/src/common/utils/token-hash.ts`
- Esta utility será usada pelo PROMPT 2 e PROMPT 3

### 3.2 Infraestrutura de rate limiting
- Verificar configuração atual do ThrottlerModule
- Identificar se é necessário criar throttle decorators customizados
- Preparar estrutura para rate limits por endpoint (PROMPT 2 usará)

### 3.3 Infraestrutura de testes
- Verificar se há configuração Jest funcional
- Se não houver: configurar Jest para o projeto NestJS
- Criar pelo menos 1 teste de smoke para confirmar que testes funcionam
- Localizar: `apps/api/test/`, `apps/api/jest.config.*`, `apps/api/package.json` (scripts de teste)

---

## 4. REGRAS DE SEGURANÇA

- Nunca expor tokens em logs ou responses
- Nunca logar senhas, hashes de senhas ou PII em DEBUG
- Usar crypto module do Node.js para operações criptográficas
- Verificar que Prisma client é regenerado após alterações no schema
- Manter compatibilidade com SQLite (dev) e PostgreSQL (prod)
- Não quebrar o fluxo de auth existente (register → login → refresh → logout)

---

## 5. REGRAS DE TESTES

Para cada CRÍTICO corrigido:

1. Criar ou atualizar testes unitários
2. Se houver testes de integração/e2e existentes, executá-los
3. Testes de autorização:
   - Usuário autenticado → próprio conteúdo = permitido
   - Usuário autenticado → conteúdo de outro = 403
   - Usuário não autenticado → conteúdo privado = 401
   - Usuário excluído → qualquer acesso = 401
4. Testes de regressão:
   - Register funciona
   - Login funciona
   - Refresh funciona
   - Logout funciona
   - Password change funciona
   - Password reset funciona
5. Executar lint e typecheck após cada alteração

---

## 6. CHECKLIST PRÉ-EXECUÇÃO

```bash
# Verificar branch e estado
git status
git branch

# Verificar se API inicia
yarn workspace api dev  # (interromper após confirmar startup)

# Verificar testes existentes
yarn workspace api test  # ou npm test

# Verificar lint
yarn workspace api lint
```

---

## 7. RELATÓRIO DE SAÍDA

Ao final deste prompt, gerar relatório contendo:

### Arquivos Alterados
Lista de cada arquivo modificado com descrição da mudança.

### Vulnerabilidades Corrigidas
Para cada CRÍTICO:
- ID (CRIT-1 a CRIT-5)
- Status: CORRIGIDO / FALSO_POSITIVO / NÃO_REPRODUZÍVEL / ADIADO
- Evidência: código antes/depois ou justificativa
- Teste executado e resultado

### Vulnerabilidades Não Corrigidas
Se alguma não pôde ser corrigida, justificar.

### Dependências Identificadas
Que infraestrutura foi preparada para PROMPT 2 e PROMPT 3.

### Testes
| Teste | Resultado |
|-------|-----------|
| Lint | PASS/FAIL |
| Typecheck | PASS/FAIL |
| Unit tests | PASS/FAIL |
| Build | PASS/FAIL |

### Riscos Restantes
Lista de riscos que persistem após as correções.

### Decisões Técnicas
Decisões que tomou e por quê.

---

## 8. O QUE NÃO DEVE SER ALTERADO NESTE PROMPT

- `apps/frontend/` (exceto se CRÍTICO exigir mudança no frontend)
- Achados ALTO, MÉDIO, BAIXO (exceto dependências diretas)
- Arquitetura de deploy (fly.toml, render.yaml)
- Estrutura de pastas do projeto
- Bibliotecas principais (NestJS, Prisma, React)
- Configuração de branches
- Schema do banco além do necessário para CRIT-1 e CRIT-4
- Endpoints existentes (pode adicionar novos, não modificar existentes sem necessidade)
