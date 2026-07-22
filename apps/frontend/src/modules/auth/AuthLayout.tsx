import React from "react";
import { Brain } from "lucide-react";
import { Card } from "../../components/ui/Card.tsx";

interface AuthLayoutProps {
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

/**
 * AuthLayout — Layout compartilhado entre Login e Register.
 * Elimina ~80% de duplicação entre as duas views.
 */
export const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  children,
  footer,
}) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-tr from-slate-100 via-slate-50 to-brand-50/30 dark:from-dark-950 dark:via-dark-900 dark:to-brand-950/10 p-4 transition-all duration-300">
      {/* Background radial effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-teal/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/25 mb-3 transition-transform hover:scale-105 duration-300">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-slate-900 dark:text-dark-50 tracking-tight m-0">
            Arandu
          </h1>
          <p className="text-slate-500 dark:text-dark-300 mt-2 text-center text-sm font-medium">
            Seu copiloto inteligente para resumos e flashcards
          </p>
        </div>

        {/* Card */}
        <Card className="glass shadow-2xl px-6 py-6 sm:px-8 sm:py-8 border border-white/20 dark:border-white/5 rounded-3xl">
          <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-dark-50 mb-5">
            {title}
          </h2>
          {children}
          <div className="mt-6 text-center text-sm text-slate-500 dark:text-dark-300">
            {footer}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AuthLayout;
