import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Menu } from 'lucide-react';
import type { Breadcrumb } from '../app-header.types';

interface HeaderTitleProps {
  breadcrumbs: Breadcrumb[];
  pageConfig: {
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
  };
  onMenuClick: () => void;
}

export const HeaderTitle: React.FC<HeaderTitleProps> = ({ breadcrumbs, pageConfig, onMenuClick }) => {
  const navigate = useNavigate();
  const PageIcon = pageConfig.icon;

  return (
    <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-shrink">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-600 dark:text-dark-200"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Back button */}
      {breadcrumbs.length > 0 && (
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-600 dark:text-dark-200 transition-colors cursor-pointer"
          title="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}

      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-brand-50 dark:bg-brand-950/20 flex items-center justify-center text-brand-500 flex-shrink-0">
          <PageIcon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>

        <div className="min-w-0">
          <h2 className="text-base sm:text-xl font-heading font-bold text-slate-800 dark:text-dark-50 leading-tight truncate max-w-[120px] sm:max-w-none">
            {pageConfig.title}
          </h2>

          {breadcrumbs.length > 0 ? (
            <nav className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 dark:text-dark-400">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.path}>
                  {idx > 0 && <span className="text-slate-300 dark:text-dark-600">/</span>}
                  <Link
                    to={crumb.path}
                    className="hover:text-brand-500 transition-colors truncate max-w-[120px]"
                  >
                    {crumb.label}
                  </Link>
                </React.Fragment>
              ))}
            </nav>
          ) : (
            <p className="hidden sm:block text-xs text-slate-400 dark:text-dark-400 leading-tight">
              {pageConfig.subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
