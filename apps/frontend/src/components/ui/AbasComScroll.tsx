import React from 'react';

export interface AbasComScrollTab<T extends string = string> {
  id: T;
  label: string;
  icon?: React.FC<{ className?: string }>;
}

interface AbasComScrollProps<T extends string = string> {
  /** Configuração das abas exibidas na barra sticky */
  tabs: AbasComScrollTab<T>[];
  /** Aba ativa (id) */
  activeTab: T;
  /** Callback ao trocar de aba */
  onTabChange: (tab: T) => void;
  /** Conteúdo renderizado abaixo da barra (usar renderização condicional por aba) */
  children: React.ReactNode;
  className?: string;
  /** Rótulo acessível do tablist (padrão: "Abas") */
  label?: string;
}

/**
 * AbasComScroll — barra de abas fixa + corpo com scroll único.
 *
 * A barra de abas ocupa uma região própria no topo (`flex-shrink-0`, fundo
 * opaco) e o conteúdo ativo rola numa região própria logo abaixo dela
 * (`flex-1 overflow-y-auto`) — o conteúdo NUNCA passa por trás nem por cima
 * da barra: não há sobreposição, então não há risco de vazamento por
 * transparência ou z-index.
 *
 * Contrato de uso: renderize DENTRO do body de um `<Modal />` e passe
 * `scrollable={false}` ao Modal — o body vira `flex flex-col min-h-0
 * overflow-hidden` e o scroll fica somente na área interna do conteúdo.
 * A área de scroll é a altura inteira do body abaixo da barra (ótimo no mobile).
 *
 * @example
 * type MinhaAba = "perfil" | "config";
 * const TABS: AbasComScrollTab<MinhaAba>[] = [...];
 * <Modal isOpen onClose={onClose} title="" size="lg" scrollable={false}>
 *   <AbasComScroll<MinhaAba> tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}>
 *     {activeTab === "perfil" && <PerfilTab />}
 *     {activeTab === "config" && <ConfigTab />}
 *   </AbasComScroll>
 * </Modal>
 *
 * ⚠️ Dica de tipagem: declare o array de abas como `AbasComScrollTab<MinhaAba>[]`
 * (parametrizado com a união de ids) para que `T` seja inferido corretamente.
 * Se `onTabChange` for um `Dispatch<SetStateAction<T>>`, a inferência pode cair
 * em `string` — nesse caso passe o tipo explícito no JSX: `<AbasComScroll<MinhaAba> ...>`.
 *
 * Limitações conhecidas: (1) como o conteúdo é renderizado condicionalmente
 * (`{activeTab === "x" && ...}`), os `aria-controls` de abas inativas apontam
 * para painéis que não existem no DOM — trade-off aceitável do design;
 * (2) os ids gerados são `tab-${id}`/`panel-${id}`: se dois `AbasComScroll`
 * coexistirem na mesma página (ex.: dois modais), use ids de aba únicos entre
 * as instâncias (namespace) para evitar colisão — o prop `label` só altera o
 * nome acessível, não os ids.
 */
export const AbasComScroll = <T extends string>({
  tabs,
  activeTab,
  onTabChange,
  children,
  className = '',
  label = 'Abas',
}: AbasComScrollProps<T>) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentIndex = tabs.findIndex((t) => t.id === activeTab);
    let nextIndex: number | null = null;
    if (e.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
    else if (e.key === 'ArrowLeft')
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') nextIndex = 0;
    else if (e.key === 'End') nextIndex = tabs.length - 1;
    if (nextIndex !== null) {
      e.preventDefault();
      const nextId = tabs[nextIndex].id;
      onTabChange(nextId);
      // Todos os botões de aba estão sempre no DOM → focar é síncrono e seguro
      document.getElementById(`tab-${nextId}`)?.focus();
    }
  };

  return (
    // Barra flex-shrink-0 no topo + painel flex-1 com scroll próprio: o
    // conteúdo nunca passa por trás nem por cima da barra (sem sobreposição)
    <div className={`flex flex-col flex-1 min-h-0 ${className}`}>
      {/* Tab bar fixa (sticky) no topo — sem scroll próprio vertical */}
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={handleKeyDown}
        className="flex flex-shrink-0 -mx-4 sm:-mx-6 px-3 sm:px-6 mb-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-controls={`panel-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              aria-selected={isActive}
              className={`relative flex items-center gap-1.5 sm:gap-2 pb-4 px-2.5 sm:px-4 shrink-0 whitespace-nowrap font-heading font-bold text-xs sm:text-sm tracking-wide transition-all duration-300 cursor-pointer ${
                isActive
                  ? 'text-brand-500'
                  : 'hover:opacity-80 text-[var(--text-secondary)]'
              }`}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {tab.label}
              <span
                className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'bg-brand-500 scale-x-100'
                    : 'bg-transparent scale-x-0'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Conteúdo ativo — key força remount para repetir a animação tab-enter */}
      <div
        key={activeTab}
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        tabIndex={0}
        className="tab-enter flex-1 min-h-0 overflow-y-auto overscroll-contain"
      >
        {children}
      </div>
    </div>
  );
};

export default AbasComScroll;
