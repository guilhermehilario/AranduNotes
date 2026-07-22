import React from 'react';
import { Card } from './Card.tsx';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * EmptyState — Padrão de estado vazio usado em toda a aplicação.
 * Consolida duplicações de código entre DashboardView, NotebookView,
 * TagsManagementView, BookmarksView, TrashView, ArchivedLeavesView e AISidebar.
 *
 * @example
 * <EmptyState
 *   icon={<BookOpen className="h-8 w-8" />}
 *   title="Nenhum caderno criado"
 *   description="Comece criando seu primeiro caderno."
 *   action={<Button onClick={...}>Criar</Button>}
 * />
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <Card
      className={`flex flex-col items-center justify-center text-center p-12 min-h-[30vh] border border-dashed border-slate-200 dark:border-dark-800 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/20 flex items-center justify-center text-brand-500 mb-4">
        {icon}
      </div>
      <h3 className="text-md font-heading font-bold text-slate-850 dark:text-dark-100">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-dark-350 mt-1 max-w-sm">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
};

export default EmptyState;
