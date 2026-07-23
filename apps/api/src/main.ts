import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  // ════════════════════════════════════════════════════════════════
  //  VALIDAÇÃO DE VARIÁVEIS DE AMBIENTE (antes de criar a app)
  //  Fail-fast: se faltar secrets em produção, o servidor não sobe.
  // ════════════════════════════════════════════════════════════════
  const nodeEnv = process.env.NODE_ENV || 'development';
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!process.env.JWT_SECRET) {
    if (nodeEnv === 'production') {
      errors.push(
        'JWT_SECRET é obrigatório em produção. ' +
        'Gere uma chave forte com: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
      );
    } else {
      warnings.push(
        'JWT_SECRET não definido. Usando fallback \'dev-jwt-secret\' ' +
        '(apenas para desenvolvimento local).',
      );
    }
  }

  if (!process.env.REFRESH_SECRET) {
    if (nodeEnv === 'production') {
      errors.push(
        'REFRESH_SECRET é obrigatório em produção. ' +
        'Gere uma chave forte com: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
      );
    } else {
      warnings.push(
        'REFRESH_SECRET não definido. Usando fallback \'dev-refresh-secret\' ' +
        '(apenas para desenvolvimento local).',
      );
    }
  }

  if (nodeEnv === 'production' && !process.env.FRONTEND_URL) {
    errors.push(
      'FRONTEND_URL é obrigatória em produção. ' +
      'Defina a variável de ambiente FRONTEND_URL com a(s) URL(s) do frontend ' +
      '(ex: https://meuapp.com ou https://app1.com,https://app2.com).',
    );
  }

  if (warnings.length > 0) {
    console.warn('\n⚠️  AVISOS DE CONFIGURAÇÃO:');
    warnings.forEach((w) => console.warn(`  • ${w}`));
    console.warn('');
  }

  if (errors.length > 0) {
    console.error('\n❌ ERROS DE CONFIGURAÇÃO — servidor não pode iniciar:');
    errors.forEach((e) => console.error(`  • ${e}`));
    console.error('');
    throw new Error(
      `Configuração inválida: ${errors.length} erro(s) encontrado(s). ` +
      'Corrija as variáveis de ambiente acima e reinicie o servidor.',
    );
  }

  const app = await NestFactory.create(AppModule);

  // ── Global API prefix ──
  app.setGlobalPrefix('api');

  // ── Security Headers (Helmet) ──
  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // ── CORS ──

  // Origens permitidas: FRONTEND_URL pode ser uma lista separada por vírgulas
  const rawOrigins = process.env.FRONTEND_URL || 'http://localhost:5173';
  const allowedOrigins = rawOrigins
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Permitir requisições sem origin (como chamadas server-to-server ou Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Origem bloqueada: ${origin}`);
        callback(new Error(`Origem ${origin} não permitida pelo CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ── Cookie Parser ──
  app.use(cookieParser());

  // ── Middleware de cold start / warm up ──
  // Loga quanto tempo levou para o servidor ficar pronto
  const startupStart = Date.now();

  // ── Middleware global: adiciona header de tempo de startup e saúde do DB ──
  app.use((req: any, res: any, next: () => void) => {
    // Adiciona header indicando que o servidor está pronto
    res.setHeader('X-Instance-Status', 'ready');
    next();
  });

  // ── Request Logger ──
  // Em produção, loga apenas warnings/errors e tempo de resposta lento
  app.use((req: any, res: any, next: () => void) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const shouldLog =
        nodeEnv !== 'production' || // Sempre loga em dev
        res.statusCode >= 400 || // Loga erros
        duration > 3000; // Loga requisições lentas (+3s)

      if (shouldLog) {
        console.log(
          `[${new Date().toISOString()}] ${req.method} ${req.path} → ${res.statusCode} (${duration}ms)`,
        );
      }
    });
    next();
  });

  const PORT = process.env.PORT || 3000;
  const HOST = '0.0.0.0';

  await app.listen(PORT, HOST, () => {
    const startupTime = Date.now() - startupStart;
    const divider = '='.repeat(45);
    console.log(divider);
    console.log(`  Servidor NestJS rodando em: http://${HOST}:${PORT}`);
    console.log(`  Base da API: http://${HOST}:${PORT}/api`);
    console.log(`  Frontends permitidos: ${allowedOrigins.join(', ')}`);
    console.log(`  Ambiente: ${nodeEnv}`);
    console.log(`  Tempo de inicialização: ${startupTime}ms`);
    console.log(divider);
  });
}

bootstrap().catch((err) => {
  console.error('❌ Falha ao iniciar o servidor:', err);
  process.exit(1);
});
