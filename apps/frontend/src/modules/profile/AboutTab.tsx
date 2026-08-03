import React, { useState } from 'react';
import {
  Info,
  Rocket,
  HeartHandshake,
  Lock,
  ChevronRight,
} from 'lucide-react';
import { VersoesModal } from './VersoesModal';

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

export const AboutTab: React.FC = () => {
  const [showVersions, setShowVersions] = useState(false);

  return (
    <div className="flex flex-col gap-5 sm:gap-7">
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

      {/* Versões Propostas — card compacto que abre o roadmap completo em um modal */}
      <button
        type="button"
        onClick={() => setShowVersions(true)}
        aria-label="Abrir versões propostas"
        className="flex items-center gap-3 w-full text-left rounded-2xl p-4 sm:p-5 transition-all cursor-pointer group"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-color)';
        }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform"
          style={{ background: 'var(--bg-surface-hover)', color: 'var(--primary)' }}
        >
          <Rocket className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-sm font-heading font-bold block" style={{ color: 'var(--text-primary)' }}>
            Versões Propostas
          </span>
          <span className="text-xs mt-0.5 block" style={{ color: 'var(--text-secondary)' }}>
            Roadmap de evolução do projeto
          </span>
        </div>
        <ChevronRight
          className="h-4 w-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5"
          style={{ color: 'var(--text-secondary)' }}
        />
      </button>

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

      <p className="text-center text-[11px] pb-2" style={{ color: 'var(--text-secondary)' }}>
        Arandu • Plataforma de Estudos Inteligente
      </p>

      {/* Roadmap completo */}
      <VersoesModal isOpen={showVersions} onClose={() => setShowVersions(false)} />
    </div>
  );
};

export default AboutTab;
