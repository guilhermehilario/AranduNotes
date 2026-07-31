import React from 'react';
import {
  Info,
  Rocket,
  HeartHandshake,
  Sparkles,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface SectionCardProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({
  icon,
  title,
  description,
  children,
}) => (
  <div
    className="rounded-2xl p-4 sm:p-5"
    style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-color)',
    }}
  >
    <div className="flex items-start gap-3 mb-3">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--bg-surface-hover)', color: 'var(--primary)' }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <h4 className="text-sm font-heading font-bold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h4>
        {description && (
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {description}
          </p>
        )}
      </div>
    </div>
    {children}
  </div>
);

const VERSIONS: Array<{ tag: string; name: string; status: string; items: string[] }> = [
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

const RELEASE_NOTES: Array<{ version: string; date: string; highlights: string[] }> = [
  {
    version: 'Julho 2026',
    date: 'Atualização mais recente',
    highlights: [
      'Responsividade mobile completa: modais, perfil, configurações e abas',
      'Menu combinado de notificações + histórico de cópia no mobile',
      'Dropdown de histórico de cópia acessível no celular',
      'CI com lint obrigatório (0 warnings) no GitHub Actions',
      'Melhorias de desempenho e tipagem em todo o monorepo',
    ],
  },
  {
    version: 'Junho 2026',
    date: 'Planejamento & Estudos',
    highlights: [
      'Módulo de planejamento com agenda, calendário, metas e pomodoro',
      'Registro de revisões e histórico de estudos (Review Log)',
      'Flyout de planejamento no menu lateral para mobile',
      'Estilização avançada do editor (links, listas e tooltips)',
    ],
  },
  {
    version: 'Maio 2026',
    date: 'Fundação',
    highlights: [
      'Lançamento do Arandu — plataforma de estudos inteligente',
      'Cadernos, folhas, tags, favoritos e lixeira',
      'Flashcards, questões, simulados e modo de estudo',
      'Autenticação com e-mail, verificação e recuperação de senha',
    ],
  },
];

export const AboutTab: React.FC = () => {
  return (
    <div className="flex flex-col gap-5 sm:gap-7 max-h-[calc(100dvh-12rem)] overflow-y-auto overscroll-contain pr-1.5 tab-enter">
      {/* Projeto */}
      <SectionCard
        icon={<Info className="h-4.5 w-4.5" />}
        title="Sobre o Arandu"
        description="Sua plataforma de estudos inteligente"
      >
        <div className="space-y-3">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            O <strong>Arandu</strong> é uma plataforma completa de estudos criada para
            ajudar você a organizar, revisar e dominar qualquer conteúdo — do vestibular
            à faculdade, de provas a concursos.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Reúna anotações, flashcards, questões e simulados em um só lugar, planeje sua
            rotina com agenda, cronograma e pomodoro, e acompanhe seu progresso com
            estatísticas e repetição espaçada (SM-2).
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {['Código aberto', 'Gratuito para estudantes', 'Seus dados, seu controle'].map(
              (badge) => (
                <span
                  key={badge}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                  style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-secondary)' }}
                >
                  {badge}
                </span>
              ),
            )}
          </div>
        </div>
      </SectionCard>

      {/* Versões */}
      <SectionCard
        icon={<Rocket className="h-4.5 w-4.5" />}
        title="Versões Propostas"
        description="Roadmap de evolução do projeto"
      >
        <div className="flex flex-col gap-3">
          {VERSIONS.map((version) => (
            <div
              key={version.tag}
              className="rounded-xl p-3.5"
              style={{
                background: 'var(--bg-surface-hover)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="text-[11px] font-extrabold px-2 py-0.5 rounded-md flex-shrink-0"
                    style={{ background: 'var(--bg-surface)', color: 'var(--primary)' }}
                  >
                    {version.tag}
                  </span>
                  <span className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                    {version.name}
                  </span>
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    background:
                      version.status === 'Atual'
                        ? 'rgba(16,185,129,0.12)'
                        : version.status === 'Proposto'
                          ? 'rgba(139,92,246,0.12)'
                          : 'rgba(100,116,139,0.12)',
                    color:
                      version.status === 'Atual'
                        ? '#34D399'
                        : version.status === 'Proposto'
                          ? '#A78BFA'
                          : 'var(--text-secondary)',
                  }}
                >
                  {version.status}
                </span>
              </div>
              <ul className="flex flex-col gap-1.5">
                {version.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" style={{ color: 'var(--primary)' }} />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Apoio coletivo */}
      <SectionCard
        icon={<HeartHandshake className="h-4.5 w-4.5" />}
        title="Apoio Coletivo"
        description="Ajude o Arandu a continuar evoluindo"
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            O Arandu é um projeto de código aberto mantido com dedicação. Se você gostou da
            plataforma e quer apoiar financeiramente o desenvolvimento contínuo — cobrindo
            servidores, infraestrutura e novas funcionalidades — sua contribuição faz toda
            a diferença. 💜
          </p>
          <div
            className="flex items-center gap-3 p-3.5 rounded-xl border-2 border-dashed"
            style={{
              borderColor: 'var(--border-color)',
              background: 'var(--bg-surface)',
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-secondary)' }}
            >
              <Lock className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Chave PIX
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Em breve — a chave PIX para doações diretas será divulgada aqui.
              </p>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Notas de atualização */}
      <SectionCard
        icon={<Sparkles className="h-4.5 w-4.5" />}
        title="Notas de Atualização"
        description="O que chegou em cada atualização"
      >
        <div className="flex flex-col gap-3">
          {RELEASE_NOTES.map((release) => (
            <div
              key={release.version}
              className="rounded-xl p-3.5"
              style={{
                background: 'var(--bg-surface-hover)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm font-heading font-bold" style={{ color: 'var(--text-primary)' }}>
                  {release.version}
                </span>
                <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
                  {release.date}
                </span>
              </div>
              <ul className="flex flex-col gap-1.5">
                {release.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <span
                      className="w-1.5 h-1.5 mt-1.5 rounded-full flex-shrink-0"
                      style={{ background: 'var(--primary)' }}
                    />
                    <span className="leading-relaxed">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </SectionCard>

      <p className="text-center text-[11px] pb-2" style={{ color: 'var(--text-secondary)' }}>
        Arandu • Plataforma de Estudos Inteligente
      </p>
    </div>
  );
};

export default AboutTab;
