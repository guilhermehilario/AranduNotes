import React from 'react';

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
    <div
      className={`flex flex-col items-center justify-center text-center p-12 min-h-[30vh] border border-dashed rounded-2xl ${className}`}
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{
          background: 'var(--bg-surface-hover)',
          color: 'var(--primary)',
        }}
      >
        {icon}
      </div>
      <h3 className="text-md font-heading font-bold" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>
      <p className="text-sm mt-1 max-w-sm" style={{ color: 'var(--text-secondary)' }}>
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;
