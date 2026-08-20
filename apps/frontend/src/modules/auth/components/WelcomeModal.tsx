import { useState } from 'react';
import { BookOpen, Heart, AlertTriangle } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal.tsx';
import { Button } from '../../../components/ui/Button.tsx';

const STORAGE_KEY = 'arandu-welcome-dismissed';

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(() => !localStorage.getItem(STORAGE_KEY));
  const [dontShowAgain, setDontShowAgain] = useState(false);

  function handleClose() {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    setIsOpen(false);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title=""
      size="md"
      scrollable={false}
    >
      <div className="flex flex-col items-center text-center gap-5 -mt-1">
        {/* Ícone */}
        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 dark:bg-brand-400/15 flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-brand-500 dark:text-brand-400" />
        </div>

        {/* Título */}
        <div>
          <h2 className="text-2xl font-heading font-bold" style={{ color: 'var(--text-primary)' }}>
            Bem-vindo ao Arandu!
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Que bom ter você aqui. Vamos começar?
          </p>
        </div>

        {/* Beta */}
        <div
          className="flex items-start gap-2.5 w-full rounded-xl px-4 py-3 text-left text-sm"
          style={{
            background: 'var(--bg-surface-hover)',
            color: 'var(--text-secondary)',
          }}
        >
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
          <span>
            O Arandu ainda está em <strong className="text-amber-600 dark:text-amber-400">versão beta</strong>.
            Alguns recursos podem conter bugs ou mudar em atualizações futuras. Sua compreensão é muito importante!
          </span>
        </div>

        {/* Agradecimento */}
        <div
          className="flex items-start gap-2.5 w-full rounded-xl px-4 py-3 text-left text-sm"
          style={{
            background: 'var(--bg-surface-hover)',
            color: 'var(--text-secondary)',
          }}
        >
          <Heart className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-500" />
          <span>
            Obrigado por fazer parte desta comunidade e apoiar o projeto. Cada usuário ajuda a tornar o Arandu melhor para todos!
          </span>
        </div>

        {/* Checkbox */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none text-sm" style={{ color: 'var(--text-secondary)' }}>
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-brand-500 focus:ring-brand-500 cursor-pointer"
          />
          Não mostrar novamente
        </label>

        {/* Botão */}
        <Button variant="primary" size="lg" onClick={handleClose} className="w-full mt-1">
          Começar
        </Button>
      </div>
    </Modal>
  );
}
