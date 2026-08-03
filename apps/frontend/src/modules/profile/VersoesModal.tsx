import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal.tsx';
import { VERSIONS } from './about.constants';

interface VersoesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * VersoesModal — conteúdo completo do roadmap ("Versões Propostas").
 * Abre a partir do card compacto na aba "Sobre"; o conteúdo foi movido
 * para cá para deixar a aba Sobre mais enxuta.
 */
export const VersoesModal: React.FC<VersoesModalProps> = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Versões Propostas" size="lg">
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
  </Modal>
);

export default VersoesModal;
