import React from 'react';
import { Sparkles } from 'lucide-react';
import { RELEASE_NOTES } from './about.constants';

/**
 * UpdatesTab — aba "Atualizações" do perfil.
 * Conteúdo movido da seção "Notas de Atualização" da aba Sobre: exibe apenas
 * a versão e o conteúdo (sem data).
 */
export const UpdatesTab: React.FC = () => (
  <div className="flex flex-col gap-5 sm:gap-7">
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
          <Sparkles className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-heading font-bold" style={{ color: 'var(--text-primary)' }}>
            Notas de Atualização
          </h4>
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            O que chegou em cada atualização
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {RELEASE_NOTES.map((release, index) => (
          <div
            key={`${release.version}-${index}`}
            className="rounded-xl p-3.5"
            style={{
              background: 'var(--bg-surface-hover)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-heading font-bold" style={{ color: 'var(--text-primary)' }}>
                {release.version}
              </span>
              {release.latest && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{
                    background: 'rgba(16,185,129,0.12)',
                    color: '#34D399',
                  }}
                >
                  Mais recente
                </span>
              )}
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
    </div>
  </div>
);

export default UpdatesTab;
