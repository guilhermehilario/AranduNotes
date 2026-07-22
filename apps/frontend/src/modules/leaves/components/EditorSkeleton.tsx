import React from 'react';
import { Skeleton } from '../../../components/ui/Skeleton.tsx';

/**
 * EditorSkeleton — exibido enquanto os dados da folha (leaf) estão sendo carregados.
 * Espelha fielmente o layout do EditorView para eliminar qualquer flash visual:
 * - Header com breadcrumb e indicador de status
 * - Painel dividido: editor à esquerda, painel de IA à direita
 * - No editor: título, toolbar, linhas de conteúdo animadas
 * - No painel IA: abas + conteúdo esqueletado
 */
export const EditorSkeleton: React.FC = () => {
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
      {/* Top Header Skeleton */}
      <div className="flex items-center justify-between border-b border-slate-150 dark:border-dark-800 pb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Skeleton width={18} height={18} variant="rounded" />
          <Skeleton width={160} height={14} />
        </div>
        <Skeleton width={80} height={14} />
      </div>

      {/* Split Pane */}
      <div className="flex-grow flex flex-col lg:flex-row gap-6 min-h-0">
        {/* Lado Esquerdo — Editor */}
        <div className="flex-grow flex flex-col bg-white dark:bg-dark-900 border border-slate-100 dark:border-dark-800 rounded-3xl p-6 min-w-0">
          {/* Título */}
          <Skeleton width="60%" height={32} className="mb-6" variant="rounded" />

          {/* Toolbar */}
          <div className="flex items-center gap-1 pb-3 mb-4 border-b border-slate-100 dark:border-dark-800/80">
            <Skeleton width={36} height={36} variant="rounded" />
            <Skeleton width={36} height={36} variant="rounded" />
            <Skeleton width={1} height={20} variant="rectangular" className="mx-1" />
            <Skeleton width={36} height={36} variant="rounded" />
            <Skeleton width={36} height={36} variant="rounded" />
            <Skeleton width={36} height={36} variant="rounded" />
            <Skeleton width={36} height={36} variant="rounded" />
            <Skeleton width={36} height={36} variant="rounded" />
            <Skeleton width={1} height={20} variant="rectangular" className="mx-1" />
            <Skeleton width={72} height={36} variant="rounded" />
            <Skeleton width={1} height={20} variant="rectangular" className="mx-1" />
            <Skeleton width={36} height={36} variant="rounded" />
            <Skeleton width={36} height={36} variant="rounded" />
            <Skeleton width={1} height={20} variant="rectangular" className="mx-1" />
            <Skeleton width={36} height={36} variant="rounded" />
            <Skeleton width={36} height={36} variant="rounded" />
            <Skeleton width={36} height={36} variant="rounded" />
            <Skeleton width={1} height={20} variant="rectangular" className="mx-1" />
            <Skeleton width={36} height={36} variant="rounded" />
            <Skeleton width={36} height={36} variant="rounded" />
          </div>

          {/* Linhas de conteúdo animadas */}
          <div className="flex flex-col gap-3 flex-grow">
            <Skeleton width="92%" height={14} />
            <Skeleton width="78%" height={14} />
            <Skeleton width="85%" height={14} />
            <Skeleton width="45%" height={14} className="mb-3" />

            <Skeleton width="35%" height={22} className="mb-1" />
            <Skeleton width="88%" height={14} />
            <Skeleton width="72%" height={14} />
            <Skeleton width="90%" height={14} />
            <Skeleton width="50%" height={14} className="mb-3" />

            <Skeleton width="40%" height={22} className="mb-1" />
            <Skeleton width="82%" height={14} />
            <Skeleton width="65%" height={14} />
            <Skeleton width="76%" height={14} />
            <Skeleton width="30%" height={14} />
          </div>
        </div>

        {/* Lado Direito — Painel de IA */}
        <div className="w-full lg:w-[450px] flex flex-col bg-white dark:bg-dark-900 border border-slate-150 dark:border-dark-800 rounded-3xl overflow-hidden flex-shrink-0 min-h-0">
          {/* Abas */}
          <div className="flex border-b border-slate-100 dark:border-dark-800/60 flex-shrink-0 bg-slate-50 dark:bg-dark-950/20">
            <div className="flex-1 flex justify-center py-4">
              <Skeleton width={60} height={14} />
            </div>
            <div className="flex-1 flex justify-center py-4">
              <Skeleton width={70} height={14} />
            </div>
            <div className="flex-1 flex justify-center py-4">
              <Skeleton width={90} height={14} />
            </div>
          </div>

          {/* Conteúdo do painel */}
          <div className="flex-grow p-6 flex flex-col gap-4">
            {/* Ícone decorativo */}
            <div className="flex justify-center mt-4 mb-2">
              <Skeleton width={48} height={48} variant="rounded" />
            </div>
            {/* Título */}
            <div className="flex justify-center">
              <Skeleton width={180} height={18} />
            </div>
            {/* Descrição */}
            <div className="flex flex-col items-center gap-2">
              <Skeleton width="80%" height={12} />
              <Skeleton width="60%" height={12} />
            </div>
            {/* Botão */}
            <div className="flex justify-center mt-4">
              <Skeleton width={200} height={40} variant="rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
