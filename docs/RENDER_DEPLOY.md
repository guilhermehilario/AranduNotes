# 🚀 Guia de Deploy no Render — Arandu

Este guia explica como fazer o deploy do **Arandu** (monorepo com API NestJS + Frontend React)
na plataforma [Render.com](https://render.com) utilizando a funcionalidade **Blueprint**.

---

## 📋 Pré-requisitos

- Uma conta no [Render.com](https://render.com) (plano **Free** é suficiente)
- Repositório Git hospedado no **GitHub**, **GitLab** ou **Bitbucket**
- Acesso para conectar o repositório ao Render

---

## 1️⃣ Variáveis de Ambiente

Antes do primeiro deploy, prepare os valores das variáveis de ambiente.

### API (`arandu-api`)

| Variável | Descrição | Obrigatória | Como obter |
|---|---|---|---|
| `DATABASE_URL` | URL de conexão com o banco de dados (Turso/LibSQL) | ✅ Sim | Criar uma conta no [Turso](https://turso.tech) e criar um banco remoto, ou usar SQLite apenas localmente |
| `JWT_SECRET` | Chave secreta para assinar tokens JWT | ✅ Sim | O próprio Render pode **gerar automaticamente** (`generateValue: true`) |
| `NODE_ENV` | Ambiente de execução | ✅ Sim | Definir como `production` |
| `FRONTEND_URL` | URL do frontend para liberar CORS | ✅ Sim | Ex: `https://arandu-frontend.onrender.com` |
| `PORT` | Porta que o servidor irá escutar | ❌ Opcional | Padrão: `10000` (definida automaticamente pelo Render) |

**Para o Turso (banco de dados remoto recomendado):**

> ⚠️ O Arandu usa **SQLite localmente** para desenvolvimento e **Turso/LibSQL** em produção.
> O Turso é uma plataforma de banco de dados SQLite distribuída com plano gratuito generoso.

1. Crie uma conta em [turso.tech](https://turso.tech)
2. Instale a CLI do Turso e faça login:
   ```bash
   npm install -g turso
   turso auth login
   ```
3. Crie um banco de dados:
   ```bash
   turso db create arandu-prod
   ```
4. Obtenha a URL de conexão:
   ```bash
   turso db show arandu-prod --url
   # Exemplo: libsql://arandu-prod-username.turso.io
   ```
5. Gere um token de acesso:
   ```bash
   turso db tokens create arandu-prod
   ```
6. Defina a `DATABASE_URL` no Render como:
   ```
   libsql://arandu-prod-username.turso.io?authToken=SEU_TOKEN_AQUI
   ```

> **Alternativa mais simples:** Para testes rápidos, é possível usar um banco SQLite em disco no Render,
> mas **os dados serão perdidos** a cada novo deploy (ephemeral filesystem).
> Não recomendado para produção.

### Frontend (`arandu-frontend`)

| Variável | Descrição | Obrigatória | Valor esperado |
|---|---|---|---|
| `VITE_API_URL` | URL base da API (com prefixo `/api`) | ✅ Sim | `https://arandu-api.onrender.com/api` |

---

## 2️⃣ Primeiro Deploy via Blueprint

O Render **Blueprint** lê o arquivo `render.yaml` na raiz do repositório e cria
automaticamente todos os serviços necessários.

### Passo a passo

1. **Acesse o Dashboard do Render:** [dashboard.render.com](https://dashboard.render.com)

2. **Clique em "New +" → "Blueprint"**

   ![New Blueprint](https://render.com/docs/static/blueprint-new.png)

3. **Conecte seu repositório Git**
   - Escolha GitHub, GitLab ou Bitbucket
   - Autorize o Render a acessar seus repositórios
   - Selecione o repositório `arandu-monorepo`

4. **Revise os serviços**
   - O Render detectará automaticamente os 2 serviços definidos no `render.yaml`
   - Você verá:
     - `arandu-api` — Web Service (Node.js)
     - `arandu-frontend` — Static Site

5. **Configure as variáveis de ambiente**
   - Para cada variável com `sync: false` (como `DATABASE_URL`), o Render pedirá
     que você forneça o valor manualmente
   - Preencha com os valores preparados no passo anterior

6. **Clique em "Apply"**
   - O Render iniciará o build e deploy de ambos os serviços em paralelo
   - O progresso pode ser acompanhado em tempo real no dashboard

7. **Aguarde a finalização** (cerca de 5-10 minutos no primeiro deploy)
   - API: `https://arandu-api.onrender.com`
   - Frontend: `https://arandu-frontend.onrender.com`

---

## 3️⃣ Rodando Migrations do Prisma

Após o primeiro deploy da API, é necessário criar as tabelas no banco de dados.

### Opção A: Via Render Shell (Recomendado)

1. No dashboard do Render, vá até o serviço `arandu-api`
2. Clique em **"Shell"** (terminal remoto)
3. Execute:
   ```bash
   # Usando yarn workspace (funciona da raiz do repositório)
   yarn workspace api prisma migrate deploy
   ```
   Ou, se preferir usar o schema atual sem migrations versionadas:
   ```bash
   yarn workspace api prisma db push
   ```

> 💡 **Dica:** O `prisma.config.ts` está dentro de `apps/api/`. Se preferir
> usar `npx` diretamente, navegue até a pasta da API primeiro:
> ```bash
> cd apps/api && npx prisma migrate deploy
> ```

### Opção B: Via Comando pós-deploy no `render.yaml`

Você pode adicionar um script de pós-deploy editando o `render.yaml`:

```yaml
  - type: web
    name: arandu-api
    # ... demais configurações ...
    postDeployCommand: npx prisma migrate deploy
```

> **Nota:** O comando `postDeploy` executa **após** o build e antes do serviço
> começar a receber tráfego. Isso garante que as migrations rodem antes do
> servidor iniciar.

### Verificação

Para confirmar que as migrations funcionaram:

```bash
curl https://arandu-api.onrender.com/health
# Resposta esperada: { "status": "healthy", "timestamp": "..." }
```

---

## 4️⃣ Build Filters (Otimização)

Os **build filters** evitam deploys desnecessários, salvando tempo e recursos.

### Como funciona

O `render.yaml` já inclui filtros por serviço:

```yaml
# API — só faz build quando a API é alterada
filters:
  - paths:
      - apps/api/**
      - package.json
      - yarn.lock
      - turbo.json

# Frontend — só faz build quando o frontend é alterado
filters:
  - paths:
      - apps/frontend/**
      - package.json
      - yarn.lock
      - turbo.json
```

### O que isso significa na prática

| Cenário | Build da API | Build do Frontend |
|---|---|---|
| Commit altera `apps/api/src/...` | ✅ Executa | ❌ Ignora |
| Commit altera `apps/frontend/src/...` | ❌ Ignora | ✅ Executa |
| Commit altera `package.json` | ✅ Executa | ✅ Executa |
| Commit altera ambos | ✅ Executa | ✅ Executa |

### Verificando no Dashboard

No painel de cada serviço, a aba **"Events"** mostra se o build foi ignorado ou executado:

```
Event: Deploy
Status: Skipped (no relevant changes)
```

---

## 5️⃣ Variáveis de Ambiente Sensíveis

### `JWT_SECRET`

O `render.yaml` usa `generateValue: true` para que o Render crie automaticamente
um valor seguro. Se precisar de um específico:

```bash
# Gere um segredo forte
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### `DATABASE_URL`

⚠️ **Não comite a DATABASE_URL no repositório.** Ela deve ser configurada
manualmente no painel do Render (marcada como `sync: false` no blueprint).

---

## 6️⃣ Troubleshooting

### ❌ Erro: "PrismaClientInitializationError"

**Causa:** A `DATABASE_URL` está incorreta ou o banco não foi criado.

**Solução:**
1. Verifique a URL de conexão no painel do Render
2. Certifique-se de que o banco no Turso existe e o token é válido
3. No shell do Render, teste a conexão:
   ```bash
   # Usando yarn workspace
   yarn workspace api prisma db push --accept-data-loss

   # Ou navegando até a pasta
   cd apps/api && npx prisma db push --accept-data-loss
   ```

### ❌ Erro: "CORS bloqueou a requisição"

**Causa:** A variável `FRONTEND_URL` não corresponde à URL real do frontend.

**Solução:**
1. No painel do Render → `arandu-api` → Environment
2. Confirme que `FRONTEND_URL` é exatamente `https://arandu-frontend.onrender.com`
   (sem barra no final)

### ❌ Erro: "Cannot find module" no start

**Causa:** O build não gerou a pasta `dist/` corretamente.

**Solução:**
1. Verifique os logs de build no dashboard
2. Tente rodar localmente: `yarn install && npx turbo run build --filter=api`
3. Confirme que `apps/api/dist/main.js` foi criado

### ❌ Erro: "Refresh token inválido"

**Causa:** O frontend não consegue renovar o token JWT porque o cookie não está
sendo enviado.

**Solução:**
1. Confirme que o axios usa `withCredentials: true` (já configurado)
2. Verifique os domínios de CORS — API e frontend precisam estar no mesmo
   domínio pai, ou configurar cookies cross-site com `SameSite=None; Secure`
3. Para desenvolvimento, use o proxy do Vite (veja `vite.config.ts`)

---

## 7️⃣ Deploys Automáticos

Por padrão, o Render faz auto-deploy a cada push no branch conectado.

### Branchs recomendados

- `main` — produção (deploy automático)
- `develop` — staging (adicione como serviço separado no render.yaml)

### Deploy manual

No dashboard de cada serviço → **Manual Deploy** → **Deploy latest commit**

---

## 📚 Referências

- [Documentação oficial do Render Blueprint](https://render.com/docs/blueprint-spec)
- [Render Web Services](https://render.com/docs/web-services)
- [Render Static Sites](https://render.com/docs/static-sites)
- [Render Environment Variables](https://render.com/docs/environment-variables)
- [Render Build Filters](https://render.com/docs/blueprint-spec#filters)
- [Turso (banco SQLite distribuído)](https://turso.tech)
- [Prisma Deploy](https://www.prisma.io/docs/orm/prisma-migrate/deploying-migrations)
